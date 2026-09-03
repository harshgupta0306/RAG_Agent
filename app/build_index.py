from pathlib import Path

from app.config import DATA_DIR

from app.ingestion.loader import (
    load_document,
)

from app.ingestion.splitter import (
    split_documents,
)

from app.ingestion.storage import (
    save_chunks,
)

from app.retrieval.vector_store import (
    create_vector_store,
)


SUPPORTED_EXTENSIONS = {
    ".pdf",
    ".docx",
    ".md",
    ".txt",
}


def main():

    all_documents = []

    data_path = Path(DATA_DIR)

    # --------------------------------
    # Load all supported documents
    # --------------------------------

    for file_path in data_path.rglob("*"):

        if not file_path.is_file():
            continue

        if file_path.suffix.lower() not in SUPPORTED_EXTENSIONS:
            continue

        print(
            f"Loading: {file_path}"
        )

        documents = load_document(
            str(file_path)
        )

        # --------------------------------
        # Add application metadata
        # --------------------------------

        for document in documents:

            relative_path = (
                file_path.relative_to(
                    data_path
                )
            )

            document.metadata.update({
                "source": str(relative_path),
                "file_name": file_path.name,
                "file_type": (
                    file_path.suffix
                    .lower()
                    .lstrip(".")
                ),
            })

        all_documents.extend(
            documents
        )

    # --------------------------------
    # Split documents
    # --------------------------------

    chunks = split_documents(
        all_documents
    )

    # --------------------------------
    # Save chunks for BM25
    # --------------------------------

    save_chunks(
        chunks
    )

    # --------------------------------
    # Build vector index
    # --------------------------------

    create_vector_store(
        chunks
    )

    print(
        f"Indexed {len(chunks)} chunks."
    )


if __name__ == "__main__":
    main()