from typing import Literal

from dotenv import load_dotenv
from pydantic import BaseModel, Field

from langchain_mistralai import ChatMistralAI
from app.llm.llm import llm

class SearchRoute(BaseModel):

    route: Literal[
        "semantic",
        "hybrid",
    ] = Field(
        description=(
            "The best retrieval strategy "
            "for the user's query."
        )
    )



router_llm = llm.with_structured_output(
    SearchRoute
)

def route_node(state):

    query = state["query"]

    search_mode = state["search_mode"]

    # --------------------------------
    # User explicitly selected a mode
    # --------------------------------

    if search_mode != "auto":

        return {
            "route": search_mode
        }

    # --------------------------------
    # Let LLM decide
    # --------------------------------

    prompt = f"""
You are a retrieval routing system.

Choose the best retrieval strategy
for the user's query.

Available strategies:

semantic:
Use when the query asks about concepts,
meaning, explanations, or related ideas.

keyword:
Use when exact terms, names, identifiers,
codes, or phrases are important.

hybrid:
Use when both semantic understanding
and exact keyword matching are useful.

User query:

{query}
"""

    result = router_llm.invoke(prompt)

    return {
        "route": result.route
    }