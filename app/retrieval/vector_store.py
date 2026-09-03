from pathlib import Path

from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document

from app.retrieval.embeddings import (
    get_embedding_model
)


VECTOR_STORE_PATH = "data/vector_store"


def create_vector_store(
    documents: list[Document],
):

    embedding_model = get_embedding_model()

    vector_store = FAISS.from_documents(
        documents,
        embedding_model,
    )

    Path(VECTOR_STORE_PATH).mkdir(
        parents=True,
        exist_ok=True,
    )

    vector_store.save_local(
        VECTOR_STORE_PATH
    )

    return vector_store

def load_vector_store():

    embedding_model = get_embedding_model()

    return FAISS.load_local(
        VECTOR_STORE_PATH,
        embedding_model,
        allow_dangerous_deserialization=True,
    )

def add_documents_to_vector_store(
    documents: list[Document],
):

    vector_store = load_vector_store()

    vector_store.add_documents(
        documents,
  
    )

    vector_store.save_local(
        VECTOR_STORE_PATH
    )
    return vector_store

