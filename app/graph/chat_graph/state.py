from typing import TypedDict


class ChatState(TypedDict):

    query: str

    conversation_history: list[dict[str, str]]

    answer: str