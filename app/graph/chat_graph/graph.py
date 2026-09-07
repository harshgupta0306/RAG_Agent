from langgraph.graph import (
    StateGraph,
    START,
    END,
)

from app.graph.chat_graph.state import ChatState
from app.graph.chat_graph.nodes import generate_chat_answer


builder = StateGraph(ChatState)

builder.add_node(
    "generate",
    generate_chat_answer,
)

builder.add_edge(
    START,
    "generate",
)

builder.add_edge(
    "generate",
    END,
)

chat_graph = builder.compile()