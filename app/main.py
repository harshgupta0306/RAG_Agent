# from app.retrieval.retrieval_pipeline import (
#     RetrievalPipeline
# )


# def main():

#     pipeline = RetrievalPipeline()

#     query = (
#         "How does LangGraph save state?"
#     )

#     # results = pipeline.search(
#     #     query=query,
#     #     retrieval_k=20,
#     #     final_k=5,
#     # )

#     # print(
#     #     "\nFINAL RERANKED RESULTS"
#     # )

#     # for rank, (
#     #     document,
#     #     score,
#     # ) in enumerate(
#     #     results,
#     #     start=1,
#     # ):

#     #     print(
#     #         "\n============================"
#     #     )

#     #     print(
#     #         f"RANK: {rank}"
#     #     )

#     #     print(
#     #         f"RERANK SCORE: {score}"
#     #     )

#     #     print(
#     #         f"SOURCE: "
#     #         f"{document.metadata['source']}"
#     #     )

#     #     print(
#     #         f"CHUNK: "
#     #         f"{document.metadata['chunk_id']}"
#     #     )

#     #     print(
#     #         "\nCONTENT:"
#     #     )

#     #     print(
#     #         document.page_content
#     #     )


# if __name__ == "__main__":
#     main()

from app.ingestion.pipeline import ingest_file


chunks = ingest_file(
    "data/resume.pdf"
)

print("Total chunks:", len(chunks))

for chunk in chunks:

    print("\n--------------------")

    print("Content:")
    print(chunk.page_content)

    print("\nMetadata:")
    print(chunk.metadata)