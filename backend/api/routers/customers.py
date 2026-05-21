from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.core.database import get_db
from backend.core.models import Customer, ActivityLog
from backend.api.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse, CustomerListResponse
from backend.api.services.ml_service import run_single_prediction
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
