import json
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from uuid import uuid4

from fastapi import (
    File,
    HTTPException,
    UploadFile,
)

from app.ingestion.pipeline import ingest_file
from app.graph.main_graph import main_graph

app = FastAPI(
    title="Advanced Agentic RAG API",
    version="1.0.0",
)



app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TimeTravelRequest(BaseModel):

    thread_id: str

    checkpoint_id: str

class QueryRequest(BaseModel):
    query: str
    search_mode: str = "auto"
    thread_id: str


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "agentic-rag",
    }


@app.post("/api/rag/stream")
def stream_rag(request: QueryRequest):

    thread_id = request.thread_id

    config = {
        "configurable": {
            "thread_id": thread_id
        }
    }

    initial_state = {
        "query": request.query,
        "search_mode": request.search_mode,

        "documents": [],
        "context": "",
        "answer": "",
        "grade": "",
        "feedback": "",

        "rewritten_query": "",
        "retry_count": 0,

        "retrieval_grade": "",
        "retrieval_feedback": "",
    }


    def event_generator():

        try:

            for mode, data in main_graph.stream(
                initial_state,
                config=config,
                stream_mode=["updates", "messages"],
            ):

                # -----------------------------
                # NODE / STATE EVENTS
                # -----------------------------

                if mode == "updates":

                    for node_name, state_update in data.items():

                        payload = {
                            "type": "node",
                            "node": node_name,
                            "data": {}
                        }

                        # Retrieval
                        if node_name == "retrieval":

                            documents = state_update.get(
                                "documents",
                                []
                            )

                            results = []

                            for document in documents:

                                results.append({
                                    "chunk_id": document.metadata.get(
                                        "chunk_id"
                                    ),

                                    "content": document.page_content,

                                    "metadata": document.metadata,
                                })

                            payload["data"] = {
                                "documents": len(documents),
                                "results": results,
                            }


                        elif node_name == "rerank":

                            documents = state_update.get(
                                "documents",
                                []
                            )

                            results = []

                            for document in documents:

                                results.append({
                                    "chunk_id": document.metadata.get(
                                        "chunk_id"
                                    ),

                                    "content": document.page_content,

                                    "metadata": document.metadata,
                                })

                            payload["data"] = {
                                "documents": len(documents),
                                "results": results,
                            }

                        # Generation
                        elif node_name == "generation":
                            answer = state_update.get("answer", "")
                            payload["data"] = {
                                "status": "completed",
                                "answer": answer,
                            }

                        # Grading
                        elif node_name == "grading":

                            payload["data"] = {
                                "grade": state_update.get(
                                    "grade"
                                ),
                                "feedback": state_update.get(
                                    "feedback"
                                ),
                            }

                        # Rewrite
                        elif node_name == "rewrite":

                            payload["data"] = {
                                "rewritten_query":
                                    state_update.get(
                                        "rewritten_query"
                                    )
                            }

                        yield (
                            "data: "
                            + json.dumps(
                                payload,
                                default=str
                            )
                            + "\n\n"
                        )


                # -----------------------------
                # LLM MESSAGE STREAM
                # -----------------------------

                elif mode == "messages":
                    print(
                        "MESSAGE:",
                        message_chunk,
                        flush=True
                            )
                    message_chunk = data[0]

                    if message_chunk.content:

                        payload = {
                            "type": "token",
                            "content":
                                message_chunk.content,
                        }

                        yield (
                            "data: "
                            + json.dumps(payload)
                            + "\n\n"
                        )


            # -----------------------------
            # DONE
            # -----------------------------

            yield (
                "data: "
                + json.dumps({
                    "type": "done"
                })
                + "\n\n"
            )


        except Exception as exc:

            print(
                "STREAM ERROR:",
                repr(exc),
                flush=True
            )

            yield (
                "data: "
                + json.dumps({
                    "type": "error",
                    "message": str(exc),
                })
                + "\n\n"
            )


    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/rag/state/{thread_id}")
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

@app.get("/api/rag/history/{thread_id}")
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


@app.post("/api/rag/time-travel")
async def time_travel(
    request: TimeTravelRequest
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

@app.post("/api/rag/time-travel/resume")
async def resume_from_checkpoint(
    request: TimeTravelRequest
):

    config = {
        "configurable": {
            "thread_id": request.thread_id,

            "checkpoint_id": request.checkpoint_id,
        }
    }

    async def event_generator():

        try:

            for event in main_graph.stream(
                None,
                config=config,
                stream_mode=[
                    "updates",
                    "messages",
                ],
            ):

                # Your existing SSE
                # event processing goes here.

                yield f"data: {event}\n\n"

        except Exception as e:

            yield (
                f"data: {{\"type\":\"error\","
                f"\"message\":\"{str(e)}\"}}\n\n"
            )

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
    )

UPLOAD_DIR = Path("data/documents")


@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...)):

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Filename is required",
        )

    extension = (
        Path(file.filename)
        .suffix
        .lower()
    )

    if extension not in {
        ".pdf",
        ".docx",
        ".md",
        ".txt",
    }:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file type",
        )

    UPLOAD_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    document_id = str(uuid4())

    file_path = (
        UPLOAD_DIR /
        f"{document_id}{extension}"
    )

    try:

        with file_path.open("wb") as buffer:

            while chunk := await file.read(
                1024 * 1024
            ):
                buffer.write(chunk)

        chunks = ingest_file(
            str(file_path)
        )

    except Exception as exc:

        file_path.unlink(
            missing_ok=True
        )

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )

    return {
        "document_id": document_id,
        "file_name": file.filename,
        "file_type": extension.lstrip("."),
        "chunks": len(chunks),
        "status": "indexed",
    }