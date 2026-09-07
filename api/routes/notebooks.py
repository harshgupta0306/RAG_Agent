from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.dependencies import get_db
from app.db.models import Notebook


router = APIRouter(
    prefix="/api/notebooks",
    tags=["notebooks"],
)


class NotebookCreate(BaseModel):
    name: str


@router.post("")
def create_notebook(
    notebook_data: NotebookCreate,
    db: Session = Depends(get_db),
):
    notebook = Notebook(
        name=notebook_data.name,
    )

    db.add(notebook)
    db.commit()
    db.refresh(notebook)

    return {
        "id": notebook.id,
        "name": notebook.name,
        "created_at": notebook.created_at,
        "documents_count": 0,
        "conversations_count": 0,
    }


@router.get("")
def get_notebooks(
    db: Session = Depends(get_db),
):
    notebooks = (
        db.query(Notebook)
        .order_by(Notebook.created_at.desc())
        .all()
    )

    return [
        {
            "id": nb.id,
            "name": nb.name,
            "created_at": nb.created_at,
            "documents_count": len(nb.documents),
            "conversations_count": len(nb.conversations),
        }
        for nb in notebooks
    ]


@router.get("/{notebook_id}")
def get_notebook(
    notebook_id: str,
    db: Session = Depends(get_db),
):
    notebook = db.get(Notebook, notebook_id)
    if not notebook:
        raise HTTPException(
            status_code=404,
            detail="Notebook not found",
        )

    return {
        "id": notebook.id,
        "name": notebook.name,
        "created_at": notebook.created_at,
        "documents_count": len(notebook.documents),
        "conversations_count": len(notebook.conversations),
    }


@router.delete("/{notebook_id}")
def delete_notebook(
    notebook_id: str,
    db: Session = Depends(get_db),
):
    notebook = db.get(Notebook, notebook_id)
    if not notebook:
        raise HTTPException(
            status_code=404,
            detail="Notebook not found",
        )

    db.delete(notebook)
    db.commit()

    return {"status": "deleted", "id": notebook_id}