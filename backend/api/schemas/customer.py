from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from typing import Optional, Union, List

class CustomerBase(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    age: Optional[Union[int, str]] = None
    gender: Optional[str] = None
    region_category: Optional[str] = None
    days_since_joined: Optional[Union[int, str]] = None
    plan_tier: Optional[str] = None
    status: Optional[str] = "Active"
    
    days_since_active: Optional[Union[int, str]] = None
    api_calls_90d: Optional[Union[int, str]] = None
    logins_90d: Optional[Union[int, str]] = None
    active_days_90d: Optional[Union[int, str]] = None
    avg_session_duration: Optional[Union[float, str]] = None
    days_since_last_login: Optional[Union[int, str]] = None
    avg_frequency_login_days: Optional[Union[float, str]] = None
    
    avg_transaction_value: Optional[Union[float, str]] = None
    points_in_wallet: Optional[Union[float, str]] = None
    
    tickets_opened_90d: Optional[Union[int, str]] = None
    feedback: Optional[str] = None
    
    churn_risk: Optional[str] = None
    churn_probability: Optional[float] = None
    
    mitigation_status: Optional[str] = None
    retention_campaign: Optional[str] = None
    campaign_assigned_date: Optional[datetime] = None

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
