from typing import Literal, TypedDict

from langchain_core.documents import Document


SearchMode = Literal[
    "auto",
    "semantic",
    "keyword",
    "hybrid",
]


class RetrievalState(TypedDict):

    query: str

    search_mode: SearchMode

    route: str
    
    bm25_documents : list[Document]
    
    documents: list[Document]