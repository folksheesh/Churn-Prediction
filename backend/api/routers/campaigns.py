import os
import datetime
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from backend.core.database import get_db
from backend.core.models import Campaign, CampaignRecipient, EmailLog, Customer, User, ROLE_SUPER_ADMIN, ROLE_COMPANY_ADMIN
from backend.api.routers.auth import require_role
from backend.api.schemas.campaign import (
    CampaignCreate, CampaignUpdate, CampaignResponse,
    CampaignRecipientAdd, CampaignRecipientResponse,
    EmailPreviewRequest, EmailLogResponse
)
from backend.api.services.email_service import send_email

router = APIRouter()

# Allow both super admins and company admins
get_admin = require_role([ROLE_SUPER_ADMIN, ROLE_COMPANY_ADMIN])

def build_campaign_html(content: str, banner_image: str = None) -> str:
    """Wrap the custom rich text content in a standard HTML container."""
    banner_html = f'<div style="text-align: center; margin-bottom: 20px;"><img src="{banner_image}" style="max-width: 100%; border-radius: 8px;" alt="Campaign Banner" /></div>' if banner_image else ''
    
    return f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #ffffff;">
        {banner_html}
        <div style="color: #374151; font-size: 16px; line-height: 1.6;">
            {content}
        </div>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
            &copy; {datetime.datetime.now().year} ChurnSense. All rights reserved.
        </div>
    </div>
    """

def process_dynamic_variables(text: str, customer: Customer, campaign: Campaign = None) -> str:
    if not text:
        return text
    text = text.replace("{{customer_name}}", customer.name or "Valued Customer")
    text = text.replace("{{customer_email}}", customer.email or "")
    text = text.replace("{{risk_level}}", customer.churn_risk or "Standard")
    if campaign:
        text = text.replace("{{campaign_name}}", campaign.name or "Our Campaign")
    return text

@router.get("/", response_model=List[CampaignResponse])
def get_campaigns(db: Session = Depends(get_db), current_admin: User = Depends(get_admin)):
    campaigns = db.query(Campaign).order_by(Campaign.created_at.desc()).all()
    for c in campaigns:
        c.recipient_count = db.query(CampaignRecipient).filter(CampaignRecipient.campaign_id == c.id).count()
    return campaigns

@router.post("/", response_model=CampaignResponse)
def create_campaign(req: CampaignCreate, db: Session = Depends(get_db), current_admin: User = Depends(get_admin)):
    new_campaign = Campaign(
        name=req.name,
        type=req.type,
        description=req.description,
        subject=req.subject,
        content=req.content,
        banner_image=req.banner_image,
        status="draft",
        created_by=current_admin.email
    )
    db.add(new_campaign)
    db.commit()
    db.refresh(new_campaign)
    new_campaign.recipient_count = 0
    return new_campaign

@router.get("/{campaign_id}", response_model=CampaignResponse)
def get_campaign(campaign_id: int, db: Session = Depends(get_db), current_admin: User = Depends(get_admin)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    campaign.recipient_count = db.query(CampaignRecipient).filter(CampaignRecipient.campaign_id == campaign.id).count()
    return campaign

@router.put("/{campaign_id}", response_model=CampaignResponse)
def update_campaign(campaign_id: int, req: CampaignUpdate, db: Session = Depends(get_db), current_admin: User = Depends(get_admin)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    
    if campaign.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft campaigns can be updated")

    update_data = req.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(campaign, key, value)
        
    db.commit()
    db.refresh(campaign)
    campaign.recipient_count = db.query(CampaignRecipient).filter(CampaignRecipient.campaign_id == campaign.id).count()
    return campaign

@router.delete("/{campaign_id}")
def delete_campaign(campaign_id: int, db: Session = Depends(get_db), current_admin: User = Depends(get_admin)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    if campaign.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft campaigns can be deleted")
        
    db.query(CampaignRecipient).filter(CampaignRecipient.campaign_id == campaign_id).delete()
    db.delete(campaign)
    db.commit()
    return {"message": "Campaign deleted"}

@router.get("/{campaign_id}/recipients", response_model=List[CampaignRecipientResponse])
def get_campaign_recipients(campaign_id: int, db: Session = Depends(get_db), current_admin: User = Depends(get_admin)):
    recipients = db.query(CampaignRecipient).filter(CampaignRecipient.campaign_id == campaign_id).all()
    
    # Enrich with customer details
    results = []
    for r in recipients:
        customer = db.query(Customer).filter(Customer.id == r.customer_id).first()
        res = CampaignRecipientResponse.from_orm(r)
        if customer:
            res.customer_name = customer.name
            res.customer_email = customer.email
            res.customer_risk = customer.churn_risk
        results.append(res)
    return results

@router.post("/{campaign_id}/recipients")
def add_recipients(campaign_id: int, req: CampaignRecipientAdd, db: Session = Depends(get_db), current_admin: User = Depends(get_admin)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    if campaign.status != "draft":
        raise HTTPException(status_code=400, detail="Recipients can only be added to draft campaigns")

    # Determine which customers to add
    customer_query = db.query(Customer)
    filters = []
    if req.risk_levels:
        filters.append(Customer.churn_risk.in_(req.risk_levels))
    if req.customer_ids:
        filters.append(Customer.id.in_(req.customer_ids))
        
    if not filters:
        raise HTTPException(status_code=400, detail="Must provide risk_levels or customer_ids")
        
    from sqlalchemy import or_
    customers = customer_query.filter(or_(*filters)).all()
    
    # Add unique recipients
    existing = {r.customer_id for r in db.query(CampaignRecipient).filter(CampaignRecipient.campaign_id == campaign_id).all()}
    
    added_count = 0
    for c in customers:
        if c.id not in existing:
            new_recip = CampaignRecipient(campaign_id=campaign_id, customer_id=c.id)
            db.add(new_recip)
            added_count += 1
            
    db.commit()
    return {"message": f"Added {added_count} recipients"}

@router.delete("/{campaign_id}/recipients/{customer_id}")
def remove_recipient(campaign_id: int, customer_id: str, db: Session = Depends(get_db), current_admin: User = Depends(get_admin)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    if campaign.status != "draft":
        raise HTTPException(status_code=400, detail="Recipients can only be removed from draft campaigns")
        
    recip = db.query(CampaignRecipient).filter(
        CampaignRecipient.campaign_id == campaign_id,
        CampaignRecipient.customer_id == customer_id
    ).first()
    
    if recip:
        db.delete(recip)
        db.commit()
        
    return {"message": "Recipient removed"}

@router.post("/preview")
def preview_email(req: EmailPreviewRequest, db: Session = Depends(get_db), current_admin: User = Depends(get_admin)):
    # Create a dummy customer for preview
    dummy_customer = Customer(
        name="John Doe",
        email="john.doe@example.com",
        churn_risk="High"
    )
    
    subject = process_dynamic_variables(req.subject, dummy_customer)
    content = process_dynamic_variables(req.content, dummy_customer)
    html = build_campaign_html(content, req.banner_image)
    
    return {"subject": subject, "html": html}

def send_campaign_emails_bg(campaign_id: int, db: Session):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        return
        
    recipients = db.query(CampaignRecipient).filter(
        CampaignRecipient.campaign_id == campaign_id,
        CampaignRecipient.email_status == "pending"
    ).all()
    
    for r in recipients:
        customer = db.query(Customer).filter(Customer.id == r.customer_id).first()
        if not customer or not customer.email:
            r.email_status = "failed"
            db.add(EmailLog(
                campaign_id=campaign_id,
                customer_id=r.customer_id,
                email=customer.email if customer else "Unknown",
                status="failed",
                error_message="Customer or email not found",
                sent_at=datetime.datetime.utcnow()
            ))
            continue
            
        try:
            subject = process_dynamic_variables(campaign.subject, customer, campaign)
            content = process_dynamic_variables(campaign.content, customer, campaign)
            html = build_campaign_html(content, campaign.banner_image)
            
            # Send the email
            success = send_email(customer.email, subject, html)
            
            status = "sent" if success else "failed"
            r.email_status = status
            r.sent_at = datetime.datetime.utcnow()
            
            db.add(EmailLog(
                campaign_id=campaign_id,
                customer_id=customer.id,
                email=customer.email,
                status=status,
                sent_at=datetime.datetime.utcnow()
            ))
            
            # Update customer's mitigation status
            if success:
                customer.mitigation_status = "Assigned"
                customer.retention_campaign = campaign.name
                customer.campaign_assigned_date = datetime.datetime.utcnow()
            
        except Exception as e:
            r.email_status = "failed"
            db.add(EmailLog(
                campaign_id=campaign_id,
                customer_id=customer.id,
                email=customer.email,
                status="failed",
                error_message=str(e),
                sent_at=datetime.datetime.utcnow()
            ))
            
    campaign.status = "completed"
    db.commit()

@router.post("/{campaign_id}/send")
def send_campaign(campaign_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_admin: User = Depends(get_admin)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    if campaign.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft campaigns can be sent")
        
    recipient_count = db.query(CampaignRecipient).filter(CampaignRecipient.campaign_id == campaign_id).count()
    if recipient_count == 0:
        raise HTTPException(status_code=400, detail="Cannot send campaign with no recipients")
        
    campaign.status = "active"
    db.commit()
    
    # Send emails in background
    background_tasks.add_task(send_campaign_emails_bg, campaign_id, db)
    
    return {"message": f"Campaign sending started for {recipient_count} recipients"}

@router.get("/logs/history", response_model=List[EmailLogResponse])
def get_email_history(db: Session = Depends(get_db), current_admin: User = Depends(get_admin)):
    logs = db.query(EmailLog).order_by(EmailLog.sent_at.desc()).all()
    results = []
    for log in logs:
        campaign = db.query(Campaign).filter(Campaign.id == log.campaign_id).first()
        customer = db.query(Customer).filter(Customer.id == log.customer_id).first()
        
        res = EmailLogResponse.from_orm(log)
        if campaign:
            res.campaign_name = campaign.name
        if customer:
            res.customer_name = customer.name
        results.append(res)
    return results
