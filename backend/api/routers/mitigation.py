"""
Mitigation workflow API — single source of truth for all mitigation actions.
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
    MitigationLog, ActivityLog, Customer, AdminUser,
    ROLE_CS_MANAGER, ROLE_CS_AGENT
)
from backend.api.routers.auth import get_current_admin
from backend.api.services.email_service import (
    send_email,
    build_contact_customer_email,
    build_engagement_email,
    build_retention_offer_email,
)

router = APIRouter()

# ── Schemas ──────────────────────────────────────────────────────────────────

class MitigationRequest(BaseModel):
    customer_id: str
    action_type: str  # escalate_cs, contact_customer, assign_agent, send_offer, send_engagement, monitor
    notes: Optional[str] = None
    assigned_agent_email: Optional[str] = None  # Only for assign_agent

class MitigationResponse(BaseModel):
    id: int
    customer_id: str
    customer_name: Optional[str] = None
    action_type: str
    executed_by: str
    executed_at: Optional[str] = None
    status: str
    email_status: Optional[str] = None
    notes: Optional[str] = None
    assigned_agent: Optional[str] = None
    created_at: Optional[str] = None

# ── Action Labels ────────────────────────────────────────────────────────────

ACTION_LABELS = {
    "escalate_cs": "Escalate to CS Manager",
    "contact_customer": "Contact Customer",
    "assign_agent": "Assign CS Agent",
    "send_offer": "Send Retention Offer",
    "send_engagement": "Send Engagement Email",
    "monitor": "Monitor Only",
}

VALID_ACTIONS = list(ACTION_LABELS.keys())

# ── Execute Mitigation ───────────────────────────────────────────────────────

@router.post("/execute", response_model=MitigationResponse)
def execute_mitigation(
    req: MitigationRequest,
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    # Validate action type
    if req.action_type not in VALID_ACTIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action type. Must be one of: {', '.join(VALID_ACTIONS)}"
        )

    # Get customer
    customer = db.query(Customer).filter(Customer.id == req.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    action_label = ACTION_LABELS[req.action_type]
    email_status = None
    mitigation_status = "Completed"
    assigned_agent = None

    # ── Process each action type ─────────────────────────────────────────

    if req.action_type == "contact_customer":
        # Send contact email
        customer_email = f"{customer.name.split(' ')[0].lower()}.{customer.name.split(' ')[-1].lower()}@email.com" if customer.name else "customer@email.com"
        template = build_contact_customer_email(customer.name or "Valued Customer")
        result = send_email(customer_email, template["subject"], template["body"])
        email_status = result["status"]
        if result["status"] == "Failed":
            mitigation_status = "Failed"

    elif req.action_type == "send_engagement":
        # Send engagement email
        customer_email = f"{customer.name.split(' ')[0].lower()}.{customer.name.split(' ')[-1].lower()}@email.com" if customer.name else "customer@email.com"
        template = build_engagement_email(customer.name or "Valued Customer")
        result = send_email(customer_email, template["subject"], template["body"])
        email_status = result["status"]
        if result["status"] == "Failed":
            mitigation_status = "Failed"

    elif req.action_type == "send_offer":
        # Send retention offer email
        customer_email = f"{customer.name.split(' ')[0].lower()}.{customer.name.split(' ')[-1].lower()}@email.com" if customer.name else "customer@email.com"
        template = build_retention_offer_email(customer.name or "Valued Customer")
        result = send_email(customer_email, template["subject"], template["body"])
        email_status = result["status"]
        if result["status"] == "Failed":
            mitigation_status = "Failed"

    elif req.action_type == "assign_agent":
        # Assign to CS Agent
        if req.assigned_agent_email:
            agent = db.query(AdminUser).filter(
                AdminUser.email == req.assigned_agent_email,
            ).first()
            if not agent:
                raise HTTPException(status_code=404, detail="Assigned agent not found")
            assigned_agent = agent.email
        else:
            # Auto-assign: find any CS Agent
            agent = db.query(AdminUser).filter(
                AdminUser.role == ROLE_CS_AGENT,
                AdminUser.status == "Active"
            ).first()
            if agent:
                assigned_agent = agent.email
            else:
                assigned_agent = current_admin.email  # Fallback to self
        
        customer.mitigation_status = "Assigned to CS"
        customer.assigned_to = assigned_agent

    elif req.action_type == "escalate_cs":
        # Escalate to CS Manager
        customer.mitigation_status = "Escalated"
        
        # Find a CS Manager to notify
        cs_manager = db.query(AdminUser).filter(
            AdminUser.role == ROLE_CS_MANAGER,
            AdminUser.status == "Active"
        ).first()
        if cs_manager:
            assigned_agent = cs_manager.email

    elif req.action_type == "monitor":
        # Monitor only — no email, no assignment
        customer.mitigation_status = "Monitoring"
        email_status = None

    # ── Create mitigation log record ─────────────────────────────────────

    mitigation_log = MitigationLog(
        customer_id=req.customer_id,
        action_type=req.action_type,
        executed_by=current_admin.email,
        status=mitigation_status,
        email_status=email_status,
        notes=req.notes,
        assigned_agent=assigned_agent,
    )
    db.add(mitigation_log)

    # ── Create audit trail activity log ──────────────────────────────────

    activity_log = ActivityLog(
        action=f"Mitigation: {action_label}",
        user=current_admin.email,
        details=f"{action_label} for {customer.name or req.customer_id}",
        result=mitigation_status,
        email_status=email_status,
    )
    db.add(activity_log)

    db.commit()
    db.refresh(mitigation_log)

    return MitigationResponse(
        id=mitigation_log.id,
        customer_id=mitigation_log.customer_id,
        customer_name=customer.name,
        action_type=mitigation_log.action_type,
        executed_by=mitigation_log.executed_by,
        executed_at=mitigation_log.executed_at.isoformat() if mitigation_log.executed_at else None,
        status=mitigation_log.status,
        email_status=mitigation_log.email_status,
        notes=mitigation_log.notes,
        assigned_agent=mitigation_log.assigned_agent,
        created_at=mitigation_log.created_at.isoformat() if mitigation_log.created_at else None,
    )


# ── Mitigation History for a Customer ────────────────────────────────────────

@router.get("/logs/{customer_id}")
def get_mitigation_logs(customer_id: str, db: Session = Depends(get_db)):
    logs = (
        db.query(MitigationLog)
        .filter(MitigationLog.customer_id == customer_id)
        .order_by(MitigationLog.created_at.desc())
        .all()
    )

    # Enrich with executor names
    result = []
    for log in logs:
        executor = db.query(AdminUser).filter(AdminUser.email == log.executed_by).first()
        result.append({
            "id": log.id,
            "customer_id": log.customer_id,
            "action_type": log.action_type,
            "action_label": ACTION_LABELS.get(log.action_type, log.action_type),
            "executed_by": log.executed_by,
            "executor_name": executor.name if executor else log.executed_by,
            "executed_at": log.executed_at.isoformat() if log.executed_at else None,
            "status": log.status,
            "email_status": log.email_status,
            "notes": log.notes,
            "assigned_agent": log.assigned_agent,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        })

    return result


# ── Mitigation Stats for Dashboard ───────────────────────────────────────────

@router.get("/stats")
def get_mitigation_stats(db: Session = Depends(get_db)):
    """Return aggregate mitigation statistics for the dashboard."""
    total = db.query(MitigationLog).count()

    stats = {
        "total_mitigations": total,
        "contacted_customers": db.query(MitigationLog).filter(
            MitigationLog.action_type == "contact_customer"
        ).count(),
        "assigned_customers": db.query(MitigationLog).filter(
            MitigationLog.action_type == "assign_agent"
        ).count(),
        "escalated_customers": db.query(MitigationLog).filter(
            MitigationLog.action_type == "escalate_cs"
        ).count(),
        "retention_offers_sent": db.query(MitigationLog).filter(
            MitigationLog.action_type == "send_offer"
        ).count(),
        "engagement_emails_sent": db.query(MitigationLog).filter(
            MitigationLog.action_type == "send_engagement"
        ).count(),
        "monitoring": db.query(MitigationLog).filter(
            MitigationLog.action_type == "monitor"
        ).count(),
        "emails_sent": db.query(MitigationLog).filter(
            MitigationLog.email_status == "Sent"
        ).count(),
        "emails_failed": db.query(MitigationLog).filter(
            MitigationLog.email_status == "Failed"
        ).count(),
    }

    return stats


# ── Get CS Agents (for assign dropdown) ──────────────────────────────────────

@router.get("/agents")
def get_cs_agents(
    current_admin: AdminUser = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """Return list of admins who can be assigned as CS agents."""
    agents = db.query(AdminUser).filter(
        AdminUser.status == "Active",
        AdminUser.role.in_([ROLE_CS_AGENT, ROLE_CS_MANAGER])
    ).all()

    return [
        {"email": a.email, "name": a.name, "role": a.role}
        for a in agents
    ]
