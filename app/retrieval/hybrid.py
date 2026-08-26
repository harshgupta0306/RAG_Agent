from langchain_core.documents import Document

from app.retrieval.bm25 import (
    BM25Retriever
)

from app.retrieval.fusion import (
    reciprocal_rank_fusion
)


class HybridRetriever:

    def __init__(
        self,
        documents: list[Document],
        vector_store,
    ):

        self.documents = documents

        self.vector_store = vector_store

        self.bm25 = BM25Retriever(
            documents
        )

    def search(
        self,
        query: str,
        k: int = 20,
    ):

        # -------------------------
        # Vector search
        # -------------------------

        vector_results = (
            self.vector_store
            .similarity_search(
                query,
                k=k,
            )
        )

        # -------------------------
        # BM25 search
        # -------------------------

        bm25_results = [
            document
            for document, score
            in self.bm25.search(
                query,
                k=k,
            )
        ]

        # -------------------------
        # Fuse results
        # -------------------------

        fused_results = (
            reciprocal_rank_fusion(
                [
                    vector_results,
                    bm25_results,
                ]
            )
        )

        return fused_results[:k]