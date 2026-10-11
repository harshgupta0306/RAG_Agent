import type { NodeState } from "../../types/rag";

interface AgentNodeProps {
  node: NodeState;
  onResume: (checkpointId: string) => void;
  timeTravelLoading: boolean;
}

const labels: Record<string, string> = {
  router: "Router",
  retrieval: "Retrieval",
  semantic: "Semantic Search",
  hybrid: "Hybrid Search",
  rerank: "Reranking",
  generation: "Generation",
  grading: "Answer Grading",
  rewrite: "Query Rewrite",
  apply_rewrite: "Apply Rewrite",
  chat: "Chat",
};

function getStatusIcon(status: string) {
  switch (status) {
    case "completed": return "✓";
    case "failed": return "✕";
    case "running": return "●";
    case "skipped": return "–";
    case "pending": return "○";
    default: return "○";
  }
}

function getDescription(node: NodeState) {
  const data = node.data ?? {};

  switch (node.node) {
    case "router":
      if (data.route) return `Route: ${String(data.route)}`;
      return "Determining route";

    case "retrieval":
      if (typeof data.documents === "number") return `${data.documents} documents retrieved`;
      if (Array.isArray(data.results)) return `${data.results.length} documents retrieved`;
      return "Searching knowledge base";

    case "rerank":
      if (typeof data.documents === "number") return `${data.documents} documents reranked`;
      if (Array.isArray(data.results)) return `${data.results.length} documents reranked`;
      return "Reordering context";

    case "generation":
      return "Generating response";

    case "grading":
      if (data.grade) return `Grade: ${String(data.grade)}`;
      return "Evaluating answer";

    case "rewrite":
      if (data.rewritten_query) return "Query rewritten";
      return "Improving query";

    case "apply_rewrite":
      return "Applying rewritten query";

    case "chat":
      return "Direct chat response";

    default:
      return "Completed";
  }
}

function renderValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `${value.length} items`;
  return JSON.stringify(value, null, 2);
}

function getDuration(node: NodeState) {
  if (!node.completedAt) return null;
  const ms = node.completedAt - node.startedAt;
  return `${Math.max(ms, 1)}ms`;
}

export default function AgentNode({
  node,
  onResume,
  timeTravelLoading,
}: AgentNodeProps) {
  const duration = getDuration(node);
  const dataEntries = Object.entries(node.data ?? {}).filter(
    ([, v]) => v !== undefined && v !== null
  );

  return (
    <details className={`agent-node ${node.status}`}>
      <summary className="agent-node-summary">
        <span className={`agent-node-icon ${node.status}`} aria-hidden="true">
          {getStatusIcon(node.status)}
        </span>
        <div className="agent-node-info">
          <span className="agent-node-name">{labels[node.node] ?? node.node}</span>
          <span className="agent-node-desc">{getDescription(node)}</span>
        </div>
        <span className="agent-node-meta">
          {duration ?? node.status}
        </span>
      </summary>

      <div className="agent-node-details">
        {dataEntries.length === 0 ? (
          <p className="agent-node-empty">No additional data emitted.</p>
        ) : (
          dataEntries.map(([key, value]) => (
            <div key={key} className="agent-detail-row">
              <span className="agent-detail-key">{key.replaceAll("_", " ")}</span>
              <code className="agent-detail-val">{renderValue(value)}</code>
            </div>
          ))
        )}
        {node.checkpoint_id && (
          <button
            type="button"
            className="btn-sm checkpoint-resume"
            onClick={() => onResume(node.checkpoint_id!)}
            disabled={timeTravelLoading}
          >
            {timeTravelLoading ? "Resuming…" : "Resume from this step"}
          </button>
        )}
      </div>
    </details>
  );
}