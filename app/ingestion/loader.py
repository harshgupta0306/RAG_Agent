from pathlib import Path

from langchain_core.documents import Document


def load_markdown_documents(
    directory: str
) -> list[Document]:

    documents = []

    directory_path = Path(directory)

    for file_path in directory_path.rglob("*.md"):

        content = file_path.read_text(
            encoding="utf-8"
        )

        relative_path = file_path.relative_to(
            directory_path
        )

        category = relative_path.parts[0]

        document = Document(
            page_content=content,

            metadata={
                "source": str(relative_path),
                "file_name": file_path.name,
                "file_type": "markdown",
                "category": category,
            }
        )

        documents.append(document)

    return documents