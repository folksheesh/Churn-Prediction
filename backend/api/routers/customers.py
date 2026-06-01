from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import pandas as pd
import io
from datetime import datetime, timedelta
from backend.core.database import get_db
from backend.core.models import Customer, ActivityLog, UploadAttempt
from backend.api.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse, CustomerListResponse
from backend.api.services.ml_service import run_single_prediction, run_batch_prediction
import uuid

from fastapi_cache.decorator import cache

router = APIRouter()

# ── Upload Rate Limiting ─────────────────────────────────────────────────────
UPLOAD_MAX_FAILED = 5
UPLOAD_WINDOW_MINUTES = 10

def check_upload_rate_limit(db: Session, user_email: str = "anonymous"):
    """Check if user has exceeded upload attempt limit."""
    cutoff = datetime.utcnow() - timedelta(minutes=UPLOAD_WINDOW_MINUTES)
    recent_failures = db.query(UploadAttempt).filter(
        UploadAttempt.user_email == user_email,
        UploadAttempt.status == "failed",
        UploadAttempt.attempted_at >= cutoff
    ).count()
    
    if recent_failures >= UPLOAD_MAX_FAILED:
        raise HTTPException(
            status_code=429,
            detail={
                "message": "Upload limit exceeded. Please try again later.",
                "errors": [
                    f"You have made {recent_failures} failed upload attempts in the last {UPLOAD_WINDOW_MINUTES} minutes.",
                    f"Maximum {UPLOAD_MAX_FAILED} failed attempts allowed per {UPLOAD_WINDOW_MINUTES}-minute window.",
                    "Please wait a few minutes before trying again."
                ]
            }
        )

def record_upload_attempt(db: Session, user_email: str, filename: str, status: str, error_message: str = None):
    """Record an upload attempt in the database."""
    attempt = UploadAttempt(
        user_email=user_email,
        filename=filename,
        status=status,
        error_message=error_message
    )
    db.add(attempt)
    db.commit()

@router.get("/", response_model=CustomerListResponse)
@cache(expire=60)
def get_customers(
    skip: int = 0, 
    limit: int = 50, 
    search: Optional[str] = None,
    risk: Optional[str] = None,
    campaign: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Customer)
    if search:
        query = query.filter(
            (Customer.name.ilike(f"%{search}%")) | 
            (Customer.id.ilike(f"%{search}%"))
        )
    if risk:
        query = query.filter(Customer.churn_risk == risk)
    if campaign:
        query = query.filter(Customer.retention_campaign == campaign)
        
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    
    return {"total": total, "items": items}

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: str, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.post("/", response_model=CustomerResponse)
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    db_customer = db.query(Customer).filter(Customer.id == customer.id).first()
    if db_customer:
        raise HTTPException(status_code=400, detail="Customer ID already exists")
    
    # Optional: Auto-run ML prediction on creation
    customer_dict = customer.dict(exclude_none=True)
    if "api_calls_90d" in customer_dict: # basic check if ML features exist
        try:
            pred_result = run_single_prediction(customer_dict)
            prob = pred_result.get("probability", 0.0)
            customer_dict["churn_probability"] = float(prob)
            customer_dict["churn_risk"] = "High" if prob > 0.7 else "Medium" if prob > 0.4 else "Low"
        except Exception as e:
            print(f"ML Prediction failed during creation: {e}")

    new_customer = Customer(**customer_dict)
    db.add(new_customer)
    
    # Log activity
    log = ActivityLog(action="Customer Created", user="System", details=f"Customer {customer.id} added")
    db.add(log)
    
    db.commit()
    db.refresh(new_customer)
    return new_customer

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(customer_id: str, customer_update: CustomerUpdate, db: Session = Depends(get_db)):
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    update_data = customer_update.dict(exclude_unset=True)
    
    # If key features updated, re-run prediction
    merged_data = {**db_customer.__dict__, **update_data}
    if any(k in update_data for k in ["api_calls_90d", "logins_90d", "days_since_active", "tickets_opened_90d"]):
        try:
            # Drop sqlalchemy state
            merged_data.pop("_sa_instance_state", None)
            pred_result = run_single_prediction(merged_data)
            prob = pred_result.get("probability", 0.0)
            update_data["churn_probability"] = float(prob)
            update_data["churn_risk"] = "High" if prob > 0.7 else "Medium" if prob > 0.4 else "Low"
        except Exception as e:
            print(f"ML Prediction failed during update: {e}")

    for key, value in update_data.items():
        setattr(db_customer, key, value)
        
    log = ActivityLog(action="Customer Updated", user="System", details=f"Customer {customer_id} updated")
    db.add(log)
    
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.delete("/{customer_id}")
def delete_customer(customer_id: str, db: Session = Depends(get_db)):
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    db.delete(db_customer)
    
    log = ActivityLog(action="Customer Deleted", user="System", details=f"Customer {customer_id} deleted")
    db.add(log)
    
    db.commit()
    return {"message": "Customer deleted successfully"}

@router.get("/csv/template")
def get_csv_template():
    # Define required headers for the model
    headers = [
        "id", "name", "age", "gender", "region_category", 
        "days_since_joined", "plan_tier", "status", "days_since_active", 
        "api_calls_90d", "logins_90d", "active_days_90d", 
        "avg_session_duration", "days_since_last_login", 
        "avg_frequency_login_days", "avg_transaction_value", 
        "points_in_wallet", "tickets_opened_90d", "feedback"
    ]
    
    # Create an empty DataFrame with these headers and one dummy row
    df = pd.DataFrame(columns=headers)
    df.loc[0] = ["CUST-001", "John Doe", 35, "Male", "North America", 120, "Pro", "Active", 2, 5000, 20, 15, 30.5, 5, 2.1, 150.0, 500, 1, "Great service"]
    
    stream = io.StringIO()
    df.to_csv(stream, index=False)
    
    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=customers_template.csv"
    return response

@router.post("/import")
async def import_customers_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    user_email = "anonymous"  # Will be replaced with auth user when token is provided
    
    # Check upload rate limit
    check_upload_rate_limit(db, user_email)
    
    allowed_extensions = ('.csv', '.xlsx', '.xls')
    if not file.filename.lower().endswith(allowed_extensions):
        record_upload_attempt(db, user_email, file.filename, "failed", "Unsupported file type")
        raise HTTPException(status_code=400, detail={
            "message": "This file type is not supported.",
            "errors": [
                "Please upload a file in .csv, .xlsx, or .xls format.",
                "You can download our template to see the correct format."
            ]
        })
    
    try:
        contents = await file.read()
        filename_lower = file.filename.lower()
        file_type = "Excel" if filename_lower.endswith(('.xlsx', '.xls')) else "CSV"

        # Read file based on extension
        try:
            if filename_lower.endswith('.xlsx') or filename_lower.endswith('.xls'):
                try:
                    df = pd.read_excel(io.BytesIO(contents), engine='openpyxl')
                except Exception as excel_err:
                    # Fallback: Many users rename .csv to .xlsx without converting format
                    try:
                        df = pd.read_csv(io.BytesIO(contents))
                    except Exception:
                        raise excel_err  # raise original if fallback fails
            else:
                df = pd.read_csv(io.BytesIO(contents))
        except Exception as parse_err:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": f"We couldn't open your {file_type} file.",
                    "errors": [
                        "The file might be damaged or saved in a format we don't support.",
                        "Try re-saving the file and uploading again, or use a different file."
                    ]
                }
            )

        # ─── Empty file detection ─────────────────────────────────────────
        if df.empty or len(df) == 0:
            raise HTTPException(
                status_code=422,
                detail={
                    "message": f"Your {file_type} file is empty — there's no data in it.",
                    "errors": [
                        "The file only has column headers but no customer data below them.",
                        "Please add at least one row of customer data and try again."
                    ]
                }
            )

        # Check if all rows are completely empty (NaN)
        non_empty_rows = df.dropna(how='all')
        if len(non_empty_rows) == 0:
            raise HTTPException(
                status_code=422,
                detail={
                    "message": f"Your {file_type} file has rows, but they're all blank.",
                    "errors": [
                        f"We found {len(df)} row(s) in the file, but none of them contain any data.",
                        "Please fill in the customer information and upload the file again."
                    ]
                }
            )
        df = non_empty_rows.reset_index(drop=True)
        # Auto-generate id column if missing
        if 'id' not in df.columns:
            df['id'] = [f"CUST-{str(uuid.uuid4())[:8].upper()}" for _ in range(len(df))]
        
        # Auto-generate name column if missing
        if 'name' not in df.columns:
            df['name'] = [f"Customer {i}" for i in df['id']]

        # ─── Required column validation ───────────────────────────────────────
        # These are the columns required by the ML model for prediction.
        # 'id' and 'name' are auto-generated so they are not required from the file.
        REQUIRED_COLUMNS = [
            "age", "gender", "region_category", "days_since_joined",
            "plan_tier", "days_since_active", "api_calls_90d", "logins_90d",
            "active_days_90d", "avg_session_duration", "days_since_last_login",
            "avg_frequency_login_days", "avg_transaction_value",
            "points_in_wallet", "tickets_opened_90d"
        ]
        # Minimum columns that MUST be present (at least age + some activity metrics)
        MINIMUM_REQUIRED = [
            "age", "days_since_active", "logins_90d", "api_calls_90d"
        ]

        uploaded_columns = [c.strip() for c in df.columns.tolist()]
        df.columns = uploaded_columns  # normalize whitespace in column names

        missing_required = [col for col in REQUIRED_COLUMNS if col not in uploaded_columns]
        missing_minimum = [col for col in MINIMUM_REQUIRED if col not in uploaded_columns]

        # If none of the minimum required columns are present, this is likely a wrong file
        if len(missing_minimum) == len(MINIMUM_REQUIRED):
            # None of the expected columns found — completely wrong file structure
            raise HTTPException(
                status_code=422,
                detail={
                    "message": f"Wrong file — this doesn't look like a customer data file.",
                    "errors": [
                        "We couldn't find any of the expected columns (like age, logins_90d, api_calls_90d, etc.).",
                        f"Your file has these columns: {', '.join(uploaded_columns[:10])}" + (" ..." if len(uploaded_columns) > 10 else "") + ".",
                        "Please download our template first, fill it in with your customer data, then upload it."
                    ]
                }
            )

        # If some minimum required columns are missing
        if missing_minimum:
            COLUMN_LABELS = {
                "age": "Age", "gender": "Gender", "region_category": "Region Category",
                "days_since_joined": "Customer Tenure (Days)", "plan_tier": "Plan Tier",
                "days_since_active": "Days Since Last Activity", "api_calls_90d": "API Calls (90d)",
                "logins_90d": "Logins (90d)", "active_days_90d": "Active Days (90d)",
                "avg_session_duration": "Avg Session Duration",
                "days_since_last_login": "Days Since Last Login",
                "avg_frequency_login_days": "Avg Login Frequency (Days)",
                "avg_transaction_value": "Avg Transaction Value",
                "points_in_wallet": "Points in Wallet",
                "tickets_opened_90d": "Support Tickets (90d)"
            }
            missing_labels = [f"'{COLUMN_LABELS.get(c, c)}' ({c})" for c in missing_minimum]
            raise HTTPException(
                status_code=422,
                detail={
                    "message": "Your file is missing some important columns that we need.",
                    "errors": [
                        f"Missing column: {label}" for label in missing_labels
                    ] + [
                        "Without these columns, we can't run the churn prediction.",
                        "Tip: Download our template to see all the columns you need to include."
                    ]
                }
            )

        # Warn about other missing (non-minimum) columns but still allow upload
        # (the ML model will fill them with defaults)
        if missing_required and not missing_minimum:
            # All minimum columns are present, some optional ones are missing — allow with info
            pass

        # ─── Human-readable field labels for error messages ───────────────────
        FIELD_LABELS = {
            "age":                      "Age",
            "days_since_joined":        "Customer Tenure",
            "days_since_last_login":    "Days Since Last Login",
            "days_since_active":        "Days Since Last Activity",
            "avg_session_duration":     "Avg Session Duration",
            "avg_transaction_value":    "Avg Transaction Value (Monthly Subscription Value)",
            "avg_frequency_login_days": "Avg Login Frequency (Days)",
            "points_in_wallet":         "Points in Wallet",
            "logins_90d":               "Logins (last 90 days)",
            "active_days_90d":          "Active Days (last 90 days)",
            "api_calls_90d":            "API Calls (last 90 days)",
            "session_minutes_90d":      "Session Minutes (last 90 days)",
            "tickets_opened_90d":       "Support Tickets (last 90 days)",
        }

        def lbl(col: str) -> str:
            return FIELD_LABELS.get(col, f"'{col}'")

        # ─── Data type validation (detect text in numeric columns) ─────────
        NUMERIC_COLUMNS = [
            "age", "days_since_joined", "days_since_last_login", "days_since_active",
            "avg_session_duration", "avg_transaction_value", "avg_frequency_login_days",
            "points_in_wallet", "logins_90d", "active_days_90d", "api_calls_90d",
            "session_minutes_90d", "tickets_opened_90d"
        ]
        type_errors = []
        for col in NUMERIC_COLUMNS:
            if col not in df.columns:
                continue
            # Try to coerce the entire column to numeric; non-convertible values become NaN
            original_non_null = df[col].dropna()
            if len(original_non_null) == 0:
                continue
            coerced = pd.to_numeric(df[col], errors='coerce')
            # Find rows where original is not null but coerced became NaN (i.e., text values)
            bad_mask = df[col].notna() & coerced.isna()
            bad_rows = df[bad_mask]
            for idx, bad_row in bad_rows.iterrows():
                row_num = idx + 2  # +2: 0-indexed + header row
                type_errors.append(
                    f"Row {row_num} — '{lbl(col)}' should be a number, but we found text: '{bad_row[col]}'. "
                    f"Please replace it with a number (for example: 0, 25, or 100.5)."
                )

        if type_errors:
            raise HTTPException(
                status_code=422,
                detail={
                    "message": "Some columns have text where there should be numbers.",
                    "errors": type_errors[:15]
                }
            )

        # Coerce all numeric columns to numeric types for downstream validation
        for col in NUMERIC_COLUMNS:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')

        # ─── Per-row field validation ─────────────────────────────────────────
        errors = []
        for index, row in df.iterrows():
            row_num = index + 2  # +2: 0-indexed + header row

            # Age: required, integer 0–120
            if 'age' in df.columns:
                if pd.isna(row['age']):
                    errors.append(f"Row {row_num}: '{lbl('age')}' is empty — please fill in a value.")
                elif not (0 <= row['age'] <= 120):
                    errors.append(f"Row {row_num}: '{lbl('age')}' should be between 0 and 120, but you entered '{row['age']}'.")

            # Customer Tenure: required, 0–3650 days (≈ 0–120 months)
            if 'days_since_joined' in df.columns:
                if pd.isna(row['days_since_joined']):
                    errors.append(f"Row {row_num}: '{lbl('days_since_joined')}' is empty — please fill in a value.")
                elif not (0 <= row['days_since_joined'] <= 3650):
                    errors.append(f"Row {row_num}: '{lbl('days_since_joined')}' should be between 0 and 3650 days, but you entered '{row['days_since_joined']}'.")

            # Days Since Last Login: non-negative
            if 'days_since_last_login' in df.columns and pd.notna(row['days_since_last_login']):
                if row['days_since_last_login'] < 0:
                    errors.append(f"Row {row_num}: '{lbl('days_since_last_login')}' can't be negative — please use 0 or higher.")

            # Days Since Last Activity: non-negative
            if 'days_since_active' in df.columns and pd.notna(row['days_since_active']):
                if row['days_since_active'] < 0:
                    errors.append(f"Row {row_num}: '{lbl('days_since_active')}' can't be negative — please use 0 or higher.")

            # Avg Session Duration: non-negative
            if 'avg_session_duration' in df.columns and pd.notna(row['avg_session_duration']):
                if row['avg_session_duration'] < 0:
                    errors.append(f"Row {row_num}: '{lbl('avg_session_duration')}' can't be negative — please use 0 or higher.")

            # Avg Transaction Value: non-negative
            if 'avg_transaction_value' in df.columns and pd.notna(row['avg_transaction_value']):
                if row['avg_transaction_value'] < 0:
                    errors.append(f"Row {row_num}: '{lbl('avg_transaction_value')}' can't be negative — please use 0 or higher.")

            # Avg Login Frequency: non-negative
            if 'avg_frequency_login_days' in df.columns and pd.notna(row['avg_frequency_login_days']):
                if row['avg_frequency_login_days'] < 0:
                    errors.append(f"Row {row_num}: '{lbl('avg_frequency_login_days')}' can't be negative — please use 0 or higher.")

            # Points in Wallet: non-negative
            if 'points_in_wallet' in df.columns and pd.notna(row['points_in_wallet']):
                if row['points_in_wallet'] < 0:
                    errors.append(f"Row {row_num}: '{lbl('points_in_wallet')}' can't be negative — please use 0 or higher.")

            # Logins (90d): non-negative
            if 'logins_90d' in df.columns and pd.notna(row['logins_90d']):
                if row['logins_90d'] < 0:
                    errors.append(f"Row {row_num}: '{lbl('logins_90d')}' can't be negative — please use 0 or higher.")

            # Active Days (90d): non-negative, cannot exceed logins_90d
            if 'active_days_90d' in df.columns and pd.notna(row['active_days_90d']):
                if row['active_days_90d'] < 0:
                    errors.append(f"Row {row_num}: '{lbl('active_days_90d')}' can't be negative — please use 0 or higher.")
                elif 'logins_90d' in df.columns and pd.notna(row['logins_90d']) and row['active_days_90d'] > row['logins_90d']:
                    errors.append(
                        f"Row {row_num}: '{lbl('active_days_90d')}' is {int(row['active_days_90d'])}, "
                        f"but that can't be more than '{lbl('logins_90d')}' which is {int(row['logins_90d'])}."
                    )

            # API Calls (90d): non-negative
            if 'api_calls_90d' in df.columns and pd.notna(row['api_calls_90d']):
                if row['api_calls_90d'] < 0:
                    errors.append(f"Row {row_num}: '{lbl('api_calls_90d')}' can't be negative — please use 0 or higher.")

            # Session Minutes (90d): non-negative
            if 'session_minutes_90d' in df.columns and pd.notna(row['session_minutes_90d']):
                if row['session_minutes_90d'] < 0:
                    errors.append(f"Row {row_num}: '{lbl('session_minutes_90d')}' can't be negative — please use 0 or higher.")

            # Support Tickets (90d): non-negative
            if 'tickets_opened_90d' in df.columns and pd.notna(row['tickets_opened_90d']):
                if row['tickets_opened_90d'] < 0:
                    errors.append(f"Row {row_num}: '{lbl('tickets_opened_90d')}' can't be negative — please use 0 or higher.")

        if errors:
            raise HTTPException(
                status_code=422,
                detail={
                    "message": "We found some problems with your data. Please fix them and try again.",
                    "errors": errors[:15]
                }
            )

        # Run ML batch prediction
        result_df = run_batch_prediction(df)
        
        customers_to_add = []
        for _, row in result_df.iterrows():
            row_dict = row.dropna().to_dict()
            
            # Extract ML results
            pred = row_dict.pop('prediction', None)
            prob = row_dict.pop('probability', None)
            label = row_dict.pop('label', None)
            
            if prob is not None:
                row_dict['churn_probability'] = float(prob)
                row_dict['churn_risk'] = "High" if prob > 0.7 else "Medium" if prob > 0.4 else "Low"
            
            # Check if customer exists (duplicate detection)
            cust_id = str(row_dict.get('id'))
            existing = db.query(Customer).filter(Customer.id == cust_id).first()
            if existing:
                # Update existing customer
                for k, v in row_dict.items():
                    if hasattr(existing, k):
                        setattr(existing, k, v)
            else:
                # Filter out dict keys not in Customer model
                valid_keys = {c.name for c in Customer.__table__.columns}
                filtered_dict = {k: v for k, v in row_dict.items() if k in valid_keys}
                customers_to_add.append(Customer(**filtered_dict))
                
        if customers_to_add:
            db.add_all(customers_to_add)
            
        # Log activity
        log = ActivityLog(
            action="CSV Import", 
            user=user_email, 
            details=f"Imported {len(df)} customers ({len(customers_to_add)} new, {len(df) - len(customers_to_add)} updated)",
            result="success"
        )
        db.add(log)
        
        db.commit()
        
        # Record successful upload attempt
        record_upload_attempt(db, user_email, file.filename, "success")

        # Build prediction results for frontend table display
        prediction_rows = []
        for _, row in result_df.iterrows():
            prob = row.get('probability', None)
            churn_prob_pct = round(float(prob) * 100, 1) if prob is not None else None
            risk = "High Risk" if prob > 0.7 else "Medium Risk" if prob > 0.4 else "Low Risk" if prob is not None else "Unknown"
            prediction_rows.append({
                "name":             str(row.get('name', row.get('id', 'Unknown'))),
                "churn_probability": churn_prob_pct,
                "risk_level":       risk,
                "region":           str(row.get('region_category', '-')),
                "plan_tier":        str(row.get('plan_tier', '-')),
                "age":              int(row['age']) if pd.notna(row.get('age')) else None,
            })

        total = len(prediction_rows)
        high   = sum(1 for r in prediction_rows if r['risk_level'] == 'High Risk')
        medium = sum(1 for r in prediction_rows if r['risk_level'] == 'Medium Risk')
        low    = sum(1 for r in prediction_rows if r['risk_level'] == 'Low Risk')
        avg_prob = round(sum(r['churn_probability'] for r in prediction_rows if r['churn_probability'] is not None) / total, 1) if total else 0

        return {
            "message": f"Successfully imported and predicted {total} customer(s).",
            "count":   total,
            "summary": {
                "total":        total,
                "high_risk":    high,
                "medium_risk":  medium,
                "low_risk":     low,
                "avg_churn_probability": avg_prob,
            },
            "results": prediction_rows,
        }
        
    except HTTPException as he:
        # Record failed upload attempt for non-rate-limit errors
        if he.status_code != 429:
            try:
                record_upload_attempt(db, user_email, file.filename, "failed", str(he.detail))
            except Exception:
                pass
        raise he
    except Exception as e:
        print(f"Error importing file: {e}")
        db.rollback()
        try:
            record_upload_attempt(db, user_email, file.filename, "failed", str(e))
        except Exception:
            pass
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Something went wrong while processing your file. Please double-check your file and try again.",
                "errors": [f"Error details: {str(e)}"]
            }
        )
