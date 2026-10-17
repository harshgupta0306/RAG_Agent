from qdrantStore import (
    client,
    QDRANT_COLLECTION,
)

info = client.get_collection(QDRANT_COLLECTION)

print("Qdrant connection successful")
print("Collection:", QDRANT_COLLECTION)
print("Points:", info.points_count)
print("Status:", info.status)
print("Vector configuration:", info.config.params.vectors)
print("Sparse vector configuration:", info.config.params.sparse_vectors)
