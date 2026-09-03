from pathlib import Path

from langchain_core.documents import Document

from app.ingestion.loader import load_document
from app.ingestion.splitter import split_documents
from app.ingestion.storage import add_chunks
from app.retrieval.vector_store import add_documents_to_vector_store


SUPPORTED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".md",
    ".txt",
}


def ingest_file(
    file_path: str,
) -> list[Document]:

    path = Path(file_path)

    if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file type: {path.suffix}"
        )
    print("loading docs")
    # -------------------------
    # Load
    # -------------------------

    documents = load_document(
        str(path)
    )

    # -------------------------
    # Add source metadata
    # -------------------------

    for document in documents:

        document.metadata["source"] = (
            path.name
        )

    # -------------------------
    # Split
    # -------------------------

    chunks = split_documents(
        documents
    )

    # -------------------------
    # Save
    # -------------------------
    print("pickel docs")
    
    add_chunks(
        chunks
    )
    print("adding docs")

    # ------------------------- # 
    # Add chunks to FAISS 
    # # ------------------------- 
    add_documents_to_vector_store( chunks )

    return chunks