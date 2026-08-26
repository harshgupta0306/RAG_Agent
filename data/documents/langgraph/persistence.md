# LangGraph Persistence

LangGraph persistence allows graph state to be saved as checkpoints.

A checkpointer can save the state of a graph at different points during
execution.

This enables features such as conversation memory, human-in-the-loop
workflows, fault tolerance, and resuming interrupted executions.

A thread ID identifies a particular execution or conversation.

In development, an in-memory checkpointer can be used. Production
applications generally require persistent storage.