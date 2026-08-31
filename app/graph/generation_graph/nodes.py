from dotenv import load_dotenv
from langchain_mistralai import ChatMistralAI

load_dotenv()

llm = ChatMistralAI(
    model="mistral-small-latest",
    temperature=0,
)



def prepare_context(state):

    documents = state["documents"]

    context_parts = []

    for i, document in enumerate(
        documents,
        start=1,
    ):

        context_parts.append(
            f"""
SOURCE {i}

{document.page_content}
"""
        )

    context = "\n".join(
        context_parts
    )

    return {
        "context": context
    }





def generate_answer(state):

    query = state["query"]
    context = state["context"]

    prompt = f"""
    You are a RAG assistant.

    Answer the user's question using ONLY the
    retrieved context provided below.

    If the context does not contain enough
    information to answer the question, clearly
    say that the available context is insufficient.

    Do not invent or assume information that is
    not present in the context.

    Question:
    {query}

    Retrieved Context:
    {context}

    Provide a clear and direct answer to the question.
    """

    response = llm.invoke(prompt)

    return {
        "answer": response.content
    }