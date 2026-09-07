from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.dependencies import get_db
from app.db.models import Notebook, Conversation, Message

from api.schemas import (
    ConversationCreate,
    ConversationResponse,
    MessageCreate,
    MessageResponse,
)


router = APIRouter(
    prefix="/api",
    tags=["conversations"],
)


# ============================================================
# Create conversation
# ============================================================

@router.post(
    "/conversations",
    response_model=ConversationResponse,
)
def create_conversation(
    data: ConversationCreate,
    db: Session = Depends(get_db),
):
    # Check notebook exists
    notebook = (
        db.query(Notebook)
        .filter(Notebook.id == data.notebook_id)
        .first()
    )

    if not notebook:
        raise HTTPException(
            status_code=404,
            detail="Notebook not found",
        )

    conversation = Conversation(
        id=str(uuid4()),
        notebook_id=data.notebook_id,
        title=data.title,
        thread_id=str(uuid4()),
    )

    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    return conversation


# ============================================================
# Get conversations for notebook
# ============================================================

@router.get(
    "/notebooks/{notebook_id}/conversations",
    response_model=list[ConversationResponse],
)
def get_notebook_conversations(
    notebook_id: str,
    db: Session = Depends(get_db),
):
    # Check notebook exists
    notebook = (
        db.query(Notebook)
        .filter(Notebook.id == notebook_id)
        .first()
    )

    if not notebook:
        raise HTTPException(
            status_code=404,
            detail="Notebook not found",
        )

    conversations = (
        db.query(Conversation)
        .filter(
            Conversation.notebook_id == notebook_id
        )
        .order_by(
            Conversation.created_at.desc()
        )
        .all()
    )

    return conversations


# ============================================================
# Get single conversation
# ============================================================

@router.get(
    "/conversations/{conversation_id}",
    response_model=ConversationResponse,
)
def get_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
):
    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id
        )
        .first()
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found",
        )

    return conversation


# ============================================================
# Add message to conversation
# ============================================================

@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=MessageResponse,
)
def create_message(
    conversation_id: str,
    data: MessageCreate,
    db: Session = Depends(get_db),
):
    # Check conversation exists
    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id
        )
        .first()
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found",
        )

    # Validate role
    if data.role not in {"user", "assistant"}:
        raise HTTPException(
            status_code=400,
            detail="Role must be 'user' or 'assistant'",
        )

    message = Message(
        id=str(uuid4()),
        conversation_id=conversation_id,
        role=data.role,
        content=data.content,
    )

    db.add(message)
    db.commit()
    db.refresh(message)

    return message


# ============================================================
# Get conversation messages
# ============================================================

@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=list[MessageResponse],
)
def get_conversation_messages(
    conversation_id: str,
    db: Session = Depends(get_db),
):
    # Check conversation exists
    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id
        )
        .first()
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found",
        )

    messages = (
        db.query(Message)
        .filter(
            Message.conversation_id == conversation_id
        )
        .order_by(
            Message.created_at.asc()
        )
        .all()
    )

    return messages