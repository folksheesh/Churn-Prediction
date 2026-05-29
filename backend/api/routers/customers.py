from fastapi import APIRouter, Depends, HTTPException, Query, File, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import pandas as pd
import io
from backend.core.database import get_db
from backend.core.models import Customer, ActivityLog
from backend.api.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse, CustomerListResponse
from backend.api.services.ml_service import run_single_prediction, run_batch_prediction
import uuid

router = APIRouter()

@router.get("/", response_model=CustomerListResponse)
def get_customers(
    skip: int = 0, 
    limit: int = 50, 
    search: Optional[str] = None,
    risk: Optional[str] = None,
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
    allowed_extensions = ('.csv', '.xlsx', '.xls')
    if not file.filename.lower().endswith(allowed_extensions):
        raise HTTPException(status_code=400, detail="Only CSV or Excel (.xlsx/.xls) files are allowed.")
    
    try:
        contents = await file.read()
        # Read file based on extension
        filename_lower = file.filename.lower()
        if filename_lower.endswith('.xlsx') or filename_lower.endswith('.xls'):
            df = pd.read_excel(io.BytesIO(contents), engine='openpyxl')
        else:
            df = pd.read_csv(io.BytesIO(contents))
        
        # Auto-generate id column if missing
        if 'id' not in df.columns:
            df['id'] = [f"CUST-{str(uuid.uuid4())[:8].upper()}" for _ in range(len(df))]
        
        # Auto-generate name column if missing
        if 'name' not in df.columns:
            df['name'] = [f"Customer {i}" for i in df['id']]

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

        # ─── Per-row field validation ─────────────────────────────────────────
        errors = []
        for index, row in df.iterrows():
            row_num = index + 2  # +2: 0-indexed + header row

            # Age: required, integer 0–120
            if 'age' in df.columns:
                if pd.isna(row['age']):
                    errors.append(f"Row {row_num}: {lbl('age')} is required and cannot be empty.")
                elif not isinstance(row['age'], (int, float)) or not (0 <= row['age'] <= 120):
                    errors.append(f"Row {row_num}: {lbl('age')} must be a number between 0 and 120 (got '{row['age']}').")

            # Customer Tenure: required, 0–3650 days (≈ 0–120 months)
            if 'days_since_joined' in df.columns:
                if pd.isna(row['days_since_joined']):
                    errors.append(f"Row {row_num}: {lbl('days_since_joined')} is required and cannot be empty.")
                elif not (0 <= row['days_since_joined'] <= 3650):
                    errors.append(f"Row {row_num}: {lbl('days_since_joined')} must be between 0 and 3650 days (0–120 months) (got '{row['days_since_joined']}').")

            # Days Since Last Login: non-negative
            if 'days_since_last_login' in df.columns and pd.notna(row['days_since_last_login']):
                if row['days_since_last_login'] < 0:
                    errors.append(f"Row {row_num}: {lbl('days_since_last_login')} must be 0 or greater (got '{row['days_since_last_login']}').")

            # Days Since Last Activity: non-negative
            if 'days_since_active' in df.columns and pd.notna(row['days_since_active']):
                if row['days_since_active'] < 0:
                    errors.append(f"Row {row_num}: {lbl('days_since_active')} must be 0 or greater (got '{row['days_since_active']}').")

            # Avg Session Duration: non-negative
            if 'avg_session_duration' in df.columns and pd.notna(row['avg_session_duration']):
                if row['avg_session_duration'] < 0:
                    errors.append(f"Row {row_num}: {lbl('avg_session_duration')} must be 0 or greater (got '{row['avg_session_duration']}').")

            # Avg Transaction Value: non-negative
            if 'avg_transaction_value' in df.columns and pd.notna(row['avg_transaction_value']):
                if row['avg_transaction_value'] < 0:
                    errors.append(f"Row {row_num}: {lbl('avg_transaction_value')} must be 0 or greater (got '{row['avg_transaction_value']}').")

            # Avg Login Frequency: non-negative
            if 'avg_frequency_login_days' in df.columns and pd.notna(row['avg_frequency_login_days']):
                if row['avg_frequency_login_days'] < 0:
                    errors.append(f"Row {row_num}: {lbl('avg_frequency_login_days')} must be 0 or greater (got '{row['avg_frequency_login_days']}').")

            # Points in Wallet: non-negative
            if 'points_in_wallet' in df.columns and pd.notna(row['points_in_wallet']):
                if row['points_in_wallet'] < 0:
                    errors.append(f"Row {row_num}: {lbl('points_in_wallet')} must be 0 or greater (got '{row['points_in_wallet']}').")

            # Logins (90d): non-negative
            if 'logins_90d' in df.columns and pd.notna(row['logins_90d']):
                if row['logins_90d'] < 0:
                    errors.append(f"Row {row_num}: {lbl('logins_90d')} must be 0 or greater (got '{row['logins_90d']}').")

            # Active Days (90d): non-negative, cannot exceed logins_90d
            if 'active_days_90d' in df.columns and pd.notna(row['active_days_90d']):
                if row['active_days_90d'] < 0:
                    errors.append(f"Row {row_num}: {lbl('active_days_90d')} must be 0 or greater (got '{row['active_days_90d']}').")
                elif 'logins_90d' in df.columns and pd.notna(row['logins_90d']) and row['active_days_90d'] > row['logins_90d']:
                    errors.append(
                        f"Row {row_num}: {lbl('active_days_90d')} ({int(row['active_days_90d'])}) "
                        f"cannot be greater than {lbl('logins_90d')} ({int(row['logins_90d'])})."
                    )

            # API Calls (90d): non-negative
            if 'api_calls_90d' in df.columns and pd.notna(row['api_calls_90d']):
                if row['api_calls_90d'] < 0:
                    errors.append(f"Row {row_num}: {lbl('api_calls_90d')} must be 0 or greater (got '{row['api_calls_90d']}').")

            # Session Minutes (90d): non-negative
            if 'session_minutes_90d' in df.columns and pd.notna(row['session_minutes_90d']):
                if row['session_minutes_90d'] < 0:
                    errors.append(f"Row {row_num}: {lbl('session_minutes_90d')} must be 0 or greater (got '{row['session_minutes_90d']}').")

            # Support Tickets (90d): non-negative
            if 'tickets_opened_90d' in df.columns and pd.notna(row['tickets_opened_90d']):
                if row['tickets_opened_90d'] < 0:
                    errors.append(f"Row {row_num}: {lbl('tickets_opened_90d')} must be 0 or greater (got '{row['tickets_opened_90d']}').")

        if errors:
            raise HTTPException(
                status_code=422,
                detail={
                    "message": "Validation failed. Please fix the errors below and re-upload your file.",
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
            
            # Check if customer exists
            cust_id = str(row_dict.get('id'))
            existing = db.query(Customer).filter(Customer.id == cust_id).first()
            if existing:
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
        log = ActivityLog(action="CSV Import", user="System", details=f"Imported {len(df)} customers")
        db.add(log)
        
        db.commit()

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
        raise he
    except Exception as e:
        print(f"Error importing CSV: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to process CSV: {str(e)}")
