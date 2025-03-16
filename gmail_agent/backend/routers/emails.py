from fastapi import APIRouter, HTTPException, Depends, Query, Path, status
from typing import Optional, List

from models.email import (
    EmailFilter, 
    EmailDetail, 
    EmailSummary, 
    EmailListResponse,
    PriorityEmailResponse
)
from services.gmail_service import GmailService
from services.prioritizer_service import EmailPrioritizerService
from dependencies import validate_gmail_client


router = APIRouter()


@router.get("/priority", response_model=PriorityEmailResponse)
async def get_priority_emails(
    time_frame_hours: int = Query(24, ge=1, le=336, description="Time frame in hours to fetch emails from"),
    gmail: GmailService = Depends(validate_gmail_client)
):
    """
    Get prioritized emails
    
    Returns two lists: top important emails and emails needing replies within the specified time frame
    """
    try:
        # Create email prioritizer service
        prioritizer = EmailPrioritizerService(gmail_service=gmail)
        
        # Get prioritized emails
        result = prioritizer.prioritize_emails(time_frame_hours=time_frame_hours)
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error prioritizing emails: {str(e)}"
        )


@router.get("/list", response_model=EmailListResponse)
async def list_emails(
    time_frame_hours: int = Query(24, ge=1, le=336, description="Time frame in hours to fetch emails from"),
    include_promotions: bool = Query(False, description="Include promotional emails"),
    include_social: bool = Query(False, description="Include social emails"),
    search_query: Optional[str] = Query(None, description="Search query to filter emails"),
    max_results: Optional[int] = Query(None, ge=1, le=100, description="Maximum number of results to return"),
    gmail: GmailService = Depends(validate_gmail_client)
):
    """
    List emails from the inbox
    
    Returns a list of email summaries within the specified time frame and filters
    """
    try:
        # Get emails based on the filters
        emails = gmail.get_recent_emails(
            time_frame_hours=time_frame_hours,
            include_promotions=include_promotions,
            include_social=include_social,
            search_query=search_query,
            max_results=max_results
        )
        
        # Convert to email summary models
        email_summaries = [gmail.convert_to_email_summary(email) for email in emails]
        
        return EmailListResponse(
            emails=email_summaries,
            total=len(email_summaries),
            next_page_token=None  # Pagination not implemented in this version
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing emails: {str(e)}"
        )


@router.get("/reply-needed", response_model=List[EmailSummary])
async def get_reply_needed_emails(
    time_frame_hours: int = Query(24, ge=1, le=336, description="Time frame in hours to fetch emails from"),
    gmail: GmailService = Depends(validate_gmail_client)
):
    """
    Get emails that need replies
    
    Returns a list of emails that likely require a response
    """
    try:
        # Create email prioritizer service
        prioritizer = EmailPrioritizerService(gmail_service=gmail)
        
        # Get prioritized emails, but we're only interested in reply_needed_emails
        result = prioritizer.prioritize_emails(time_frame_hours=time_frame_hours)
        return result.reply_needed_emails
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting reply needed emails: {str(e)}"
        )


@router.get("/{email_id}", response_model=EmailDetail)
async def get_email_detail(
    email_id: str = Path(..., description="Email ID to fetch"),
    gmail: GmailService = Depends(validate_gmail_client)
):
    """
    Get detailed information about a specific email
    
    Returns full email content including body and attachment information
    """
    try:
        email = gmail.get_message_by_id(email_id)
        if not email:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Email with ID {email_id} not found"
            )
            
        email_detail = gmail.convert_to_email_detail(email)
        return email_detail
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting email detail: {str(e)}"
        )
