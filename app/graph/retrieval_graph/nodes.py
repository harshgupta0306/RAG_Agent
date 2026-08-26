from app.ingestion.storage import load_chunks
from app.retrieval.retrieval_pipeline import (
    RetrievalPipeline,
)
from app.retrieval.vector_store import load_vector_store
from app.retrieval.bm25 import (
    BM25Retriever
)
from app.retrieval.fusion import (reciprocal_rank_fusion)
from app.retrieval.reranker import (Reranker)

vector_store = load_vector_store()

retrieval_pipeline = RetrievalPipeline()

documents = load_chunks()

reranker = Reranker() 

bm25 = BM25Retriever(documents)

def semantic_search_node(state):

    query = state["query"]

    documents = vector_store.similarity_search(
            query,
            k=20,
        )

    return {
        "documents": documents
    }

def keyword_search_node(state):

    query = state["query"]

    results = bm25.search(
        query,
        k=20,
    )

    documents = [
        document
        for document, score in results
    ]

    return {
        "bm25_documents": documents
    }

def hybrid_search_node(state):

    query = state["query"]
    semantic = state["documents"]
    bm25 = state["bm25_documents"]

    documents = reciprocal_rank_fusion(
        [semantic,bm25]
    )

    return {
        "documents": documents
    }

def rerank_node(state):

    query = state["query"]

    documents = state["documents"]

    results = reranker.rerank(
        query=query,
        documents=documents,
        top_k=5,
    )

    documents = [
        document
        for document, score in results
    ]

    return {
        "documents": documents
    }