from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class EmailAttachment(BaseModel):
    """Model for email attachment data"""
    filename: str
    attachment_id: str
    content_type: Optional[str] = None
    size: Optional[int] = None


class EmailBase(BaseModel):
    """Base model for email data"""
    email_id: str
    subject: str
    sender: str
    date: str
    snippet: Optional[str] = None


class EmailDetail(EmailBase):
    """Detailed email model including body and attachments"""
    body: Optional[str] = None
    html: Optional[str] = None
    attachments: List[EmailAttachment] = []
    importance_score: Optional[float] = None
    needs_reply: Optional[bool] = None


class EmailSummary(EmailBase):
    """Summarized email model for list views"""
    summary: Optional[str] = None
    has_attachments: bool = False
    importance_score: Optional[float] = None
    needs_reply: Optional[bool] = None


class EmailFilter(BaseModel):
    """Model for filtering emails"""
    time_frame_hours: int = 24
    include_promotions: bool = False
    include_social: bool = False
    search_query: Optional[str] = None
    max_results: Optional[int] = None


class PriorityEmailResponse(BaseModel):
    """Response model for prioritized emails"""
    top_important_emails: List[EmailSummary]
    reply_needed_emails: List[EmailSummary]


class EmailListResponse(BaseModel):
    """Response model for email listing"""
    emails: List[EmailSummary]
    total: int
    next_page_token: Optional[str] = None


class AttachmentSummary(BaseModel):
    """Model for attachment summary"""
    email_id: str
    attachment_id: str
    filename: str
    summary: str
