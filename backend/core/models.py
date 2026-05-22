from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.sql import func
from backend.core.database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(String, primary_key=True, index=True) # e.g. '#4092' or generated UUID
    name = Column(String, index=True)
    
    # Demographics & Account
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    region_category = Column(String, nullable=True)
    days_since_joined = Column(Integer, nullable=True)
    plan_tier = Column(String, nullable=True)
    status = Column(String, default="Active") # Active, Inactive
    
    # Activity
    days_since_active = Column(Integer, nullable=True)
    api_calls_90d = Column(Integer, nullable=True)
    logins_90d = Column(Integer, nullable=True)
    active_days_90d = Column(Integer, nullable=True)
    avg_session_duration = Column(Float, nullable=True)
    days_since_last_login = Column(Integer, nullable=True)
    avg_frequency_login_days = Column(Float, nullable=True)
    
    # Financial/Transactions
    avg_transaction_value = Column(Float, nullable=True)
    points_in_wallet = Column(Integer, nullable=True)
    
    # Support/Feedback
    tickets_opened_90d = Column(Integer, nullable=True)
    feedback = Column(String, nullable=True)
    
    # Predictions
    churn_risk = Column(String, nullable=True) # High, Medium, Low
    churn_probability = Column(Float, nullable=True)
    
    # Audit
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String)
    user = Column(String)
    details = Column(String, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class AdminUser(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    hashed_password = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
