from typing import Literal

from dotenv import load_dotenv
from pydantic import BaseModel, Field

from langchain_mistralai import ChatMistralAI

load_dotenv()

# ============================================================
# LLM
# ============================================================

llm = ChatMistralAI(
    model="mistral-large-latest",
    temperature=0,
)


# ============================================================
# STRUCTURED OUTPUT
# ============================================================

class AnswerGrade(BaseModel):

    grade: Literal[
        "good",
        "bad",
    ] = Field(
        description=(
            "Whether the answer is sufficiently "
            "supported by the provided context "
            "and answers the question."
        )
    )

    feedback: str = Field(
        description=(
            "Explain why the answer is good or "
            "what information is missing."
        )
    )


grader_llm = llm.with_structured_output(
    AnswerGrade
)


# ============================================================
# GRADER NODE
# ============================================================

def grade_answer(state):

    query = state["query"]

    context = state["context"]

    answer = state["answer"]

    prompt = f"""
You are evaluating a RAG system.

Determine whether the generated answer
is adequately supported by the retrieved
context and actually answers the question.

Question:

{query}

Retrieved Context:

{context}

Generated Answer:

{answer}

Rules:

1. The answer must address the question.
2. Important claims must be supported by
   the retrieved context.
3. The answer must not invent information.
4. If important information is missing,
   mark the answer as bad.

Return a grade of either:

good
bad

Also provide concise feedback.
"""

    result = grader_llm.invoke(prompt)

    return {
        "grade": result.grade,
        "feedback": result.feedback,
    }