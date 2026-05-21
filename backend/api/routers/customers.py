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
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # We need an id column. If missing, generate.
        if 'id' not in df.columns:
            df['id'] = [f"CUST-{str(uuid.uuid4())[:8].upper()}" for _ in range(len(df))]
        
        # We need a name column.
        if 'name' not in df.columns:
            df['name'] = [f"Customer {i}" for i in df['id']]
            
        # Data Validation
        errors = []
        for index, row in df.iterrows():
            row_num = index + 2 # +2 because 0-index and header
            
            if 'age' in df.columns and pd.notna(row['age']):
                if row['age'] < 0 or row['age'] > 120:
                    errors.append(f"Row {row_num}: 'age' must be between 0 and 120 (got {row['age']})")
                    
            if 'logins_90d' in df.columns and pd.notna(row['logins_90d']):
                if row['logins_90d'] < 0:
                    errors.append(f"Row {row_num}: 'logins_90d' cannot be negative (got {row['logins_90d']})")
                    
            if 'api_calls_90d' in df.columns and pd.notna(row['api_calls_90d']):
                if row['api_calls_90d'] < 0:
                    errors.append(f"Row {row_num}: 'api_calls_90d' cannot be negative")
                    
            if 'avg_session_duration' in df.columns and pd.notna(row['avg_session_duration']):
                if row['avg_session_duration'] < 0:
                    errors.append(f"Row {row_num}: 'avg_session_duration' cannot be negative")
                    
        if errors:
            raise HTTPException(status_code=422, detail={"message": "Data validation failed", "errors": errors[:10]})
            
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
                # filter out dict keys not in Customer model
                valid_keys = {c.name for c in Customer.__table__.columns}
                filtered_dict = {k: v for k, v in row_dict.items() if k in valid_keys}
                customers_to_add.append(Customer(**filtered_dict))
                
        if customers_to_add:
            db.add_all(customers_to_add)
            
        # Log activity
        log = ActivityLog(action="CSV Import", user="System", details=f"Imported {len(df)} customers")
        db.add(log)
        
        db.commit()
        return {"message": f"Successfully imported {len(df)} customers.", "count": len(df)}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error importing CSV: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to process CSV: {str(e)}")
