from rank_bm25 import BM25Okapi
from langchain_core.documents import Document


class BM25Retriever:

    def __init__(
        self,
        documents: list[Document],
    ):

        self.documents = documents

        self.tokenized_documents = [
            self._tokenize(
                document.page_content
            )
            for document in documents
        ]

        self.bm25 = BM25Okapi(
            self.tokenized_documents
        )

    @staticmethod
    def _tokenize(text: str) -> list[str]:

        return text.lower().split()

    def search(
        self,
        query: str,
        k: int = 5,
    ):

        tokenized_query = self._tokenize(
            query
        )

        scores = self.bm25.get_scores(
            tokenized_query
        )

        ranked_indices = sorted(
            range(len(scores)),
            key=lambda i: scores[i],
            reverse=True,
        )

        results = []

        for index in ranked_indices[:k]:

            results.append(
                (
                    self.documents[index],
                    scores[index],
                )
            )

        return results