from typing import TypedDict


class RAGState(TypedDict):

    # User input
    question: str

    # Query processing
    query_type: str
    rewritten_query: str

    # Retrieval
    documents: list
    retrieved_documents: list

    # Retrieval evaluation
    retrieval_score: float
    retrieval_ok: bool

    # Generation
    answer: str

    # Answer evaluation
    grounded: bool
    citations_valid: bool

    # Control
    retry_count: int