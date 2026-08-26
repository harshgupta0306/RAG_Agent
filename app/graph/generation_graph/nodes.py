from dotenv import load_dotenv
from langchain_mistralai import ChatMistralAI

load_dotenv()

llm = ChatMistralAI(
    model="mistral-large-latest",
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

    answer = state["answer"]

    prompt = f"""
You are evaluating the quality of a RAG answer.

Your job is NOT to reward the answer for
simply admitting that information is missing.

Determine whether the answer actually
satisfies the user's question.

Question:

{query}

Retrieved Context:

{context}

Generated Answer:

{answer}

Evaluation rules:

1. The answer must actually answer the question.

2. The answer must be supported by the
   retrieved context.

3. If the context does not contain enough
   information to answer the question,
   the answer is BAD.

4. An answer that merely says "I don't know",
   "the context does not contain enough
   information", or similar is BAD when
   the user's question expects an answer.

5. Do not reward an answer simply because
   it avoids hallucination.

6. If important information is missing,
   mark the answer BAD.

Return:

good
or
bad

Also explain your decision.
"""

    response = llm.invoke(prompt)

    return {
        "answer": response.content
    }