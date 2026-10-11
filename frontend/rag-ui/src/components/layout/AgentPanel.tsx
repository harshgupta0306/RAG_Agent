import { useState } from "react";
import type { NodeState, RetrievedDocument, Checkpoint } from "../../types/rag";
import AgentTimeline from "../agent/AgentTimeline";
import RetrievedDocuments from "../agent/RetrievedDocuments";
import CheckpointSection from "../agent/CheckpointSection";
import EmptyState from "../shared/EmptyState";

interface AgentPanelProps {
  nodes: NodeState[];
  running: boolean;
  retrievedDocuments: RetrievedDocument[];
  checkpoints: Checkpoint[];
  selectedCheckpoint?: string;
  timeTravelLoading: boolean;
  onResume: (checkpointId: string) => void;
}

type TabType = "all" | "trace" | "checkpoints" | "sources";

export default function AgentPanel({
  nodes,
  running,
  retrievedDocuments,
  checkpoints,
  selectedCheckpoint,
  timeTravelLoading,
  onResume,
}: AgentPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all");

  const hasContent =
    nodes.length > 0 ||
    running ||
    retrievedDocuments.length > 0 ||
    checkpoints.length > 0;

  return (
    <aside className="agent-panel">
      <div className="agent-panel-header">
        <div className="agent-panel-header-title">
          <span className="agent-panel-icon" aria-hidden="true">⬡</span>
          <h2>Agent Executions & History</h2>
        </div>
        {running && (
          <span className="agent-live-badge">
            <span className="pulse-dot" /> Live Run
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="agent-panel-tabs">
        <button
          type="button"
          className={`agent-tab-btn ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          All
        </button>
        <button
          type="button"
          className={`agent-tab-btn ${activeTab === "trace" ? "active" : ""}`}
          onClick={() => setActiveTab("trace")}
        >
          Trace ({nodes.length})
        </button>
        {/* <button
          type="button"
          className={`agent-tab-btn ${activeTab === "checkpoints" ? "active" : ""}`}
          onClick={() => setActiveTab("checkpoints")}
        >
          Checkpoints ({checkpoints.length})
        </button> */}
        <button
          type="button"
          className={`agent-tab-btn ${activeTab === "sources" ? "active" : ""}`}
          onClick={() => setActiveTab("sources")}
        >
          Retrieved ({retrievedDocuments.length})
        </button>
      </div>

      <div className="agent-panel-scroll">
        {!hasContent ? (
          <EmptyState
            icon="⬡"
            title="No agent execution yet"
            description="Run a query to see the LangGraph execution flow, checkpoint history, and retrieved context here."
          />
        ) : (
          <>
            {(activeTab === "all" || activeTab === "trace") && (nodes.length > 0 || running) && (
              <AgentTimeline nodes={nodes} running={running || timeTravelLoading} onResume={onResume} />
            )}

            {(activeTab === "all" || activeTab === "sources") && retrievedDocuments.length > 0 && (
              <div id="retrieved-sources">
                <RetrievedDocuments documents={retrievedDocuments} />
              </div>
            )}

            {/* {(activeTab === "all" || activeTab === "checkpoints") && checkpoints.length > 0 && (
              <CheckpointSection
                checkpoints={checkpoints}
                selectedCheckpoint={selectedCheckpoint}
                onResume={onResume}
                loading={timeTravelLoading}
              />
            )} */}
          </>
        )}
      </div>
    </aside>
  );
}
