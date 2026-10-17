
import os

from dotenv import load_dotenv
from qdrant_client import QdrantClient, models

load_dotenv()

QDRANT_COLLECTION = os.getenv(
    "QDRANT_COLLECTION")

client = QdrantClient(
    url=os.environ["QDRANT_URL"],
    api_key=os.environ["QDRANT_API_KEY"],
)


def create_collection() -> None:
    """Create the collection if it does not already exist."""
    if client.collection_exists(QDRANT_COLLECTION):
        print(f"Collection already exists: {QDRANT_COLLECTION}")
        return

    client.create_collection(
        collection_name=QDRANT_COLLECTION,
        vectors_config={
            "dense": models.VectorParams(
                size=384,
                distance=models.Distance.COSINE,
            )
        },
        sparse_vectors_config={
            "sparse": models.SparseVectorParams(
                index=models.SparseIndexParams(
                    on_disk=False,
                )
            )
        },
    )

    # Index payload fields used for retrieval filters.
    for field in ("notebook_id", "document_id"):
        client.create_payload_index(
            collection_name=QDRANT_COLLECTION,
            field_name=field,
            field_schema=models.PayloadSchemaType.KEYWORD,
        )

    print(f"Created collection: {QDRANT_COLLECTION}")




from uuid import NAMESPACE_URL, uuid5

from qdrant_client import models

from app.retrieval.embeddings import get_embedding_model


def upsert_chunks(
    chunks,
    notebook_id: str,
    document_id: str | None = None,
) -> None:
    """Store document chunks in Qdrant with dense and BM25 vectors."""
    if not chunks:
        return

    embedding_model = get_embedding_model()

    texts = [chunk.page_content for chunk in chunks]
    dense_vectors = embedding_model.embed_documents(texts)

    points = [] 

    for index, (chunk, dense_vector) in enumerate(
        zip(chunks, dense_vectors)
    ):
        metadata = dict(chunk.metadata)

        resolved_document_id = (
            str(document_id)
            if document_id is not None
            else metadata.get("document_id")
        )

        if resolved_document_id is None:
            raise ValueError(
                "document_id is required for Qdrant ingestion"
            )

        point_id = str(
            uuid5(
                NAMESPACE_URL,
                f"{notebook_id}:{resolved_document_id}:{index}",
            )
        )

        payload = {
            **metadata,
            "notebook_id": str(notebook_id),
            "document_id": resolved_document_id,
            "chunk_index": index,
            "text": chunk.page_content,
        }

        points.append(
            models.PointStruct(
                id=point_id,
                vector={
                    "dense": dense_vector,
                    "bm25": models.Document(
                        text=chunk.page_content,
                        model="Qdrant/bm25",
                    ),
                },
                payload=payload,
            )
        )

    client.upsert(
        collection_name=QDRANT_COLLECTION,
        points=points,
        wait=True,
    )

    print(
        f"Upserted {len(points)} chunks into Qdrant "
        f"for notebook {notebook_id}"
    )
