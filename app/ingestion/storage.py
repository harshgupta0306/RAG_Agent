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