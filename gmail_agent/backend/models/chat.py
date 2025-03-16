from typing import List, Optional
from pydantic import BaseModel


class ChatQuery(BaseModel):
    """Model for chat query input"""
    query: str
    time_frame_hours: int = 24


class ChatMessage(BaseModel):
    """Model for a chat message"""
    role: str  # "user" or "assistant"
    text: str
    timestamp: Optional[str] = None


class ChatResponse(BaseModel):
    """Response model for chat operations"""
    answer: str
    messages: List[ChatMessage]
