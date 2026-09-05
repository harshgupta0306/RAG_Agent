from pathlib import Path

from langchain_core.documents import Document

from app.ingestion.loader import load_document
from app.ingestion.splitter import split_documents
from app.ingestion.storage import add_chunks
from app.resources.retrieval_resources import clear_notebook_resources
from app.retrieval.vector_store import (
    add_documents_to_vector_store,
)


SUPPORTED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".md",
    ".txt",
}


def ingest_file(
    file_path: str,
    notebook_id: str,
) -> list[Document]:

    path = Path(file_path)

    if path.suffix.lower() not in SUPPORTED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file type: {path.suffix}"
        )

    documents = load_document(
        str(path)
    )

    for document in documents:
        document.metadata["source"] = path.name
        document.metadata["notebook_id"] = notebook_id

    chunks = split_documents(
        documents
    )

    add_chunks(
        chunks,
        notebook_id,
    )

    add_documents_to_vector_store(
        chunks,
        notebook_id,
    )
    clear_notebook_resources(notebook_id)

    return chunks