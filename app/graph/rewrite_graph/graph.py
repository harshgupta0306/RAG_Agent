from langgraph.graph import (
    StateGraph,
    START,
    END,
)

from app.graph.rewrite_graph.state import (
    RewriteState,
)

from app.graph.rewrite_graph.nodes import (
    rewrite_query,
)


builder = StateGraph(
    RewriteState
)


builder.add_node(
    "rewrite",
    rewrite_query,
)


builder.add_edge(
    START,
    "rewrite",
)

builder.add_edge(
    "rewrite",
    END,
)


rewrite_graph = builder.compile()