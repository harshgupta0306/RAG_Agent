
import os
from uuid import NAMESPACE_URL, uuid5

from dotenv import load_dotenv
from qdrant_client import QdrantClient, models

from app.retrieval.embeddings import get_embedding_model

load_dotenv()

QDRANT_COLLECTION = os.getenv(
    "QDRANT_COLLECTION",
    "rag_chunks",
)

DENSE_VECTOR_NAME = "dense"
SPARSE_VECTOR_NAME = "bm25"
DENSE_VECTOR_SIZE = 384

client = QdrantClient(
    url=os.environ["QDRANT_URL"],
    api_key=os.environ["QDRANT_API_KEY"],
    cloud_inference=True,
)


def ensure_collection() -> None:
    """Create the hybrid-search collection if it doesn't exist."""

    if client.collection_exists(QDRANT_COLLECTION):
        info = client.get_collection(QDRANT_COLLECTION)

        dense_vectors = info.config.params.vectors
        sparse_vectors = info.config.params.sparse_vectors or {}

        if not isinstance(dense_vectors, dict):
            raise RuntimeError(
                "Qdrant collection must use named dense vectors. "
                "Expected vector name: 'dense'."
            )

        if DENSE_VECTOR_NAME not in dense_vectors:
            raise RuntimeError(
                f"Collection '{QDRANT_COLLECTION}' is missing "
                f"the '{DENSE_VECTOR_NAME}' dense vector."
            )

        if SPARSE_VECTOR_NAME not in sparse_vectors:
            raise RuntimeError(
                f"Collection '{QDRANT_COLLECTION}' is missing "
                f"the '{SPARSE_VECTOR_NAME}' sparse vector. "
                "Check the collection configuration before ingestion."
            )

        print(f"Using existing collection: {QDRANT_COLLECTION}")

    else:
        client.create_collection(
            collection_name=QDRANT_COLLECTION,
            vectors_config={
                DENSE_VECTOR_NAME: models.VectorParams(
                    size=DENSE_VECTOR_SIZE,
                    distance=models.Distance.COSINE,
                )
            },
            sparse_vectors_config={
                SPARSE_VECTOR_NAME: models.SparseVectorParams(
                    modifier=models.Modifier.IDF,
                    index=models.SparseIndexParams(
                        on_disk=False,
                    ),
                )
            },
        )

        print(f"Created collection: {QDRANT_COLLECTION}")

    # These indexes support notebook and document filtering.
    for field_name in ("notebook_id", "document_id"):
        client.create_payload_index(
            collection_name=QDRANT_COLLECTION,
            field_name=field_name,
            field_schema=models.PayloadSchemaType.KEYWORD,
            wait=True,
        )


def upsert_chunks(
    chunks,
    notebook_id: str,
    document_id: str,
) -> None:
    """Store document chunks and their dense/BM25 representations."""

    if not chunks:
        return

    notebook_id = str(notebook_id)
    document_id = str(document_id)

    # Keep dense embeddings consistent with the existing FAISS pipeline.
    embedding_model = get_embedding_model()

    texts = [chunk.page_content for chunk in chunks]
    dense_vectors = embedding_model.embed_documents(texts)

    points = []

    for index, (chunk, dense_vector) in enumerate(
        zip(chunks, dense_vectors)
    ):
        point_id = str(
            uuid5(
                NAMESPACE_URL,
                f"{notebook_id}:{document_id}:{index}",
            )
        )

        payload = {
            **chunk.metadata,
            "notebook_id": notebook_id,
            "document_id": document_id,
            "chunk_index": index,
            "text": chunk.page_content,
        }

        points.append(
            models.PointStruct(
                id=point_id,
                vector={
                    DENSE_VECTOR_NAME: dense_vector,
                    SPARSE_VECTOR_NAME: models.Document(
                        text=chunk.page_content,
                        model="qdrant/bm25",
                    ),
                },
                payload=payload,
            )
        )

    # Ensure a failed embedding operation never deletes existing chunks.
    ensure_collection()

    # Replace this document's old points during re-ingestion.
    client.delete(
        collection_name=QDRANT_COLLECTION,
        points_selector=models.FilterSelector(
            filter=models.Filter(
                must=[
                    models.FieldCondition(
                        key="notebook_id",
                        match=models.MatchValue(value=notebook_id),
                    ),
                    models.FieldCondition(
                        key="document_id",
                        match=models.MatchValue(value=document_id),
                    ),
                ]
            )
        ),
        wait=True,
    )

    client.upsert(
        collection_name=QDRANT_COLLECTION,
        points=points,
        wait=True,
    )

    print(
        f"Stored {len(points)} chunks in Qdrant "
        f"for document {document_id}"
    )


if __name__ == "__main__":
    ensure_collection()

    info = client.get_collection(QDRANT_COLLECTION)

    print("Qdrant setup verified.")
    print("Collection:", QDRANT_COLLECTION)
    print("Point count:", info.points_count)
