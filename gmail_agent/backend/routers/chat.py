from fastapi import APIRouter, HTTPException, Depends, Body, status
from typing import Optional, List


from models.chat import ChatQuery, ChatResponse
from services.gmail_service import GmailService
from services.chat_service import ChatService
from dependencies import validate_gmail_client


router = APIRouter()


@router.post("/query", response_model=ChatResponse)
async def chat_query(
    query_data: ChatQuery,
    gmail: GmailService = Depends(validate_gmail_client)
):
    """
    Process a chat query about the user's emails
    
    Takes a query string and returns an answer based on the user's emails
    """
    try:
        # Create chat service
        chat_service = ChatService(gmail_service=gmail)
        
        # Process query
        response = chat_service.chat(
            query=query_data.query,
            time_frame_hours=query_data.time_frame_hours
        )
        
        return response
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing chat query: {str(e)}"
        )


@router.post("/clear-history")
async def clear_chat_history(gmail: GmailService = Depends(validate_gmail_client)):
    """
    Clear chat history
    
    Removes all previous chat messages from the history
    """
    try:
        # Create chat service
        chat_service = ChatService(gmail_service=gmail)
        
        # Clear history
        chat_service.clear_chat_history()
        
        return {"success": True, "message": "Chat history cleared successfully"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error clearing chat history: {str(e)}"
        )
