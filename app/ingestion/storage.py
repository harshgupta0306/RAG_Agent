import pickle

from langchain_core.documents import Document


CHUNKS_PATH = "data/chunks.pkl"


def save_chunks(
    chunks: list[Document],
):

    with open(
        CHUNKS_PATH,
        "wb",
    ) as file:

        pickle.dump(
            chunks,
            file,
        )


def load_chunks() -> list[Document]:

    with open(
        CHUNKS_PATH,
        "rb",
    ) as file:

        return pickle.load(file)


def add_chunks(chunks: list[Document] ):
    previous_docs = load_chunks()

    updated_docs = previous_docs + chunks

    save_chunks(updated_docs)