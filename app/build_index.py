from app.config import DATA_DIR

from app.ingestion.loader import (
    load_markdown_documents
)

from app.ingestion.splitter import (
    split_documents
)

from app.ingestion.storage import (
    save_chunks
)

from app.retrieval.vector_store import (
    create_vector_store
)


def main():

    documents = load_markdown_documents(
        DATA_DIR
    )

    chunks = split_documents(
        documents
    )

    # Save chunks for BM25
    save_chunks(chunks)

    # Build vector index
    create_vector_store(chunks)

    print(
        f"Indexed {len(chunks)} chunks."
    )


if __name__ == "__main__":
    main()