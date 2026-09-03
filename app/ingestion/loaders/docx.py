from pathlib import Path

from langchain_core.documents import Document
from langchain_community.document_loaders import Docx2txtLoader


def load_docx(file_path: str) -> list[Document]:
    path = Path(file_path)

    loader = Docx2txtLoader(
        str(path)
    )

    documents = loader.load()

    for document in documents:
        document.metadata.update({
            "file_name": path.name,
            "file_type": "docx",
        })

    return documents