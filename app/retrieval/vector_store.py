from pathlib import Path

from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document

from app.retrieval.embeddings import get_embedding_model


BASE_VECTOR_STORE_PATH = Path("data/notebooks")


def get_vector_store_path(notebook_id: str) -> Path:
    return BASE_VECTOR_STORE_PATH / notebook_id / "vector_store"

def vector_store_exists(notebook_id: str) -> bool:
    vector_store_path = get_vector_store_path(notebook_id)

    return (
        (vector_store_path / "index.faiss").exists()
        and
        (vector_store_path / "index.pkl").exists()
    )

def create_vector_store(
    documents: list[Document],
    notebook_id: str,
):
    embedding_model = get_embedding_model()

    vector_store = FAISS.from_documents(
        documents,
        embedding_model,
    )

    vector_store_path = get_vector_store_path(
        notebook_id
    )

    vector_store_path.mkdir(
        parents=True,
        exist_ok=True,
    )

    vector_store.save_local(
        str(vector_store_path)
    )

    return vector_store


def load_vector_store(
    notebook_id: str,
):
    embedding_model = get_embedding_model()

    vector_store_path = get_vector_store_path(
        notebook_id
    )

    return FAISS.load_local(
        str(vector_store_path),
        embedding_model,
        allow_dangerous_deserialization=True,
    )


def add_documents_to_vector_store(
    documents: list[Document],
    notebook_id: str,
):
    if vector_store_exists(notebook_id):
        vector_store = load_vector_store(
            notebook_id
        )

        vector_store.add_documents(
            documents
        )
        vector_store.save_local(
            str(
                get_vector_store_path(
                    notebook_id
                )
            )
        )
    else:
        vector_store = create_vector_store(
            documents,
            notebook_id
        )


    return vector_store