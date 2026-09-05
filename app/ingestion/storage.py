import pickle
from pathlib import Path

from langchain_core.documents import Document


BASE_CHUNKS_PATH = Path("data/notebooks")


def get_chunks_path(notebook_id: str) -> Path:
    notebook_path = BASE_CHUNKS_PATH / notebook_id

    notebook_path.mkdir(
        parents=True,
        exist_ok=True,
    )

    return notebook_path / "chunks.pkl"


def save_chunks(
    chunks: list[Document],
    notebook_id: str,
):
    chunks_path = get_chunks_path(
        notebook_id
    )

    with open(
        chunks_path,
        "wb",
    ) as file:
        pickle.dump(
            chunks,
            file,
        )


def load_chunks(
    notebook_id: str,
) -> list[Document]:

    chunks_path = get_chunks_path(
        notebook_id
    )

    if not chunks_path.exists():
        return []

    with open(
        chunks_path,
        "rb",
    ) as file:
        return pickle.load(file)


def add_chunks(
    chunks: list[Document],
    notebook_id: str,
):
    previous_docs = load_chunks(
        notebook_id
    )

    updated_docs = (
        previous_docs + chunks
    )

    save_chunks(
        updated_docs,
        notebook_id,
    )