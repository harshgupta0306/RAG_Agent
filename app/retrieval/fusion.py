from collections import defaultdict

from langchain_core.documents import Document


def reciprocal_rank_fusion(
    result_lists: list[list[Document]],
    k: int = 60,
) -> list[Document]:

    scores = defaultdict(float)

    documents = {}

    for results in result_lists:

        for rank, document in enumerate(
            results,
            start=1,
        ):

            document_id = document.metadata[
                "chunk_id"
            ]

            scores[document_id] += (
                1 / (k + rank)
            )

            documents[document_id] = document

    ranked_ids = sorted(
        scores,
        key=scores.get,
        reverse=True,
    )

    return [
        documents[document_id]
        for document_id in ranked_ids
    ]