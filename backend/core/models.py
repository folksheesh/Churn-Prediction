from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from backend.core.database import Base

# ── Role constants for RBAC ──────────────────────────────────────────────────
ROLE_SUPER_ADMIN = "Super Admin"
ROLE_ADMIN = "Admin"
ROLE_CS_MANAGER = "CS Manager"
ROLE_CS_AGENT = "CS Agent"
ROLE_USER = "user"
ALL_ROLES = [ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_CS_MANAGER, ROLE_CS_AGENT, ROLE_USER]

class Customer(Base):
    __tablename__ = "customers"

    id = Column(String, primary_key=True, index=True) # e.g. '#4092' or generated UUID
    name = Column(String, index=True)
    email = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    
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
    
    # Mitigation / Retention
    mitigation_status = Column(String, nullable=True)  # Assigned, Not Assigned
    assigned_to = Column(String, nullable=True)  # email of assigned CS Agent
    retention_campaign = Column(String, nullable=True)  # Discount Campaign, Customer Support Follow-up, etc.
    campaign_assigned_date = Column(DateTime(timezone=True), nullable=True)
    
    # Audit
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String)
    user = Column(String)
    details = Column(String, nullable=True)
    result = Column(String, nullable=True)       # success, failed, etc.
    email_status = Column(String, nullable=True)  # Pending, Sent, Delivered, Failed
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    hashed_password = Column(String)
    role = Column(String, default=ROLE_USER)        # Super Admin, Admin, CS Manager, CS Agent, user
    status = Column(String, default="Active")       # Active, Inactive, Suspended
    phone = Column(String, nullable=True)           # For CS Agent profiles
    department = Column(String, nullable=True)      # e.g., Retention, Support, Onboarding
    last_login = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class MitigationLog(Base):
    __tablename__ = "mitigation_logs"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String, index=True, nullable=False)
    action_type = Column(String, nullable=False)      # discount_campaign, customer_support_followup, loyalty_program_enrollment, product_recommendation
    executed_by = Column(String, nullable=False)       # admin email
    executed_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, default="Assigned")        # Assigned
    notes = Column(Text, nullable=True)
    assigned_agent = Column(String, nullable=True)     # For assign_agent action
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class UploadAttempt(Base):
    __tablename__ = "upload_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, nullable=False, index=True)
    filename = Column(String, nullable=True)
    status = Column(String, default="failed")  # success, failed
    error_message = Column(Text, nullable=True)
    attempted_at = Column(DateTime(timezone=True), server_default=func.now())

class PasswordResetOTP(Base):
    __tablename__ = "password_reset_otps"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, nullable=False, index=True)
    otp_code = Column(String, nullable=False)
    is_verified = Column(Boolean, default=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

