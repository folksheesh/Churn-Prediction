"""
Retention Action Center API — campaign-based retention workflow.
Replaces the old email-based mitigation system.
Used by Dashboard, Customer Detail, Customer Management, and User Dashboard.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func as sqlfunc
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from backend.core.database import get_db
from backend.core.models import (
    MitigationLog, ActivityLog, Customer, User,
    ROLE_COMPANY_ADMIN
)
from backend.api.routers.auth import get_current_user, get_optional_admin
from backend.api.services.email_service import send_campaign_email

router = APIRouter()

# ── Campaign Definitions ─────────────────────────────────────────────────────

CAMPAIGNS = {
    "discount_campaign": {
        "label": "Discount Campaign",
        "description": "Offer vouchers, discounts, or promotional incentives.",
        "icon": "tag",
    },
    "customer_support_followup": {
        "label": "Customer Support Follow-up",
        "description": "Flag customer for support outreach and issue resolution.",
        "icon": "headphones",
    },
    "loyalty_program_enrollment": {
        "label": "Loyalty Program Enrollment",
        "description": "Enroll customer into rewards and retention programs.",
        "icon": "star",
    },
    "product_recommendation": {
        "label": "Product Recommendation Campaign",
        "description": "Recommend relevant products based on customer behavior.",
        "icon": "package",
    },
}

VALID_CAMPAIGNS = list(CAMPAIGNS.keys())

# ── Churn Reason → Campaign Recommendation Map ──────────────────────────────

RECOMMENDATION_RULES = [
    {"keywords": ["too many ads", "ads", "advertisement"], "campaign": "discount_campaign"},
    {"keywords": ["poor customer service", "bad service", "customer service", "rude staff"], "campaign": "customer_support_followup"},
    {"keywords": ["poor product quality", "product quality", "defective", "low quality"], "campaign": "customer_support_followup"},
    {"keywords": ["better competitor", "competitor", "cheaper elsewhere", "switched"], "campaign": "discount_campaign"},
    {"keywords": ["low engagement", "not engaged", "disengaged", "inactive"], "campaign": "loyalty_program_enrollment"},
    {"keywords": ["no recent purchases", "stopped buying", "not purchasing", "no purchase"], "campaign": "product_recommendation"},
]

def _recommend_campaign(feedback: Optional[str]) -> str:
    """Determine the recommended campaign based on customer feedback/churn reason."""
    if not feedback:
        return "discount_campaign"  # Default when no feedback
    
    text = feedback.lower().strip()
    for rule in RECOMMENDATION_RULES:
        for keyword in rule["keywords"]:
            if keyword in text:
                return rule["campaign"]
    
    # Default fallback
    return "discount_campaign"


# ── Schemas ──────────────────────────────────────────────────────────────────

class CampaignAssignRequest(BaseModel):
    customer_id: str
    campaign_name: str  # discount_campaign, customer_support_followup, loyalty_program_enrollment, product_recommendation
    notes: Optional[str] = None

class CampaignAssignResponse(BaseModel):
    id: int
    customer_id: str
    customer_name: Optional[str] = None
    campaign_name: str
    campaign_label: str
    assigned_by: str
    assigned_date: Optional[str] = None
    status: str
    notes: Optional[str] = None

class CampaignRecommendation(BaseModel):
    recommended_campaign: str
    campaign_label: str
    reason: str


# ── Assign Campaign ─────────────────────────────────────────────────────────

@router.post("/execute", response_model=CampaignAssignResponse)
def assign_campaign(
    req: CampaignAssignRequest,
    current_admin: Optional[User] = Depends(get_optional_admin),
    db: Session = Depends(get_db),
):
    # Validate campaign name
    if req.campaign_name not in VALID_CAMPAIGNS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid campaign. Must be one of: {', '.join(VALID_CAMPAIGNS)}"
        )

    # Get customer
    customer = db.query(Customer).filter(Customer.id == req.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    campaign_info = CAMPAIGNS[req.campaign_name]
    now = datetime.utcnow()

    # Update customer with campaign assignment
    customer.retention_campaign = campaign_info["label"]
    customer.campaign_assigned_date = now
    customer.mitigation_status = "Assigned"

    # Create mitigation log record
    executed_by = current_admin.email if current_admin else "System (User Dashboard)"
    mitigation_log = MitigationLog(
        customer_id=req.customer_id,
        action_type=req.campaign_name,
        executed_by=executed_by,
        status="Assigned",
        notes=req.notes,
    )
    db.add(mitigation_log)

    # Create audit trail activity log
    activity_log = ActivityLog(
        action=f"Campaign Assigned: {campaign_info['label']}",
        user=executed_by,
        details=f"{campaign_info['label']} assigned to {customer.name or req.customer_id}",
        result="Assigned",
    )
    db.add(activity_log)

    db.commit()
    db.refresh(mitigation_log)

    # ── Kirim email notifikasi ke customer ───────────────────────────────────
    if customer.email:
        try:
            assigned_by_name = current_admin.name if current_admin else "ChurnSense Team"
            send_campaign_email(
                to_email=customer.email,
                customer_name=customer.name or "Pelanggan",
                campaign_key=req.campaign_name,
                assigned_by_name=assigned_by_name,
            )
            print(f"[Mitigation] Campaign email sent to {customer.email} for customer {customer.id}")
        except Exception as email_err:
            # Email gagal tidak boleh menghentikan proses assign
            print(f"[Mitigation] Warning: email failed for {customer.email}: {email_err}")
    else:
        print(f"[Mitigation] No email for customer {customer.id} — skipping notification")
    # ─────────────────────────────────────────────────────────────────────────

    return CampaignAssignResponse(
        id=mitigation_log.id,
        customer_id=mitigation_log.customer_id,
        customer_name=customer.name,
        campaign_name=req.campaign_name,
        campaign_label=campaign_info["label"],
        assigned_by=mitigation_log.executed_by,
        assigned_date=now.isoformat(),
        status="Assigned",
        notes=mitigation_log.notes,
    )


# ── AI Campaign Recommendation ──────────────────────────────────────────────

@router.get("/recommend/{customer_id}", response_model=CampaignRecommendation)
def recommend_campaign(
    customer_id: str,
    db: Session = Depends(get_db),
):
    """Return AI-recommended campaign based on customer feedback/churn reason."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    recommended = _recommend_campaign(customer.feedback)
    campaign_info = CAMPAIGNS[recommended]

    # Build human-readable reason
    feedback_text = customer.feedback or "No feedback available"
    reason = f"Based on customer feedback: \"{feedback_text}\""

    return CampaignRecommendation(
        recommended_campaign=recommended,
        campaign_label=campaign_info["label"],
        reason=reason,
    )


# ── Campaign Assignment History for a Customer ──────────────────────────────

@router.get("/logs/{customer_id}")
def get_campaign_logs(customer_id: str, db: Session = Depends(get_db)):
    logs = (
        db.query(MitigationLog)
        .filter(MitigationLog.customer_id == customer_id)
        .order_by(MitigationLog.created_at.desc())
        .all()
    )

    result = []
    for log in logs:
        executor = db.query(User).filter(User.email == log.executed_by).first()
        campaign_label = CAMPAIGNS.get(log.action_type, {}).get("label", log.action_type)
        result.append({
            "id": log.id,
            "customer_id": log.customer_id,
            "campaign_name": log.action_type,
            "campaign_label": campaign_label,
            "assigned_by": log.executed_by,
            "assigned_by_name": executor.name if executor else log.executed_by,
            "assigned_date": log.executed_at.isoformat() if log.executed_at else None,
            "status": log.status,
            "notes": log.notes,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        })

    return result


# ── Campaign Stats for Dashboard ─────────────────────────────────────────────

@router.get("/stats")
def get_campaign_stats(db: Session = Depends(get_db)):
    """Return aggregate campaign assignment statistics for the dashboard."""
    total = db.query(MitigationLog).count()

    stats = {
        "total_campaigns": total,
        "discount_campaigns": db.query(MitigationLog).filter(
            MitigationLog.action_type == "discount_campaign"
        ).count(),
        "support_followups": db.query(MitigationLog).filter(
            MitigationLog.action_type == "customer_support_followup"
        ).count(),
        "loyalty_enrollments": db.query(MitigationLog).filter(
            MitigationLog.action_type == "loyalty_program_enrollment"
        ).count(),
        "product_recommendations": db.query(MitigationLog).filter(
            MitigationLog.action_type == "product_recommendation"
        ).count(),
    }

    return stats


# ── Get CS Agents (for assignment dropdown) ──────────────────────────────────

@router.get("/agents")
def get_cs_agents(
    current_admin: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return list of admins who can be assigned as CS agents."""
    agents = db.query(User).filter(
        User.status == "active",
        User.role.in_([ROLE_COMPANY_ADMIN])
    ).all()

    return [
        {"email": a.email, "name": a.name, "role": a.role}
        for a in agents
    ]
