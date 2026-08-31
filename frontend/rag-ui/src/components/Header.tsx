interface HeaderProps {
  running: boolean;
  checkpointCount: number;
}

export default function Header({
  running,
  checkpointCount,
}: HeaderProps) {
  return (
    <header className="app-header">
      <div className="brand-lockup">
        <div className="brand-mark" aria-hidden="true">
          AR
        </div>
        <div>
          <h1>Agentic RAG</h1>
          <p>LangGraph Retrieval Agent</p>
        </div>
      </div>

      <div className="header-status" aria-label="System indicators">
        <span className="status-pill">
          <span
            className={`status-dot ${running ? "status-dot-active" : ""}`}
            aria-hidden="true"
          />
          {running ? "Agent Running" : "System Online"}
        </span>
        <span className="status-pill muted">LangSmith</span>
        <span className="status-pill muted">{checkpointCount} checkpoints</span>
      </div>
    </header>
  );
}
