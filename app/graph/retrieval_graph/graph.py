from langgraph.graph import (
    StateGraph,
    START,
    END,
)

from app.graph.retrieval_graph.state import (
    RetrievalState,
)

from app.graph.retrieval_graph.router import (
    route_node,
)

from app.graph.retrieval_graph.nodes import (
    semantic_search_node,
    keyword_search_node,
    hybrid_search_node,
    rerank_node,
)

def route_search(state):

    return state["route"]


builder = StateGraph(
    RetrievalState
)

builder.add_node(
    "router",
    route_node,
)

builder.add_node(
    "semantic",
    semantic_search_node,
)

builder.add_node(
    "keyword",
    keyword_search_node,
)

builder.add_node(
    "hybrid",
    hybrid_search_node,
)

builder.add_node(
    "rerank",
    rerank_node,
)

builder.add_edge(
    START,
    "semantic",
)

builder.add_edge(
    "semantic",
    "router"
)

builder.add_conditional_edges(
    "router",
    route_search,
    {
        "semantic": "rerank",
        "hybrid": "keyword",
    },
)


builder.add_edge(
    "keyword",
    "hybrid",
)

builder.add_edge(
    "hybrid",
    "rerank",
)
builder.add_edge(
    "rerank",
    END,
)

retrieval_graph = builder.compile()