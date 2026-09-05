# from dotenv import load_dotenv
# from langchain_mistralai import ChatMistralAI

# load_dotenv()
# llm = ChatMistralAI(
#     model="mistral-small-latest",
#     temperature=0,
# )

from app.llm.llm import llm

def rewrite_query(state):

    query = state["query"]

    feedback = state["feedback"]

    prompt = f"""
You are a query rewriting system
for an advanced RAG application.

The original query was:

{query}

The answer grader gave this feedback:

{feedback}

Rewrite the query so that retrieval
has a better chance of finding the
missing information.

Rules:

1. Preserve the user's original intent.
2. Make the query more specific.
3. Include important terminology from
   the grader feedback.
4. Do not answer the question.
5. Return only the rewritten query.
"""

    response = llm.invoke(prompt)

    return {
        "rewritten_query": response.content.strip()
    }