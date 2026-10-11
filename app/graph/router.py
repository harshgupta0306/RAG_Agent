from typing import Literal

from app.llm.llm import llm


def route_query(state) -> Literal["chat", "rag"]:

    search_mode = state["search_mode"]

    # Explicit modes
    if search_mode == "chat":
        return {
            "route": "chat"
        }

    if search_mode == "rag":
        return {"route": "rag",
            "search_mode": "auto"}

    # Auto mode
    conversation_history = state.get(
        "conversation_history",
        [],
    )

    query = state["query"]

    history_text = "\n".join(
        f'{message["role"].upper()}: {message["content"]}'
        for message in conversation_history
    )

    prompt = f"""
You are a routing classifier for a conversational
RAG system.

Decide whether the current user question should be
answered using:

CHAT:
Use this when the conversation history already
contains enough information to answer the question,
or when the question is general conversational
knowledge that does not require notebook documents.

RAG:
Use this when the question requires information
from the user's notebook, uploaded documents,
specific facts, details, or information that is
not available in the conversation history.

Conversation History:

{history_text}

Current Question:

{query}

Return exactly one word:

CHAT

or

RAG
"""

    response = llm.invoke(prompt)

    decision = response.content.strip().upper()

    if decision == "CHAT":
        return {"route": "chat"}

    return {"route": "rag",
            "search_mode": "auto"}