from app.config import DATA_DIR

from app.ingestion.loader import (
    load_markdown_documents
)

from app.ingestion.splitter import (
    split_documents
)

from app.retrieval.vector_store import (
    create_vector_store
)


def build_index():

    # -----------------------------
    # 1. Load documents
    # -----------------------------

    documents = load_markdown_documents(
        DATA_DIR
    )

    print(
        f"Loaded documents: {len(documents)}"
    )

    # -----------------------------
    # 2. Split documents
    # -----------------------------

    chunks = split_documents(
        documents
    )

    print(
        f"Created chunks: {len(chunks)}"
    )

    # -----------------------------
    # 3. Create vector store
    # -----------------------------

    vector_store = create_vector_store(
        chunks
    )

    print("Vector store created.")

    return vector_store