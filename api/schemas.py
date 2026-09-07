from pydantic import BaseModel, Field


# -------------------------
# RAG
# -------------------------

class QueryRequest(BaseModel):
    query: str
    search_mode: str = "auto"
    conversation_id: str
    notebook_id: str


class TimeTravelRequest(BaseModel):
    thread_id: str
    checkpoint_id: str


# -------------------------
# Conversations
# -------------------------

class ConversationCreate(BaseModel):
    notebook_id: str
    title: str = "New Conversation"


class ConversationResponse(BaseModel):
    id: str
    notebook_id: str
    title: str
    thread_id: str

    class Config:
        from_attributes = True


# -------------------------
# Messages
# -------------------------

class MessageCreate(BaseModel):
    role: str = Field(..., description="Message role: user or assistant")
    content: str


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str

    class Config:
        from_attributes = True