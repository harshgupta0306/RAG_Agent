from pathlib import Path
from uuid import uuid4

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
)
from sqlalchemy.orm import Session

from app.db.dependencies import get_db
from app.db.models import Document, Notebook
from app.ingestion.pipeline import ingest_file


router = APIRouter(
    prefix="/api/notebooks",
    tags=["Documents"],
)


UPLOAD_DIR = Path("data/documents")

ALLOWED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".md",
    ".txt",
}


@router.post("/{notebook_id}/documents")
async def upload_document(
    notebook_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):

    # --------------------------------
    # Check notebook
    # --------------------------------

    notebook = db.get(
        Notebook,
        notebook_id,
    )

    if not notebook:

        raise HTTPException(
            status_code=404,
            detail="Notebook not found",
        )

    # --------------------------------
    # Validate filename
    # --------------------------------

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="Filename is required",
        )

    # --------------------------------
    # Validate extension
    # --------------------------------

    extension = (
        Path(file.filename)
        .suffix
        .lower()
    )

    if extension not in ALLOWED_EXTENSIONS:

        raise HTTPException(
            status_code=400,
            detail="Unsupported file type",
        )

    # --------------------------------
    # Create upload directory
    # --------------------------------

    UPLOAD_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    # --------------------------------
    # Generate document ID
    # --------------------------------

    document_id = str(uuid4())

    file_path = (
        UPLOAD_DIR
        / f"{document_id}{extension}"
    )

    try:

        # --------------------------------
        # Save uploaded file
        # --------------------------------

        with file_path.open("wb") as buffer:

            while chunk := await file.read(
                1024 * 1024
            ):
                buffer.write(chunk)

        # --------------------------------
        # Ingest document
        # --------------------------------

        chunks = ingest_file(
            str(file_path),
            notebook_id=notebook_id,
            original_filename=file.filename,
            document_id=document_id
        )

        # --------------------------------
        # Save document metadata
        # --------------------------------

        document = Document(
            id=document_id,
            notebook_id=notebook_id,
            file_name=file.filename,
            file_type=extension.lstrip("."),
            file_path=str(file_path),
            status="indexed",
            chunks=len(chunks),
        )

        db.add(document)
        db.commit()
        db.refresh(document)

    except Exception as exc:

        file_path.unlink(
            missing_ok=True
        )

        raise HTTPException(
            status_code=500,
            detail=str(exc),
        )
    finally:
        
        file_path.unlink(missing_ok=True)
    return {
        "document_id": document.id,
        "notebook_id": notebook_id,
        "file_name": document.file_name,
        "file_type": document.file_type,
        "chunks": document.chunks,
        "status": document.status,
    }


@router.get("/{notebook_id}/documents")
def get_documents(
    notebook_id: str,
    db: Session = Depends(get_db),
):
    notebook = db.get(Notebook, notebook_id)
    if not notebook:
        raise HTTPException(
            status_code=404,
            detail="Notebook not found",
        )

    documents = (
        db.query(Document)
        .filter(Document.notebook_id == notebook_id)
        .order_by(Document.created_at.desc())
        .all()
    )

    return [
        {
            "document_id": doc.id,
            "notebook_id": doc.notebook_id,
            "file_name": doc.file_name,
            "file_type": doc.file_type,
            "chunks": doc.chunks,
            "status": doc.status,
            "created_at": doc.created_at.isoformat() if doc.created_at else None,
        }
        for doc in documents
    ]


@router.delete("/{notebook_id}/documents/{document_id}")
def delete_document(
    notebook_id: str,
    document_id: str,
    db: Session = Depends(get_db),
):
    document = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.notebook_id == notebook_id,
        )
        .first()
    )

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    # Remove the underlying file if it exists
    if document.file_path:
        Path(document.file_path).unlink(missing_ok=True)

    db.delete(document)
    db.commit()

    return {"status": "deleted", "document_id": document_id}