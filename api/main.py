from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes.notebooks import router as notebooks_router
from api.routes.rag import router as rag_router
from api.routes.documents import router as documents_router
from api.routes.conversations import router as conversations_router

app = FastAPI(
    title="Advanced Agentic RAG API",
    version="1.0.0",
)


# --------------------------------
# CORS
# --------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------
# Routers
# --------------------------------

app.include_router(
    notebooks_router
)

app.include_router(
    rag_router
)

app.include_router(
    documents_router
)
app.include_router(conversations_router)

# --------------------------------
# Health
# --------------------------------

@app.get("/health")
def health():

    return {
        "status": "ok",
        "service": "agentic-rag",
    }