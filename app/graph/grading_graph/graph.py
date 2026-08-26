from langgraph.graph import (
    StateGraph,
    START,
    END,
)

from app.graph.grading_graph.state import (
    GradingState,
)

from app.graph.grading_graph.nodes import (
    grade_answer,
)


builder = StateGraph(
    GradingState
)


builder.add_node(
    "grade",
    grade_answer,
)


builder.add_edge(
    START,
    "grade",
)


builder.add_edge(
    "grade",
    END,
)


grading_graph = builder.compile()