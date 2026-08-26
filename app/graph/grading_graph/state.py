from typing import Literal, TypedDict


class GradingState(TypedDict):

    query: str

    context: str

    answer: str

    grade: Literal[
        "good",
        "bad",
    ]

    feedback: str