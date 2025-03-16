from typing import Optional, List
from pydantic import BaseModel, Field


class DraftRequest(BaseModel):
    """Model for requesting a draft generation"""
    email_id: str = Field(..., description="ID of the email to generate a draft for")
    custom_instructions: Optional[str] = Field(None, description="Optional custom instructions for draft generation")


class DraftContent(BaseModel):
    """Model for draft content"""
    subject: str
    body: str
    recipient: str
    sender: Optional[str] = None


class DraftResponse(BaseModel):
    """Response model for a generated draft"""
    draft_id: str
    email_id: str
    content: DraftContent
    created_at: str


class DraftListResponse(BaseModel):
    """Response model for listing drafts"""
    drafts: List[DraftResponse]
    total: int
