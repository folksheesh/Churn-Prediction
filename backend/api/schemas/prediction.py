from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class CustomerProfile(BaseModel):
    # Demographics
    age: Optional[int] = Field(None, description="Age of the customer")
    gender: Optional[str] = Field(None, description="Gender")
    region_category: Optional[str] = Field(None, description="Region category")
    
    # Account details
    days_since_joined: Optional[int] = Field(None, description="Days since joining")
    plan_tier: Optional[str] = Field(None, description="Subscription plan tier")
    
    # Activity
    days_since_active: Optional[int] = Field(None, description="Days since last activity")
    api_calls_90d: Optional[int] = Field(None, description="API calls in last 90 days")
    logins_90d: Optional[int] = Field(None, description="Logins in last 90 days")
    active_days_90d: Optional[int] = Field(None, description="Active days in last 90 days")
    avg_session_duration: Optional[float] = Field(None, description="Average session duration")
    days_since_last_login: Optional[int] = Field(None, description="Days since last login")
    avg_frequency_login_days: Optional[float] = Field(None, description="Average days between logins")
    
    # Financial/Transactions
    avg_transaction_value: Optional[float] = Field(None, description="Average transaction value")
    points_in_wallet: Optional[int] = Field(None, description="Points in wallet")
    
    # Support/Feedback
    tickets_opened_90d: Optional[int] = Field(None, description="Support tickets opened in last 90 days")
    feedback: Optional[str] = Field(None, description="Customer feedback sentiment")

    class Config:
        extra = "allow" # allow extra fields to pass through if needed by the ML model

class PredictionResponse(BaseModel):
    prediction: int
    probability: float
    risk_level: str
    label: str

    # Extended fields for user dashboard integration
    churnProbability: Optional[float] = None
    riskLevel: Optional[str] = None
    advice: Optional[List[str]] = None
    mockFactors: Optional[List[Dict[str, Any]]] = None

class BatchPredictionResponse(BaseModel):
    success: bool
    results: List[Dict[str, Any]]
