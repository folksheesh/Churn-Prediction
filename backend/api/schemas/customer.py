from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class CustomerBase(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    region_category: Optional[str] = None
    days_since_joined: Optional[int] = None
    plan_tier: Optional[str] = None
    status: Optional[str] = "Active"
    
    days_since_active: Optional[int] = None
    api_calls_90d: Optional[int] = None
    logins_90d: Optional[int] = None
    active_days_90d: Optional[int] = None
    avg_session_duration: Optional[float] = None
    days_since_last_login: Optional[int] = None
    avg_frequency_login_days: Optional[float] = None
    
    avg_transaction_value: Optional[float] = None
    points_in_wallet: Optional[float] = None
    
    tickets_opened_90d: Optional[int] = None
    feedback: Optional[str] = None
    
    churn_risk: Optional[str] = None
    churn_probability: Optional[float] = None

class CustomerCreate(CustomerBase):
    id: str
    name: str

class CustomerUpdate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class CustomerListResponse(BaseModel):
    total: int
    items: List[CustomerResponse]
