# from app.ingestion.loader import (
#     load_markdown_documents
# )
# from app.ingestion.splitter import split_documents


# def test_load_markdown_documents():

#     documents = load_markdown_documents(
#         "data/documents"
#     )

#     assert len(documents) > 0


# def test_document_metadata():

#     documents = load_markdown_documents(
#         "data/documents"
#     )

#     document = documents[0]

#     assert "source" in document.metadata

#     assert "file_name" in document.metadata

#     assert "category" in document.metadata

#     assert document.page_content

# def test_document_splitting():

#     documents = load_markdown_documents(
#         "data/documents"
#     )

#     chunks = split_documents(
#         documents
#     )

#     assert len(chunks) >= len(documents)

#     for chunk in chunks:

#         assert "chunk_id" in chunk.metadata

#         assert chunk.page_content.strip()