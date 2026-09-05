from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.db.models import Notebook


router = APIRouter(
    prefix="/api/notebooks",
    tags=["notebooks"],
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()


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
    }

@router.get("")
def get_notebooks(
    db: Session = Depends(get_db),
):
    notebooks = db.query(Notebook).all()

    return notebooks