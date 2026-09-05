from app.ingestion.storage import load_chunks
from app.retrieval.vector_store import load_vector_store
from app.retrieval.bm25 import BM25Retriever
from app.retrieval.reranker import Reranker


_vector_stores = {}
_documents = {}
_bm25_indexes = {}
_reranker = None

def clear_notebook_resources(notebook_id: str):
    _vector_stores.pop(notebook_id, None)
    _documents.pop(notebook_id, None)
    _bm25_indexes.pop(notebook_id, None)

    
def get_vector_store(notebook_id: str):

    if notebook_id not in _vector_stores:

        print(
            f"Loading vector store for notebook: {notebook_id}"
        )

        _vector_stores[notebook_id] = (
            load_vector_store(notebook_id)
        )

    return _vector_stores[notebook_id]


def get_documents(notebook_id: str):

    if notebook_id not in _documents:

        print(
            f"Loading chunks for notebook: {notebook_id}"
        )

        _documents[notebook_id] = load_chunks(
            notebook_id
        )

    return _documents[notebook_id]


def get_bm25(notebook_id: str):

    if notebook_id not in _bm25_indexes:

        print(
            f"Creating BM25 retriever for notebook: {notebook_id}"
        )

        _bm25_indexes[notebook_id] = BM25Retriever(
            get_documents(notebook_id)
        )

    return _bm25_indexes[notebook_id]


def get_reranker():

    global _reranker

    if _reranker is None:

        print("Loading reranker...")

        _reranker = Reranker()

    return _reranker