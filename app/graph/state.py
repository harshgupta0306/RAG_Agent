from typing import TypedDict

from langchain_core.documents import Document


class RAGState(TypedDict):

    query: str

    search_mode: str

    documents: list[Document]

    context: str

    answer: str

    grade: str

    feedback: str
    rewritten_query: str
    retry_count: int