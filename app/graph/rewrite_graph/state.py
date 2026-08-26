from typing import TypedDict


class RewriteState(TypedDict):

    query: str

    feedback: str

    rewritten_query: str