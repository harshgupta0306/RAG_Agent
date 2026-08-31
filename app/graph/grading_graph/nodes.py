from typing import Literal

from dotenv import load_dotenv
from pydantic import BaseModel, Field

from langchain_mistralai import ChatMistralAI

load_dotenv()

# ============================================================
# LLM
# ============================================================

llm = ChatMistralAI(
    model="mistral-small-latest",
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
You are evaluating the quality of a RAG answer.

Determine whether the answer correctly answers
the user's question using the retrieved context.

Question:

{query}

Retrieved Context:

{context}

Generated Answer:

{answer}

Evaluation rules:

1. The answer must directly address the user's question.

2. The answer must be supported by the retrieved context.

3. Do not require information that is not present
   in the retrieved context.

4. Do not mark an answer BAD merely because it
   does not contain implementation details that
   were not provided in the context.

5. If the context genuinely lacks the information
   required to answer the question, mark it BAD.

6. If the answer correctly answers the question
   using the available context, mark it GOOD.

Return your evaluation in this format:

GRADE: good
FEEDBACK: <short explanation>

or

GRADE: bad
FEEDBACK: <short explanation>
"""

    result = grader_llm.invoke(prompt)

    return {
        "grade": result.grade,
        "feedback": result.feedback,
    }