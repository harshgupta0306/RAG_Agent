from app.resources.retrieval_resources import (
    get_vector_store,
    get_bm25,
    get_reranker,
)

from app.retrieval.fusion import (
    reciprocal_rank_fusion,
)


def semantic_search_node(state):

    query = state["query"]

    vector_store = get_vector_store(state["notebook_id"])

    documents = vector_store.similarity_search(
        query,
        k=20,
    )

    return {
        "documents": documents
    }


def keyword_search_node(state):

    query = state["query"]

    bm25 = get_bm25(state["notebook_id"])

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

    semantic = state["documents"]

    bm25_documents = state[
        "bm25_documents"
    ]

    documents = reciprocal_rank_fusion(
        [
            semantic,
            bm25_documents,
        ]
    )

    return {
        "documents": documents
    }


def rerank_node(state):

    query = state["query"]

    documents = state["documents"]

    reranker = get_reranker()

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