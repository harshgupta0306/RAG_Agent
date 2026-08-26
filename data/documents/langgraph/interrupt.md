# LangGraph Interrupts

LangGraph supports human-in-the-loop workflows using interrupts.

An interrupt pauses graph execution and allows an external actor to
provide information before execution continues.

The graph can later be resumed using Command with a resume value.

Interrupts are useful when an agent needs approval before performing
sensitive operations.