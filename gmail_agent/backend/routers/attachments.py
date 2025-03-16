from fastapi import APIRouter, HTTPException, Depends, Path, status
from typing import List, Dict, Any, Optional
from fastapi.responses import JSONResponse, StreamingResponse
import io
from models.email import AttachmentSummary, EmailAttachment
from services.gmail_service import GmailService
from services.attachment_service import AttachmentService
from dependencies import validate_gmail_client


router = APIRouter()


@router.get("/{email_id}", response_model=List[EmailAttachment])
async def list_attachments(
    email_id: str = Path(..., description="Email ID to list attachments for"),
    gmail: GmailService = Depends(validate_gmail_client)
):
    """
    List all attachments for a specific email
    
    Returns a list of attachment metadata for the specified email
    """
    try:
        # Create attachment service
        attachment_service = AttachmentService(gmail_service=gmail)
        
        # Get attachments
        attachments = attachment_service.list_attachments(email_id=email_id)
        
        # Convert to EmailAttachment models
        attachment_models = []
        for att in attachments:
            attachment_models.append(EmailAttachment(
                filename=att["filename"],
                attachment_id=att["attachment_id"],
                content_type=att["content_type"],
                size=att["size"]
            ))
            
        return attachment_models
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing attachments: {str(e)}"
        )


@router.get("/{email_id}/{attachment_id}/summary", response_model=AttachmentSummary)
async def get_attachment_summary(
    email_id: str = Path(..., description="Email ID"),
    attachment_id: str = Path(..., description="Attachment ID"),
    gmail: GmailService = Depends(validate_gmail_client)
):
    """
    Get a summary for a specific attachment
    
    Returns a summary of the attachment's content
    """
    try:
        # Create attachment service
        attachment_service = AttachmentService(gmail_service=gmail)
        
        # Get attachment summary
        summary = attachment_service.summarize_attachment(
            email_id=email_id,
            attachment_id=attachment_id
        )
        
        if not summary:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Attachment not found or could not be summarized"
            )
            
        return summary
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error summarizing attachment: {str(e)}"
        )


@router.get("/{email_id}/{attachment_id}/download")
async def download_attachment(
    email_id: str = Path(..., description="Email ID"),
    attachment_id: str = Path(..., description="Attachment ID"),
    gmail: GmailService = Depends(validate_gmail_client)
):
    """
    Download a specific attachment
    
    Returns the attachment file as a downloadable response
    """
    try:
        # Create attachment service
        attachment_service = AttachmentService(gmail_service=gmail)
        
        # Get attachment
        attachment = attachment_service.get_attachment(
            email_id=email_id,
            attachment_id=attachment_id
        )
        
        if not attachment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Attachment not found"
            )
        
        # Get attachment content
        content = attachment.download()
        if not content:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Could not download attachment content"
            )
        
        # Create a stream from the content
        stream = io.BytesIO(content)
        
        # Determine content type
        content_type = "application/octet-stream"
        if hasattr(attachment, 'filetype') and attachment.filetype:
            content_type = attachment.filetype
        
        # Return streaming response
        return StreamingResponse(
            stream, 
            media_type=content_type,
            headers={
                "Content-Disposition": f"attachment; filename=\"{attachment.filename}\""
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error downloading attachment: {str(e)}"
        )
