# from app.ingestion.storage import load_chunks

# from app.retrieval.vector_store import (
#     load_vector_store
# )

# from app.retrieval.hybrid import (
#     HybridRetriever
# )

# from app.retrieval.reranker import (
#     Reranker
# )


# class RetrievalPipeline:

#     def __init__(self):

#         # -------------------------
#         # Load stored chunks
#         # -------------------------

#         self.documents = load_chunks()

#         # -------------------------
#         # Load FAISS
#         # -------------------------

#         self.vector_store = (
#             load_vector_store()
#         )

#         # -------------------------
#         # Create hybrid retriever
#         # -------------------------

#         # self.hybrid = HybridRetriever(
#         #     documents=self.documents,
#         #     vector_store=self.vector_store,
#         # )

#         # # -------------------------
#         # # Create reranker
#         # # -------------------------

#         # self.reranker = Reranker()

#     def search(
#         self,
#         query: str,
#         retrieval_k: int = 20,
#         final_k: int = 5,
#     ):

#         # -------------------------
#         # Stage 1: Hybrid retrieval
#         # -------------------------

#         candidates = self.hybrid.search(
#             query,
#             k=retrieval_k,
#         )

#         print(
#             f"Retrieved {len(candidates)} candidates"
#         )

#         # -------------------------
#         # Stage 2: Reranking
#         # -------------------------

#         results = self.reranker.rerank(
#             query=query,
#             documents=candidates,
#             top_k=final_k,
#         )

#         return results