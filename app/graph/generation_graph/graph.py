from langgraph.graph import (
    StateGraph,
    START,
    END,
)

from app.graph.generation_graph.state import (
    GenerationState,
)

from app.graph.generation_graph.nodes import (
    prepare_context,
    generate_answer,
)


builder = StateGraph(
    GenerationState
)


builder.add_node(
    "prepare_context",
    prepare_context,
)

builder.add_node(
    "generate",
    generate_answer,
)


builder.add_edge(
    START,
    "prepare_context",
)

builder.add_edge(
    "prepare_context",
    "generate",
)

builder.add_edge(
    "generate",
    END,
)


generation_graph = builder.compile()