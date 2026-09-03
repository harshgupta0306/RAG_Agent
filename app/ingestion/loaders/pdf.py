from pathlib import Path

from langchain_core.documents import Document
from langchain_community.document_loaders import PyPDFLoader


def load_pdf(file_path: str) -> list[Document]:
    path = Path(file_path)

    loader = PyPDFLoader(
        str(path)
    )

    documents = loader.load()

    for document in documents:
        document.metadata.update({
            "file_name": path.name,
            "file_type": "pdf",
        })

    return documents