from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import re

from backend.core.database import get_db
from backend.core.models import AdminUser, ActivityLog, ROLE_SUPER_ADMIN, ROLE_ADMIN, ROLE_CS_MANAGER, ROLE_CS_AGENT, ALL_ROLES
from backend.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    SECRET_KEY,
    ALGORITHM
)
from jose import JWTError, jwt
from pydantic import BaseModel, EmailStr

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

# ── Schemas ──────────────────────────────────────────────────────────────────

class AdminCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: str = ROLE_ADMIN
    phone: Optional[str] = None
    department: Optional[str] = None

class AdminUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None

class ChangePassword(BaseModel):
    current_password: str
    new_password: str

class AdminResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    status: str
    phone: Optional[str] = None
    department: Optional[str] = None
    last_login: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: AdminResponse

# ── Auth Dependencies ────────────────────────────────────────────────────────

def get_current_admin(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    admin = db.query(AdminUser).filter(AdminUser.email == email).first()
    if admin is None:
        raise credentials_exception
    return admin

oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login", auto_error=False)

def get_optional_admin(token: str = Depends(oauth2_scheme_optional), db: Session = Depends(get_db)):
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
    except JWTError:
        return None
    return db.query(AdminUser).filter(AdminUser.email == email).first()

def require_role(*allowed_roles):
    """Dependency factory for role-based access control."""
    def checker(current_admin: AdminUser = Depends(get_current_admin)):
        if current_admin.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required role: {', '.join(allowed_roles)}"
            )
        return current_admin
    return checker

# ── Password Validation ──────────────────────────────────────────────────────

def validate_password_strength(password: str):
    """Validate password strength with support for all standard special characters."""
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
    if not re.search(r"[A-Z]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one uppercase letter")
    if not re.search(r"[a-z]", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one lowercase letter")
    if not re.search(r"\d", password):
        raise HTTPException(status_code=400, detail="Password must contain at least one number")
    # Accept any non-alphanumeric, non-whitespace character as a special character.
    # This supports: / \ - _ + . ( ) @ $ ! % * ? & # ^ = [ ] { } ; : ' " | , < > ~ `
    if not re.search(r"[^A-Za-z0-9\s]", password):
        raise HTTPException(
            status_code=400, 
            detail="Password must contain at least one special character (e.g. @$!%*?&#/\\-_+.())"
        )

# ── Helper to serialize AdminUser ────────────────────────────────────────────

def _admin_to_response(admin: AdminUser) -> dict:
    return {
        "id": admin.id,
        "email": admin.email,
        "name": admin.name,
        "role": admin.role or ROLE_ADMIN,
        "status": admin.status or "Active",
        "last_login": admin.last_login.isoformat() + "Z" if admin.last_login else None,
        "created_at": admin.created_at.isoformat() + "Z" if admin.created_at else None,
    }

# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    admin = db.query(AdminUser).filter(AdminUser.email == form_data.username).first()
    if not admin or not verify_password(form_data.password, admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if account is active
    if admin.status and admin.status != "Active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is {admin.status}. Please contact an administrator."
        )
    
    # Update last login
    admin.last_login = datetime.utcnow()
    
    # Log activity
    log = ActivityLog(
        action="Admin Login",
        user=admin.email,
        details=f"{admin.name} logged in",
        result="success"
    )
    db.add(log)
    db.commit()
    db.refresh(admin)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": admin.email, "role": admin.role or ROLE_ADMIN}, 
        expires_delta=access_token_expires
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": _admin_to_response(admin)
    }

@router.get("/admins")
def get_admins(current_admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    admins = db.query(AdminUser).all()
    return [_admin_to_response(a) for a in admins]

@router.post("/admins", status_code=status.HTTP_201_CREATED)
def create_admin(admin_data: AdminCreate, current_admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    # Check if admin already exists
    if db.query(AdminUser).filter(AdminUser.email == admin_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate role
    if admin_data.role not in ALL_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(ALL_ROLES)}")
        
    # Validate password strength
    validate_password_strength(admin_data.password)
    
    hashed_password = get_password_hash(admin_data.password)
    new_admin = AdminUser(
        email=admin_data.email,
        name=admin_data.name,
        hashed_password=hashed_password,
        role=admin_data.role,
        status="Active",
        phone=admin_data.phone,
        department=admin_data.department
    )
    db.add(new_admin)
    
    # Log activity
    log = ActivityLog(
        action="Admin Created",
        user=current_admin.email,
        details=f"Created admin {admin_data.email} with role {admin_data.role}",
        result="success"
    )
    db.add(log)
    
    db.commit()
    db.refresh(new_admin)
    return _admin_to_response(new_admin)

@router.put("/admins/{admin_id}")
def update_admin(admin_id: int, admin_data: AdminUpdate, current_admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    admin = db.query(AdminUser).filter(AdminUser.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
        
    if admin_data.email and admin_data.email != admin.email:
        if admin.email == "admin@churnsense.com":
            raise HTTPException(status_code=400, detail="Cannot change email of default admin")
        if db.query(AdminUser).filter(AdminUser.email == admin_data.email).first():
            raise HTTPException(status_code=400, detail="Email already registered")
        admin.email = admin_data.email
        
    if admin_data.name:
        admin.name = admin_data.name
        
    if admin_data.role:
        if admin_data.role not in ALL_ROLES:
            raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join(ALL_ROLES)}")
        admin.role = admin_data.role
        
    if admin_data.phone is not None:
        admin.phone = admin_data.phone
        
    if admin_data.department is not None:
        admin.department = admin_data.department
        
    if admin_data.password:
        validate_password_strength(admin_data.password)
        admin.hashed_password = get_password_hash(admin_data.password)
    
    # Log activity
    log = ActivityLog(
        action="Admin Updated",
        user=current_admin.email,
        details=f"Updated admin {admin.email}",
        result="success"
    )
    db.add(log)
        
    db.commit()
    db.refresh(admin)
    return _admin_to_response(admin)

@router.put("/change-password")
def change_password(data: ChangePassword, current_admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Change the current admin's password."""
    if not verify_password(data.current_password, current_admin.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    validate_password_strength(data.new_password)
    current_admin.hashed_password = get_password_hash(data.new_password)
    
    log = ActivityLog(
        action="Password Changed",
        user=current_admin.email,
        details=f"{current_admin.name} changed their password",
        result="success"
    )
    db.add(log)
    
    db.commit()
    return {"message": "Password changed successfully"}

@router.delete("/admins/{admin_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin(admin_id: int, current_admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    admin = db.query(AdminUser).filter(AdminUser.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")
        
    if admin.email == "admin@churnsense.com":
        raise HTTPException(status_code=400, detail="Cannot delete default admin")
        
    if admin.id == current_admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
        
    db.delete(admin)
    
    # Log activity
    log = ActivityLog(
        action="Admin Deleted",
        user=current_admin.email,
        details=f"Deleted admin {admin.email}",
        result="success"
    )
    db.add(log)
    
    db.commit()
    return {"detail": "Admin successfully deleted"}

from backend.core.models import Customer
from sqlalchemy import func

@router.get("/cs-team")
def get_cs_team(current_admin: AdminUser = Depends(get_current_admin), db: Session = Depends(get_db)):
    # Get all CS Agents and CS Managers
    cs_admins = db.query(AdminUser).filter(
        AdminUser.role.in_([ROLE_CS_AGENT, ROLE_CS_MANAGER])
    ).all()
    
    # Calculate workloads (assigned customers where status is Active and mitigation is assigned)
    workloads = db.query(
        Customer.assigned_to, 
        func.count(Customer.id).label("customer_count")
    ).filter(
        Customer.assigned_to.isnot(None),
        Customer.status == "Active"
    ).group_by(Customer.assigned_to).all()
    
    workload_map = {email: count for email, count in workloads}
    
    results = []
    for a in cs_admins:
        admin_data = _admin_to_response(a)
        results.append({
            **admin_data,
            "assigned_customers_count": workload_map.get(a.email, 0)
        })
        
    return results


# ── Forgot Password / OTP Flow ──────────────────────────────────────────────

import random
import string
import httpx
from backend.core.models import PasswordResetOTP
import os


RESEND_API_KEY = os.getenv("RESEND_API_KEY")
RESEND_FROM    = os.getenv("RESEND_FROM", "ChurnSense <noreply@churnsense.sbs>")

def send_otp_email(to_email: str, otp_code: str, admin_name: str):
    """Send OTP code via Resend API (HTTPS - works on all cloud providers)."""
    # Baca env var fresh di setiap panggilan
    api_key  = os.getenv("RESEND_API_KEY")
    from_addr = os.getenv("RESEND_FROM", "ChurnSense <noreply@churnsense.sbs>")

    if not api_key:
        print(f"\n[Resend not configured] OTP for {to_email}: {otp_code}\n")
        raise RuntimeError("RESEND_API_KEY is not set. Please add it in Render Environment Variables.")

    html_body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 0;">
      <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 32px 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
        <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0 0 8px;">ChurnSense</h1>
        <p style="color: #a5b4fc; font-size: 13px; margin: 0;">Password Reset Request</p>
      </div>
      <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="color: #374151; font-size: 15px; margin: 0 0 8px;">Hi <strong>{admin_name}</strong>,</p>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          We received a request to reset your password. Use the verification code below to proceed:
        </p>
        <div style="background: #f8fafc; border: 2px dashed #c7d2fe; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px;">
          <p style="color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; margin: 0 0 8px;">Verification Code</p>
          <p style="color: #1e1b4b; font-size: 36px; font-weight: 900; letter-spacing: 8px; margin: 0;">{otp_code}</p>
        </div>
        <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0 0 16px;">
          ⏱ This code expires in <strong>10 minutes</strong>.<br>
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
      <div style="background: #f9fafb; padding: 16px 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px; text-align: center;">
        <p style="color: #9ca3af; font-size: 11px; margin: 0;">&copy; 2026 ChurnSense Inc. All rights reserved.</p>
      </div>
    </div>
    """

    try:
        response = httpx.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "from": from_addr,
                "to": [to_email],
                "subject": f"🔐 ChurnSense - Your Password Reset Code: {otp_code}",
                "html": html_body,
            },
            timeout=15,
        )
        print(f"[Resend] status={response.status_code} body={response.text}")
        if response.status_code in (200, 201):
            print(f"[Resend] OTP email sent successfully to {to_email}")
            return True
        else:
            raise RuntimeError(f"Resend API error {response.status_code}: {response.text}")
    except httpx.RequestError as e:
        print(f"[Resend ERROR] Network error: {e}")
        raise RuntimeError(f"Network error calling Resend API: {e}")
    except RuntimeError:
        raise
    except Exception as e:
        print(f"[Resend ERROR] {type(e).__name__}: {e}")
        raise RuntimeError(f"{type(e).__name__}: {e}")

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str

@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Generate a 6-digit OTP and send it via email."""
    # Check if the email exists
    admin = db.query(AdminUser).filter(AdminUser.email == data.email).first()
    if not admin:
        raise HTTPException(status_code=404, detail="No account found with this email address.")
    
    # Invalidate any previous OTPs for this email
    db.query(PasswordResetOTP).filter(PasswordResetOTP.email == data.email).delete()
    
    # Generate a 6-digit OTP
    otp_code = ''.join(random.choices(string.digits, k=6))
    
    # Store OTP with 10-minute expiration
    otp_record = PasswordResetOTP(
        email=data.email,
        otp_code=otp_code,
        expires_at=datetime.utcnow() + timedelta(minutes=10)
    )
    db.add(otp_record)
    
    # Send OTP via email
    smtp_error = None
    try:
        send_otp_email(data.email, otp_code, admin.name)
        email_sent = True
    except RuntimeError as e:
        email_sent = False
        smtp_error = str(e)
    except Exception as e:
        email_sent = False
        smtp_error = f"{type(e).__name__}: {e}"
    
    # Log the activity
    log = ActivityLog(
        action="Password Reset Requested",
        user=data.email,
        details=f"OTP generated for {data.email}" + (" (email sent)" if email_sent else f" (email failed: {smtp_error})"),
        result="success" if email_sent else "email_failed"
    )
    db.add(log)
    db.commit()
    
    if not email_sent:
        raise HTTPException(
            status_code=500, 
            detail=f"Gagal kirim OTP. Error: {smtp_error}"
        )
    
    return {"message": "OTP has been sent to your email address.", "email": data.email}


@router.post("/verify-otp")
def verify_otp(data: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Verify the OTP code for a given email."""
    otp_record = db.query(PasswordResetOTP).filter(
        PasswordResetOTP.email == data.email,
        PasswordResetOTP.otp_code == data.otp,
        PasswordResetOTP.is_verified == False
    ).first()
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid OTP code. Please check and try again.")
    
    # Check expiration
    if datetime.utcnow() > otp_record.expires_at.replace(tzinfo=None):
        db.delete(otp_record)
        db.commit()
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
    
    # Mark as verified
    otp_record.is_verified = True
    db.commit()
    
    return {"message": "OTP verified successfully.", "verified": True}


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset the password after OTP verification."""
    # Check for a verified OTP
    otp_record = db.query(PasswordResetOTP).filter(
        PasswordResetOTP.email == data.email,
        PasswordResetOTP.otp_code == data.otp,
        PasswordResetOTP.is_verified == True
    ).first()
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="OTP not verified. Please verify your OTP first.")
    
    # Check expiration (extra safety)
    if datetime.utcnow() > otp_record.expires_at.replace(tzinfo=None):
        db.delete(otp_record)
        db.commit()
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
    
    # Validate new password strength
    validate_password_strength(data.new_password)
    
    # Update the admin's password
    admin = db.query(AdminUser).filter(AdminUser.email == data.email).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Account not found.")
    
    admin.hashed_password = get_password_hash(data.new_password)
    
    # Clean up OTP records for this email
    db.query(PasswordResetOTP).filter(PasswordResetOTP.email == data.email).delete()
    
    # Log activity
    log = ActivityLog(
        action="Password Reset Completed",
        user=data.email,
        details=f"Password was reset for {data.email} via OTP verification",
        result="success"
    )
    db.add(log)
    db.commit()
    
    return {"message": "Password has been reset successfully. You can now log in with your new password."}
