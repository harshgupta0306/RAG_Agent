from app.llm.llm import llm


def generate_chat_answer(state):

    query = state["query"]

    conversation_history = state.get(
        "conversation_history",
        [],
    )

    history_text = "\n".join(
        f'{message["role"].upper()}: {message["content"]}'
        for message in conversation_history
    )

    prompt = f"""
You are a helpful conversational assistant.

Use the conversation history to understand the
user's current question and maintain continuity.

You may answer using the conversation history and
your general knowledge.

Do not pretend that information is present in the
conversation if it is not.

Conversation History:

{history_text}

Current Question:

{query}

Provide a clear and direct answer.
"""

    response = llm.invoke(prompt)

    return {
        "answer": response.content
    }