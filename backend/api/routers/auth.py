from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import re
import secrets
import uuid

from backend.core.database import get_db
from backend.core.models import (
    User, Invitation, ActivityLog,
    ROLE_SUPER_ADMIN, ROLE_COMPANY_ADMIN, ROLE_USER, ALL_ROLES
)
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

class InviteRequest(BaseModel):
    email: EmailStr

class ActivateAccountRequest(BaseModel):
    token: str
    name: str
    password: str
    confirm_password: str

class AdminCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: str = ROLE_COMPANY_ADMIN

class AdminUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None

class UserStatusUpdate(BaseModel):
    status: str  # active, inactive

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

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
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
        
    admin = db.query(User).filter(User.email == email).first()
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
    return db.query(User).filter(User.email == email).first()

def require_role(*allowed_roles):
    """Dependency factory for role-based access control."""
    def checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required role: {', '.join(allowed_roles)}"
            )
        return current_user
    return checker

def require_admin():
    """Only super_admin and company_admin can access."""
    return require_role(ROLE_SUPER_ADMIN, ROLE_COMPANY_ADMIN)

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
    if not re.search(r"[^A-Za-z0-9\s]", password):
        raise HTTPException(
            status_code=400, 
            detail="Password must contain at least one special character (e.g. @$!%*?&#/\\-_+.())"
        )

# ── Helper to serialize User ────────────────────────────────────────────

def _admin_to_response(admin: User) -> dict:
    return {
        "id": admin.id,
        "email": admin.email,
        "name": admin.name,
        "role": admin.role or ROLE_USER,
        "status": admin.status or "active",
        "phone": admin.phone,
        "department": admin.department,
        "last_login": admin.last_login.isoformat() + "Z" if admin.last_login else None,
        "created_at": admin.created_at.isoformat() + "Z" if admin.created_at else None,
    }

# ── Login ────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    email = form_data.username.lower()
    admin = db.query(User).filter(User.email == email).first()
    if not admin or not verify_password(form_data.password, admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if account is active
    if admin.status and admin.status not in ("active", "Active"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is {admin.status}. Please contact an administrator."
        )
    
    # Update last login
    admin.last_login = datetime.utcnow()
    
    # Log activity
    log = ActivityLog(
        action="Login",
        user=admin.email,
        details=f"{admin.name} logged in",
        result="success"
    )
    db.add(log)
    db.commit()
    db.refresh(admin)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": admin.email, "role": admin.role or ROLE_USER}, 
        expires_delta=access_token_expires
    )
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": _admin_to_response(admin)
    }

# ── Invitation System ────────────────────────────────────────────────────────

def _generate_invitation_token():
    """Generate a secure, unique invitation token."""
    return f"{uuid.uuid4().hex}{secrets.token_hex(16)}"

@router.post("/invite")
def invite_user(
    data: InviteRequest,
    current_user: User = Depends(require_admin()),
    db: Session = Depends(get_db)
):
    """Admin invites a new user via email."""
    email = data.email.lower()
    # Check if user already exists
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email already exists.")
    
    # Invalidate any existing pending invitations for this email
    db.query(Invitation).filter(
        Invitation.email == email,
        Invitation.status == "pending"
    ).update({"status": "expired"})
    
    # Create new invitation
    token = _generate_invitation_token()
    invitation = Invitation(
        email=email,
        invitation_token=token,
        invited_by=current_user.email,
        status="pending",
        expired_at=datetime.utcnow() + timedelta(hours=24)
    )
    db.add(invitation)
    
    # Send invitation email
    email_sent = False
    smtp_error = None
    try:
        _send_invitation_email(email, token, current_user.name)
        email_sent = True
    except RuntimeError as e:
        smtp_error = str(e)
    except Exception as e:
        smtp_error = f"{type(e).__name__}: {e}"
    
    # Log activity
    log = ActivityLog(
        action="User Invited",
        user=current_user.email,
        details=f"Invited {email}" + (f" (email failed: {smtp_error})" if not email_sent else ""),
        result="success" if email_sent else "email_failed"
    )
    db.add(log)
    db.commit()
    
    if not email_sent:
        raise HTTPException(
            status_code=500,
            detail=f"Invitation created but email failed to send. Error: {smtp_error}"
        )
    
    return {
        "message": f"Invitation sent to {email}",
        "email": email,
        "expires_in": "24 hours"
    }

@router.post("/invite/resend")
def resend_invitation(
    data: InviteRequest,
    current_user: User = Depends(require_admin()),
    db: Session = Depends(get_db)
):
    """Resend invitation email with a new token."""
    email = data.email.lower()
    # Check if user already activated
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user and existing_user.status == "active":
        raise HTTPException(status_code=400, detail="This user is already active.")
    
    # Expire old invitations
    db.query(Invitation).filter(
        Invitation.email == email,
        Invitation.status == "pending"
    ).update({"status": "expired"})
    
    # Create new invitation
    token = _generate_invitation_token()
    invitation = Invitation(
        email=email,
        invitation_token=token,
        invited_by=current_user.email,
        status="pending",
        expired_at=datetime.utcnow() + timedelta(hours=24)
    )
    db.add(invitation)
    
    # Send email
    email_sent = False
    smtp_error = None
    try:
        _send_invitation_email(email, token, current_user.name)
        email_sent = True
    except RuntimeError as e:
        smtp_error = str(e)
    except Exception as e:
        smtp_error = f"{type(e).__name__}: {e}"
    
    log = ActivityLog(
        action="Invitation Resent",
        user=current_user.email,
        details=f"Resent invitation to {email}",
        result="success" if email_sent else "email_failed"
    )
    db.add(log)
    db.commit()
    
    if not email_sent:
        raise HTTPException(status_code=500, detail=f"Failed to send invitation email. Error: {smtp_error}")
    
    return {"message": f"Invitation resent to {email}"}

@router.get("/invite/validate")
def validate_invitation(token: str, db: Session = Depends(get_db)):
    """Validate an invitation token (public endpoint for activate-account page)."""
    invitation = db.query(Invitation).filter(
        Invitation.invitation_token == token,
    ).first()
    
    if not invitation:
        raise HTTPException(status_code=404, detail="Invalid invitation link.")
    
    if invitation.status == "accepted":
        raise HTTPException(status_code=400, detail="This invitation has already been used.")
    
    if invitation.status == "expired" or datetime.utcnow() > invitation.expired_at.replace(tzinfo=None):
        # Mark as expired if not already
        if invitation.status != "expired":
            invitation.status = "expired"
            db.commit()
        raise HTTPException(status_code=410, detail="This invitation has expired. Please contact your administrator to resend.")
    
    return {
        "valid": True,
        "email": invitation.email,
        "invited_by": invitation.invited_by,
        "expires_at": invitation.expired_at.isoformat() + "Z"
    }

@router.post("/activate-account")
def activate_account(data: ActivateAccountRequest, db: Session = Depends(get_db)):
    """Activate a user account from an invitation token."""
    # Validate token
    invitation = db.query(Invitation).filter(
        Invitation.invitation_token == data.token,
        Invitation.status == "pending"
    ).first()
    
    if not invitation:
        raise HTTPException(status_code=400, detail="Invalid or expired invitation token.")
    
    # Check expiration
    if datetime.utcnow() > invitation.expired_at.replace(tzinfo=None):
        invitation.status = "expired"
        db.commit()
        raise HTTPException(status_code=410, detail="This invitation has expired.")
    
    # Validate passwords match
    if data.password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")
    
    # Validate name
    if not data.name or len(data.name.strip()) < 2:
        raise HTTPException(status_code=400, detail="Full name must be at least 2 characters.")
    
    # Validate password strength
    validate_password_strength(data.password)
    
    # Check if user already exists
    existing = db.query(User).filter(User.email == invitation.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    
    # Create user
    hashed_password = get_password_hash(data.password)
    new_user = User(
        email=invitation.email,
        name=data.name.strip(),
        hashed_password=hashed_password,
        role=ROLE_USER,
        status="active"
    )
    db.add(new_user)
    
    # Mark invitation as accepted
    invitation.status = "accepted"
    
    # Log activity
    log = ActivityLog(
        action="Account Activated",
        user=invitation.email,
        details=f"User {data.name} activated account via invitation",
        result="success"
    )
    db.add(log)
    db.commit()
    db.refresh(new_user)
    
    # Auto-login: generate JWT token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.email, "role": new_user.role},
        expires_delta=access_token_expires
    )
    
    return {
        "message": "Account activated successfully!",
        "access_token": access_token,
        "token_type": "bearer",
        "user": _admin_to_response(new_user)
    }

# ── User Management (Admin) ─────────────────────────────────────────────────

@router.get("/users")
def get_users(current_user: User = Depends(require_admin()), db: Session = Depends(get_db)):
    """Get all users for admin management."""
    users = db.query(User).all()
    return [_admin_to_response(u) for u in users]

@router.get("/users/invitations")
def get_invitations(current_user: User = Depends(require_admin()), db: Session = Depends(get_db)):
    """Get all invitations (for admin to see pending/expired)."""
    invitations = db.query(Invitation).order_by(Invitation.created_at.desc()).all()
    return [
        {
            "id": inv.id,
            "email": inv.email,
            "invited_by": inv.invited_by,
            "status": inv.status,
            "expired_at": inv.expired_at.isoformat() + "Z" if inv.expired_at else None,
            "created_at": inv.created_at.isoformat() + "Z" if inv.created_at else None,
        }
        for inv in invitations
    ]

@router.put("/users/{user_id}/status")
def update_user_status(
    user_id: int,
    data: UserStatusUpdate,
    current_user: User = Depends(require_admin()),
    db: Session = Depends(get_db)
):
    """Activate or deactivate a user."""
    if data.status not in ("active", "inactive"):
        raise HTTPException(status_code=400, detail="Status must be 'active' or 'inactive'.")
    
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")
    
    if target.email == "admin@churnsense.com":
        raise HTTPException(status_code=400, detail="Cannot change the status of the default admin.")
    
    if target.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot change your own status.")
    
    target.status = data.status
    
    log = ActivityLog(
        action=f"User {'Activated' if data.status == 'active' else 'Deactivated'}",
        user=current_user.email,
        details=f"Set {target.email} status to {data.status}",
        result="success"
    )
    db.add(log)
    db.commit()
    db.refresh(target)
    
    return _admin_to_response(target)

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    current_user: User = Depends(require_admin()),
    db: Session = Depends(get_db)
):
    """Delete a user."""
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found.")
    
    if target.email == "admin@churnsense.com":
        raise HTTPException(status_code=400, detail="Cannot delete the default admin.")
    
    if target.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account.")
    
    db.delete(target)
    
    log = ActivityLog(
        action="User Deleted",
        user=current_user.email,
        details=f"Deleted user {target.email}",
        result="success"
    )
    db.add(log)
    db.commit()
    return {"detail": "User deleted successfully."}

# ── Admin CRUD (kept for backward compatibility) ─────────────────────────────

@router.get("/admins")
def get_admins(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    admins = db.query(User).filter(User.role.in_([ROLE_SUPER_ADMIN, ROLE_COMPANY_ADMIN])).all()
    return [_admin_to_response(a) for a in admins]

@router.post("/admins", status_code=status.HTTP_201_CREATED)
def create_admin(admin_data: AdminCreate, current_user: User = Depends(require_role(ROLE_SUPER_ADMIN)), db: Session = Depends(get_db)):
    """Only Super Admin can create Company Admins."""
    email = admin_data.email.lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if admin_data.role not in [ROLE_SUPER_ADMIN, ROLE_COMPANY_ADMIN]:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {ROLE_SUPER_ADMIN}, {ROLE_COMPANY_ADMIN}")
        
    validate_password_strength(admin_data.password)
    
    hashed_password = get_password_hash(admin_data.password)
    new_admin = User(
        email=email,
        name=admin_data.name,
        hashed_password=hashed_password,
        role=admin_data.role,
        status="active",
    )
    db.add(new_admin)
    
    log = ActivityLog(
        action="Admin Created",
        user=current_user.email,
        details=f"Created admin {email} with role {admin_data.role}",
        result="success"
    )
    db.add(log)
    db.commit()
    db.refresh(new_admin)
    return _admin_to_response(new_admin)

@router.put("/admins/{admin_id}")
def update_admin(admin_id: int, admin_data: AdminUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    admin = db.query(User).filter(User.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="User not found")
        
    if admin_data.email and admin_data.email.lower() != admin.email:
        new_email = admin_data.email.lower()
        if admin.email == "admin@churnsense.com":
            raise HTTPException(status_code=400, detail="Cannot change email of default admin")
        if db.query(User).filter(User.email == new_email).first():
            raise HTTPException(status_code=400, detail="Email already registered")
        admin.email = new_email
        
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
    
    log = ActivityLog(
        action="User Updated",
        user=current_user.email,
        details=f"Updated user {admin.email}",
        result="success"
    )
    db.add(log)
    db.commit()
    db.refresh(admin)
    return _admin_to_response(admin)

@router.put("/change-password")
def change_password(data: ChangePassword, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Change the current user's password."""
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    validate_password_strength(data.new_password)
    current_user.hashed_password = get_password_hash(data.new_password)
    
    log = ActivityLog(
        action="Password Changed",
        user=current_user.email,
        details=f"{current_user.name} changed their password",
        result="success"
    )
    db.add(log)
    db.commit()
    return {"message": "Password changed successfully"}

@router.delete("/admins/{admin_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_admin(admin_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    admin = db.query(User).filter(User.id == admin_id).first()
    if not admin:
        raise HTTPException(status_code=404, detail="User not found")
        
    if admin.email == "admin@churnsense.com":
        raise HTTPException(status_code=400, detail="Cannot delete default admin")
        
    if admin.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
        
    db.delete(admin)
    
    log = ActivityLog(
        action="User Deleted",
        user=current_user.email,
        details=f"Deleted user {admin.email}",
        result="success"
    )
    db.add(log)
    db.commit()
    return {"detail": "User successfully deleted"}

# ── CS Team (kept for backward compatibility) ────────────────────────────────

from backend.core.models import Customer
from sqlalchemy import func

@router.get("/cs-team")
def get_cs_team(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cs_admins = db.query(User).filter(
        User.role.in_([ROLE_COMPANY_ADMIN])
    ).all()
    
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

# ── Invitation Email ─────────────────────────────────────────────────────────

def _get_frontend_url():
    """Get the frontend URL for generating invitation links."""
    return os.getenv("FRONTEND_URL", "https://churn-prediction-eta-ecru.vercel.app")

def _send_invitation_email(to_email: str, token: str, inviter_name: str):
    """Send invitation email via Resend API."""
    api_key = os.getenv("RESEND_API_KEY")
    from_addr = os.getenv("RESEND_FROM", "ChurnSense <noreply@churnsense.sbs>")
    
    if not api_key:
        print(f"\n[Resend not configured] Invitation for {to_email}: token={token}\n")
        raise RuntimeError("RESEND_API_KEY is not set. Please add it in Render Environment Variables.")
    
    frontend_url = _get_frontend_url()
    activation_link = f"{frontend_url}/activate-account?token={token}"
    
    html_body = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 0;">
      <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 32px 32px 24px; border-radius: 16px 16px 0 0; text-align: center;">
        <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0 0 8px;">ChurnSense</h1>
        <p style="color: #a5b4fc; font-size: 13px; margin: 0;">You're Invited!</p>
      </div>
      <div style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="color: #374151; font-size: 15px; margin: 0 0 8px;">Hi there,</p>
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
          <strong>{inviter_name}</strong> has invited you to join <strong>ChurnSense</strong> — an AI-powered customer retention platform. Click the button below to set up your account:
        </p>
        <div style="text-align: center; margin: 0 0 24px;">
          <a href="{activation_link}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 14px; font-weight: 700; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
            Activate My Account
          </a>
        </div>
        <p style="color: #9ca3af; font-size: 12px; line-height: 1.5; margin: 0 0 16px;">
          ⏱ This link expires in <strong>24 hours</strong>.<br>
          If you didn't expect this invitation, you can safely ignore this email.
        </p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-top: 16px;">
          <p style="color: #64748b; font-size: 11px; margin: 0; word-break: break-all;">
            If the button doesn't work, copy this link:<br>
            <a href="{activation_link}" style="color: #4f46e5; text-decoration: underline;">{activation_link}</a>
          </p>
        </div>
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
                "subject": f"🎉 You're invited to join ChurnSense!",
                "html": html_body,
            },
            timeout=15,
        )
        print(f"[Resend] status={response.status_code} body={response.text}")
        if response.status_code in (200, 201):
            print(f"[Resend] Invitation email sent successfully to {to_email}")
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


# ── OTP Email (Forgot Password) ─────────────────────────────────────────────

def send_otp_email(to_email: str, otp_code: str, admin_name: str):
    """Send OTP code via Resend API (HTTPS - works on all cloud providers)."""
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
    email = data.email.lower()
    admin = db.query(User).filter(User.email == email).first()
    if not admin:
        raise HTTPException(status_code=404, detail="No account found with this email address.")
    
    db.query(PasswordResetOTP).filter(PasswordResetOTP.email == email).delete()
    
    otp_code = ''.join(random.choices(string.digits, k=6))
    
    otp_record = PasswordResetOTP(
        email=email,
        otp_code=otp_code,
        expires_at=datetime.utcnow() + timedelta(minutes=10)
    )
    db.add(otp_record)
    
    smtp_error = None
    try:
        send_otp_email(email, otp_code, admin.name)
        email_sent = True
    except RuntimeError as e:
        email_sent = False
        smtp_error = str(e)
    except Exception as e:
        email_sent = False
        smtp_error = f"{type(e).__name__}: {e}"
    
    log = ActivityLog(
        action="Password Reset Requested",
        user=email,
        details=f"OTP generated for {email}" + (" (email sent)" if email_sent else f" (email failed: {smtp_error})"),
        result="success" if email_sent else "email_failed"
    )
    db.add(log)
    db.commit()
    
    if not email_sent:
        raise HTTPException(
            status_code=500, 
            detail=f"Gagal kirim OTP. Error: {smtp_error}"
        )
    
    return {"message": "OTP has been sent to your email address.", "email": email}


@router.post("/verify-otp")
def verify_otp(data: VerifyOTPRequest, db: Session = Depends(get_db)):
    """Verify the OTP code for a given email."""
    email = data.email.lower()
    otp_record = db.query(PasswordResetOTP).filter(
        PasswordResetOTP.email == email,
        PasswordResetOTP.otp_code == data.otp,
        PasswordResetOTP.is_verified == False
    ).first()
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid OTP code. Please check and try again.")
    
    if datetime.utcnow() > otp_record.expires_at.replace(tzinfo=None):
        db.delete(otp_record)
        db.commit()
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
    
    otp_record.is_verified = True
    db.commit()
    
    return {"message": "OTP verified successfully.", "verified": True}


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset the password after OTP verification."""
    email = data.email.lower()
    otp_record = db.query(PasswordResetOTP).filter(
        PasswordResetOTP.email == email,
        PasswordResetOTP.otp_code == data.otp,
        PasswordResetOTP.is_verified == True
    ).first()
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="OTP not verified. Please verify your OTP first.")
    
    if datetime.utcnow() > otp_record.expires_at.replace(tzinfo=None):
        db.delete(otp_record)
        db.commit()
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
    
    validate_password_strength(data.new_password)
    
    admin = db.query(User).filter(User.email == email).first()
    if not admin:
        raise HTTPException(status_code=404, detail="Account not found.")
    
    admin.hashed_password = get_password_hash(data.new_password)
    
    db.query(PasswordResetOTP).filter(PasswordResetOTP.email == email).delete()
    
    log = ActivityLog(
        action="Password Reset Completed",
        user=email,
        details=f"Password was reset for {email} via OTP verification",
        result="success"
    )
    db.add(log)
    db.commit()
    
    return {"message": "Password has been reset successfully. You can now log in with your new password."}
