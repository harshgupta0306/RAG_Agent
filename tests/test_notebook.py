from app.ingestion.storage import save_chunks, load_chunks
from langchain_core.documents import Document

notebook_id = "abc123"

chunks = [
    Document(
        page_content="This is a test document.",
        metadata={
            "source": "test.txt",
            "notebook_id": notebook_id,
        },
    )
]

save_chunks(chunks, notebook_id)

loaded = load_chunks(notebook_id)

print(loaded)