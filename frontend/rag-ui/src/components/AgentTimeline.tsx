import type { NodeState } from "../types/rag";

interface Props {
  nodes: NodeState[];
  running: boolean;
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
};

const nodeSymbols: Record<string, string> = {
  router: "RT",
  retrieval: "RE",
  semantic: "SE",
  hybrid: "HY",
  rerank: "RR",
  generation: "GN",
  grading: "GR",
  rewrite: "RW",
  apply_rewrite: "AR",
};

function getDescription(node: NodeState) {
  const data = node.data ?? {};

  switch (node.node) {
    case "retrieval":
      if (typeof data.documents === "number") {
        return `${data.documents} documents retrieved`;
      }

      if (Array.isArray(data.results)) {
        return `${data.results.length} documents retrieved`;
      }

      return "Searching indexed knowledge";

    case "generation":
      return "Generating grounded response";

    case "grading":
      if (data.grade) {
        return `Grade: ${String(data.grade)}`;
      }

      return "Evaluating answer quality";

    case "rewrite":
      if (data.rewritten_query) {
        return "Query rewritten for another pass";
      }

      return "Improving the query";

    case "apply_rewrite":
      return "Applying improved query";

    case "rerank":
      return "Reordering retrieved context";

    default:
      return "Node completed";
  }
}

function getDuration(node: NodeState) {
  if (!node.completedAt) {
    return null;
  }

  const duration = node.completedAt - node.startedAt;
  return `${Math.max(duration, 1)}ms`;
}

function renderValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return `${value.length} items`;
  }

  return JSON.stringify(value, null, 2);
}

export default function AgentTimeline({
  nodes,
  running,
}: Props) {
  return (
    <section className="panel timeline-panel" aria-labelledby="agent-execution-title">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Graph Trace</p>
          <h2 id="agent-execution-title">Agent Execution</h2>
        </div>
        <span className="panel-count">{nodes.length} events</span>
      </div>

      <div className="timeline">
        {nodes.map(node => {
          const duration = getDuration(node);
          const dataEntries = Object.entries(node.data ?? {}).filter(
            ([, value]) => value !== undefined && value !== null,
          );

          return (
            <details
              key={node.id}
              className={`timeline-item ${node.status}`}
            >
              <summary>
                <span className="timeline-icon" aria-hidden="true">
                  {node.status === "completed" ? "OK" : node.status === "error" ? "ER" : nodeSymbols[node.node] ?? "ND"}
                </span>
                <span className="timeline-copy">
                  <strong>{labels[node.node] ?? node.node}</strong>
                  <small>{getDescription(node)}</small>
                </span>
                <span className="timeline-meta">
                  {duration ?? node.status}
                </span>
              </summary>

              <div className="node-details">
                {dataEntries.length === 0 ? (
                  <p>No additional node payload was emitted.</p>
                ) : (
                  dataEntries.map(([key, value]) => (
                    <div key={key} className="detail-row">
                      <span>{key.replaceAll("_", " ")}</span>
                      <code>{renderValue(value)}</code>
                    </div>
                  ))
                )}
              </div>
            </details>
          );
        })}

        {running && (
          <div className="timeline-item running live-node" aria-live="polite">
            <div className="timeline-icon" aria-hidden="true">
              ...
            </div>
            <div className="timeline-copy">
              <strong>Processing</strong>
              <small>Waiting for the next graph event</small>
            </div>
            <span className="timeline-meta">live</span>
          </div>
        )}
      </div>
    </section>
  );
}
