from langchain_text_splitters import (
    RecursiveCharacterTextSplitter
)

from langchain_core.documents import Document


def split_documents(
    documents: list[Document],
) -> list[Document]:

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        separators=[
            "\n## ",
            "\n### ",
            "\n\n",
            "\n",
            " ",
            "",
        ],
    )

    chunks = splitter.split_documents(
        documents
    )

    chunk_counters = {}

    for chunk in chunks:

        source = chunk.metadata["source"]

        chunk_index = chunk_counters.get(
            source,
            0
        )

        chunk.metadata["chunk_id"] = (
            f"{source}::chunk_{chunk_index}"
        )

        chunk_counters[source] = (
            chunk_index + 1
        )
    return chunks