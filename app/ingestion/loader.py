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


from pathlib import Path

from langchain_core.documents import Document

from app.ingestion.loaders import (
    load_pdf,
    load_docx,
    load_markdown,
    load_text,
)


def load_document(
    file_path: str,
) -> list[Document]:

    extension = Path(
        file_path
    ).suffix.lower()

    if extension == ".pdf":
        return load_pdf(file_path)

    if extension == ".docx":
        return load_docx(file_path)

    if extension == ".md":
        return load_markdown(file_path)

    if extension == ".txt":
        return load_text(file_path)

    raise ValueError(
        f"Unsupported file type: {extension}"
    )