import type { SearchMode } from "../types/rag";

interface EmptyStateProps {
  searchMode: SearchMode;
  onExampleSelect: (question: string) => void;
}

const examples = [
  "What is LangGraph checkpointing?",
  "How does human-in-the-loop work?",
  "How does LangGraph persistence work?",
];

export default function EmptyState({
  searchMode,
  onExampleSelect,
}: EmptyStateProps) {
  return (
    <section className="empty-state" aria-label="Start a RAG query">
      <div className="empty-glyph" aria-hidden="true">
        <span />
      </div>
      <p className="eyebrow">LangGraph Retrieval Agent</p>
      <h2>Ask your knowledge base and watch the graph work.</h2>
      <p>
        Retrieval, routing, grading, rewriting, checkpointing, and time travel
        stay visible while the answer streams.
      </p>

      <div className="example-grid">
        {examples.map(example => (
          <button
            key={example}
            type="button"
            className="example-question"
            onClick={() => onExampleSelect(example)}
          >
            {example}
          </button>
        ))}
      </div>

      <div className="empty-modes" aria-label="Active search mode">
        <span>{searchMode}</span>
        <span>semantic</span>
        <span>hybrid</span>
      </div>
    </section>
  );
}
