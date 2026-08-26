from typing import TypedDict

from langchain_core.documents import Document

from langgraph.graph import (
    StateGraph,
    START,
    END,
)

from app.graph.retrieval_graph.graph import (
    retrieval_graph,
)

from app.graph.generation_graph.graph import (
    generation_graph,
)

from app.graph.grading_graph.graph import (
    grading_graph,
)

from app.graph.rewrite_graph.graph import (
    rewrite_graph,
)

from app.graph.state import RAGState


MAX_RETRIES = 2


def grade_route(state):

    print("QUERY:", state["query"])
    print("GRADE:", state.get("grade"))
    print("FEEDBACK:", state.get("feedback"))
    print("RETRY:", state["retry_count"])
    if state["grade"] == "good":
        return "finish"

    if state["retry_count"] >= MAX_RETRIES:
        return "finish"

    return "retry"

def apply_rewrite(state):

    return {
        "query": state["rewritten_query"],
        "retry_count": state["retry_count"] + 1,
    }
# ============================================================
# BUILD MAIN GRAPH
# ============================================================

builder = StateGraph(
    RAGState
)


# ============================================================
# SUBGRAPHS
# ============================================================

builder.add_node(
    "retrieval",
    retrieval_graph,
)

builder.add_node(
    "generation",
    generation_graph,
)
builder.add_node(
    "grading",
    grading_graph,
)
builder.add_node(
    "rewrite",
    rewrite_graph,
)

builder.add_node(
    "apply_rewrite",
    apply_rewrite,
)

# ============================================================
# FLOW
# ============================================================

builder.add_edge(
    START,
    "retrieval",
)

builder.add_edge(
    "retrieval",
    "generation",
)

builder.add_edge(
    "generation",
    "grading",
)

builder.add_conditional_edges(
    "grading",
    grade_route,
    {
        "finish" : END,
        "retry": "rewrite",
    },
)

builder.add_edge(
    "rewrite",
    "apply_rewrite",
)

builder.add_edge(
    "apply_rewrite",
    "retrieval",
)
# ============================================================
# COMPILE
# ============================================================

main_graph = builder.compile()