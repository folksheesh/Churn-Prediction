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
