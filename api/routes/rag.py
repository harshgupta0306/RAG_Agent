import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from uuid import uuid4

from api.schemas import QueryRequest, TimeTravelRequest

from app.db.dependencies import get_db
from app.db.database import SessionLocal
from app.db.models import Conversation, Message

from app.graph.main_graph import main_graph


router = APIRouter(
    prefix="/api/rag",
    tags=["RAG"],
)


def document_to_dict(document):
    return {
        "chunk_id": document.metadata.get("chunk_id"),
        "content": document.page_content,
        "metadata": document.metadata,
    }


def get_latest_checkpoint_id(thread_id: str):
    """Return the latest persisted checkpoint for a graph thread, if available."""
    state = main_graph.get_state({
        "configurable": {
            "thread_id": thread_id,
        }
    })
    return state.config.get("configurable", {}).get("checkpoint_id")


def create_node_payload(node_name, state_update, checkpoint_id=None):
    payload = {
        "type": "node",
        "node": node_name,
        "checkpoint_id": checkpoint_id,
        "data": {},
    }
    if node_name == "chat":
        payload["data"] = {
            "status": "completed",
            "answer": state_update.get("answer", ""),
        }

    elif node_name == "retrieval":
        documents = state_update.get("documents", [])

        payload["data"] = {
            "documents": len(documents),
            "results": [
                document_to_dict(document)
                for document in documents
            ],
        }

    elif node_name == "rerank":
        documents = state_update.get("documents", [])

        payload["data"] = {
            "documents": len(documents),
            "results": [
                document_to_dict(document)
                for document in documents
            ],
        }

    elif node_name == "generation":
        payload["data"] = {
            "status": "completed",
            "answer": state_update.get("answer", ""),
        }

    elif node_name == "grading":
        payload["data"] = {
            "grade": state_update.get("grade"),
            "feedback": state_update.get("feedback"),
        }

    elif node_name == "rewrite":
        payload["data"] = {
            "rewritten_query": state_update.get(
                "rewritten_query"
            )
        }

    return payload


def sse(data):
    return (
        f"data: "
        f"{json.dumps(data, default=str)}"
        f"\n\n"
    )


def get_conversation_history(
    db: Session,
    conversation_id: str,
):
    messages = (
        db.query(Message)
        .filter(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
        .all()
    )

    return [
        {
            "role": message.role,
            "content": message.content,
        }
        for message in messages
    ]

# ============================================================
# RAG STREAM
# ============================================================

@router.post("/stream")
def stream_rag(
    request: QueryRequest,
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # 1. Find conversation
    # --------------------------------------------------------

    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == request.conversation_id
        )
        .first()
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found",
        )

    # --------------------------------------------------------
    # 2. Make sure conversation belongs to notebook
    # --------------------------------------------------------

    if conversation.notebook_id != request.notebook_id:
        raise HTTPException(
            status_code=400,
            detail="Conversation does not belong to this notebook",
        )


    conversation_history = get_conversation_history(
    db,
    request.conversation_id,
)
    # --------------------------------------------------------
    # 3. Get LangGraph thread_id from conversation
    # --------------------------------------------------------

    thread_id = conversation.thread_id

    config = {
        "configurable": {
            "thread_id": thread_id
        }
    }

    # --------------------------------------------------------
    # 4. Save USER message
    # --------------------------------------------------------

    user_message = Message(
        id=str(uuid4()),
        conversation_id=conversation.id,
        role="user",
        content=request.query,
    )

    db.add(user_message)
    db.commit()

    # --------------------------------------------------------
    # 5. Initial LangGraph state
    # --------------------------------------------------------

    initial_state = {
        "query": request.query,
        "search_mode": request.search_mode,
        "notebook_id": request.notebook_id,
        "thread_id": thread_id,
        "route": "",
        "documents": [],
        "context": "",
        "answer": "",
        "grade": "",
        "feedback": "",
        "rewritten_query": "",
        "retry_count": 0,
        "retrieval_grade": "",
        "retrieval_feedback": "",
        "conversation_history": conversation_history,
    }

    # --------------------------------------------------------
    # 6. Stream LangGraph
    # --------------------------------------------------------

    def event_generator():

        # We keep the final answer here so that after
        # streaming finishes we can save it to the DB.
        answer = ""

        try:

            pending_node_updates = []

            for mode, data in main_graph.stream(
                initial_state,
                config=config,
                stream_mode=[
                    "updates",
                    "messages",
                    "checkpoints",
                ],
            ):

                # ==================================================
                # NODE / STATE EVENTS
                # ==================================================

                if mode == "updates":

                    # Buffer node updates until LangGraph emits the checkpoint
                    # created for that graph step. This avoids attaching a
                    # stale "latest" checkpoint to the node event.
                    pending_node_updates.extend(data.items())

                    # Capture final answer as soon as its update arrives.
                    for node_name, state_update in data.items():
                        if node_name in {"generation", "chat"}:
                            answer = state_update.get("answer", "")

                elif mode == "checkpoints":
                    checkpoint_id = (
                        data.get("config", {})
                        .get("configurable", {})
                        .get("checkpoint_id")
                    )

                    for node_name, state_update in pending_node_updates:
                        yield sse(create_node_payload(
                            node_name,
                            state_update,
                            checkpoint_id=checkpoint_id,
                        ))

                    pending_node_updates.clear()

                # ==================================================
                # LLM MESSAGE STREAM
                # ==================================================

                elif mode == "messages":

                    message_chunk = data[0]

                    print(
                        "MESSAGE:",
                        message_chunk,
                        flush=True,
                    )

                    if message_chunk.content:

                        payload = {
                            "type": "token",
                            "content": message_chunk.content,
                        }

                        yield sse(payload)

            if pending_node_updates:
                checkpoint_id = get_latest_checkpoint_id(thread_id)
                for node_name, state_update in pending_node_updates:
                    yield sse(create_node_payload(
                        node_name,
                        state_update,
                        checkpoint_id=checkpoint_id,
                    ))

            # ======================================================
            # 7. Save ASSISTANT message
            # ======================================================

            if answer:

                with SessionLocal() as session:

                    assistant_message = Message(
                        id=str(uuid4()),
                        conversation_id=request.conversation_id,
                        role="assistant",
                        content=answer,
                    )

                    session.add(assistant_message)
                    session.commit()

            # ======================================================
            # 8. DONE
            # ======================================================

            yield sse({
                "type": "done"
            })

        except Exception as exc:

            print(
                "STREAM ERROR:",
                repr(exc),
                flush=True,
            )

            yield sse({
                "type": "error",
                "message": str(exc),
            })

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ============================================================
# GET CURRENT STATE
# ============================================================

@router.get("/state/{thread_id}")
async def get_state(thread_id: str):

    config = {
        "configurable": {
            "thread_id": thread_id
        }
    }

    state = main_graph.get_state(config)

    return {
        "values": state.values,
        "next": state.next,
    }


# ============================================================
# CHECKPOINT HISTORY
# ============================================================

@router.get("/history/{thread_id}")
async def get_history(thread_id: str):

    config = {
        "configurable": {
            "thread_id": thread_id
        }
    }

    history = []

    for state in main_graph.get_state_history(config):

        history.append({
            "checkpoint_id": state.config[
                "configurable"
            ].get("checkpoint_id"),

            "values": state.values,

            "next": state.next,
        })

    return {
        "thread_id": thread_id,
        "checkpoints": history,
    }


# ============================================================
# TIME TRAVEL
# ============================================================

@router.post("/time-travel")
async def time_travel(
    request: TimeTravelRequest,
):

    config = {
        "configurable": {
            "thread_id": request.thread_id,
            "checkpoint_id": request.checkpoint_id,
        }
    }

    state = main_graph.get_state(config)

    return {
        "thread_id": request.thread_id,
        "checkpoint_id": request.checkpoint_id,
        "next": list(state.next),
        "values": state.values,
    }


# ============================================================
# RESUME FROM CHECKPOINT
# ============================================================

@router.post("/time-travel/resume")
async def resume_from_checkpoint(
    request: TimeTravelRequest,
):

    config = {
        "configurable": {
            "thread_id": request.thread_id,
            "checkpoint_id": request.checkpoint_id,
        }
    }

    async def event_generator():

        try:

            pending_node_updates = []

            for mode, data in main_graph.stream(
                None,
                config=config,
                stream_mode=[
                    "updates",
                    "messages",
                    "checkpoints",
                ],
            ):

                # ----------------------------------------------
                # Node events
                # ----------------------------------------------

                if mode == "updates":

                    pending_node_updates.extend(data.items())

                elif mode == "checkpoints":
                    checkpoint_id = (
                        data.get("config", {})
                        .get("configurable", {})
                        .get("checkpoint_id")
                    )

                    for node_name, state_update in pending_node_updates:
                        yield sse(create_node_payload(
                            node_name,
                            state_update,
                            checkpoint_id=checkpoint_id,
                        ))

                    pending_node_updates.clear()

                # ----------------------------------------------
                # Token events
                # ----------------------------------------------

                elif mode == "messages":

                    message_chunk = data[0]

                    if message_chunk.content:

                        yield sse({
                            "type": "token",
                            "content": message_chunk.content,
                        })

            if pending_node_updates:
                checkpoint_id = get_latest_checkpoint_id(request.thread_id)
                for node_name, state_update in pending_node_updates:
                    yield sse(create_node_payload(
                        node_name,
                        state_update,
                        checkpoint_id=checkpoint_id,
                    ))

            yield sse({
                "type": "done"
            })

        except Exception as exc:

            yield sse({
                "type": "error",
                "message": str(exc),
            })

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )