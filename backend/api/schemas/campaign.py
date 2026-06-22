from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class CampaignCreate(BaseModel):
    name: str
    type: str
    description: Optional[str] = None
    subject: str
    content: str
    banner_image: Optional[str] = None

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    subject: Optional[str] = None
    content: Optional[str] = None
    banner_image: Optional[str] = None

class CampaignResponse(BaseModel):
    id: int
    name: str
    type: str
    description: Optional[str]
    subject: str
    content: str
    banner_image: Optional[str]
    status: str
    created_by: str
    created_at: datetime
    updated_at: Optional[datetime]
    recipient_count: Optional[int] = 0

    class Config:
        orm_mode = True

class CampaignRecipientAdd(BaseModel):
    risk_levels: Optional[List[str]] = None
    customer_ids: Optional[List[str]] = None

class CampaignRecipientResponse(BaseModel):
    id: int
    campaign_id: int
    customer_id: str
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_risk: Optional[str] = None
    email_status: str
    sent_at: Optional[datetime]

    class Config:
        orm_mode = True

class EmailPreviewRequest(BaseModel):
    subject: str
    content: str
    banner_image: Optional[str] = None
    type: str

class EmailLogResponse(BaseModel):
    id: int
    campaign_id: int
    campaign_name: Optional[str] = None
    customer_id: str
    customer_name: Optional[str] = None
    email: str
    status: str
    error_message: Optional[str] = None
    sent_at: Optional[datetime]

    class Config:
        orm_mode = True
