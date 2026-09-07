# from dotenv import load_dotenv
# from langchain_mistralai import ChatMistralAI


from app.llm.llm import llm
# load_dotenv()

# llm = ChatMistralAI(
#     model="mistral-small-latest",
#     temperature=0,
# )



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
    print(
        "CONVERSATION HISTORY:",
        state.get("conversation_history", []),
        flush=True,
    )

    query = state["query"]
    context = state["context"]
    conversation_history = state.get(
        "conversation_history",
        [],
    )

    history_text = "\n".join(
        f'{message["role"].upper()}: {message["content"]}'
        for message in conversation_history
    )

    prompt = f"""
You are a RAG assistant.

Answer the user's current question using the
retrieved context provided below.

You may use the conversation history to understand
references, follow-up questions, and context from
previous turns.

Do NOT use information from the conversation history
as factual evidence unless that information is also
supported by the retrieved context.

If the retrieved context does not contain enough
information to answer the current question, clearly
say that the available context is insufficient.

Do not invent or assume information that is not
present in the retrieved context.

Conversation History:
{history_text}

Current Question:
{query}

Retrieved Context:
{context}

Provide a clear and direct answer to the current question.
"""

    response = llm.invoke(prompt)

    return {
        "answer": response.content
    }