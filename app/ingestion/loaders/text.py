from pathlib import Path

from langchain_core.documents import Document


def load_text(file_path: str) -> list[Document]:
    path = Path(file_path)

    content = path.read_text(
        encoding="utf-8"
    )

    document = Document(
        page_content=content,
        metadata={
            "file_name": path.name,
            "file_type": "txt",
        },
    )

    return [document]