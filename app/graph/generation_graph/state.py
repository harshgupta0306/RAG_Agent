from typing import TypedDict

from langchain_core.documents import Document


class GenerationState(TypedDict):

    query: str

    documents: list[Document]

    context: str

    answer: str