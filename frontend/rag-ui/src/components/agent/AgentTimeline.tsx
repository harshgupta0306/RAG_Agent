import type { NodeState } from "../../types/rag";
import AgentNode from "./AgentNode";

interface AgentTimelineProps {
  nodes: NodeState[];
  running: boolean;
}

export default function AgentTimeline({
  nodes,
  running,
}: AgentTimelineProps) {
  return (
    <section className="agent-timeline" aria-labelledby="agent-timeline-title">
      <div className="agent-section-header">
        <h3 id="agent-timeline-title">Agent Execution</h3>
        <span className="agent-count">{nodes.length} steps</span>
      </div>

      <div className="agent-timeline-nodes">
        {nodes.map(node => (
          <AgentNode key={node.id} node={node} />
        ))}

        {running && (
          <div className="agent-node running-node" aria-live="polite">
            <span className="agent-node-icon running" aria-hidden="true">●</span>
            <div className="agent-node-info">
              <span className="agent-node-name">Processing</span>
              <span className="agent-node-desc">Waiting for next event…</span>
            </div>
            <span className="agent-node-meta">live</span>
          </div>
        )}
      </div>
    </section>
  );
}
