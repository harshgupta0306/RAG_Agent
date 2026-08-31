from app.ingestion.storage import load_chunks
from app.retrieval.vector_store import load_vector_store
from app.retrieval.bm25 import BM25Retriever
from app.retrieval.reranker import Reranker


_vector_store = None
_documents = None
_bm25 = None
_reranker = None


def get_vector_store():

    global _vector_store

    if _vector_store is None:
        print("Loading vector store...")

        _vector_store = load_vector_store()

    return _vector_store


def get_documents():

    global _documents

    if _documents is None:
        print("Loading chunks...")

        _documents = load_chunks()

    return _documents


def get_bm25():

    global _bm25

    if _bm25 is None:
        print("Creating BM25 retriever...")

        _bm25 = BM25Retriever(
            get_documents()
        )

    return _bm25


def get_reranker():

    global _reranker

    if _reranker is None:
        print("Loading reranker...")

        _reranker = Reranker()

    return _reranker