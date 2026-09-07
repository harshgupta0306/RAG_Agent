import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Navigation Header */}
      <header className="landing-header">
        <div className="landing-nav-container">
          <div className="landing-brand">
            <span className="header-logo" aria-hidden="true">AR</span>
            <div>
              <span className="brand-name">Agentic RAG</span>
              <span className="brand-tag">LangGraph Agent</span>
            </div>
          </div>

          <nav className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#architecture">Architecture</a>
            <Link to="/notebooks" className="btn-primary landing-cta-btn">
              Launch Workspace →
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-container">
          <div className="hero-badge">
            <span className="hero-badge-sparkle">✦</span>
            <span>Production-grade LangGraph Architecture</span>
          </div>

          <h1 className="hero-title">
            Intelligent Knowledge Agent with <span className="hero-gradient-text">Human-in-the-Loop</span> Control
          </h1>

          <p className="hero-description">
            Organize multi-format documents into isolated notebooks, retrieve with hybrid
            dense vector and BM25 search, evaluate generated responses autonomously,
            and inspect execution graphs with interactive checkpoint time-travel.
          </p>

          <div className="hero-actions">
            <Link to="/notebooks" className="btn-primary hero-btn-lg">
              Explore Notebooks →
            </Link>
            <a href="#architecture" className="btn-secondary hero-btn-lg">
              View Agent Architecture
            </a>
          </div>

          {/* Interactive Flow / Architecture Diagram */}
          <div className="hero-preview-wrapper" id="architecture">
            <div className="hero-preview-header">
              <div className="hero-dots">
                <span className="dot red" />
                <span className="dot yellow" />
                <span className="dot green" />
              </div>
              <span className="preview-title">LangGraph Agentic Execution Flow</span>
              <span className="preview-status">Active Pipeline</span>
            </div>

            <div className="architecture-grid">
              <div className="arch-node router-node">
                <span className="arch-tag">01. Router</span>
                <h4>Query Classifier</h4>
                <p>Categorizes intent into general conversational chat or notebook document RAG.</p>
              </div>

              <div className="arch-arrow">→</div>

              <div className="arch-node retrieval-node">
                <span className="arch-tag">02. Hybrid Retrieval</span>
                <h4>Dense + BM25</h4>
                <p>Combines FAISS vector embeddings with BM25 keyword matching via Reciprocal Rank Fusion.</p>
              </div>

              <div className="arch-arrow">→</div>

              <div className="arch-node rerank-node">
                <span className="arch-tag">03. Reranker</span>
                <h4>Cross-Encoder</h4>
                <p>Precision scoring with MiniLM cross-encoder to select the top factual context chunks.</p>
              </div>

              <div className="arch-arrow">→</div>

              <div className="arch-node generation-node">
                <span className="arch-tag">04. Generation</span>
                <h4>LLM Synthesis</h4>
                <p>Generates grounded answers strictly referencing the retrieved knowledge chunks.</p>
              </div>

              <div className="arch-arrow">→</div>

              <div className="arch-node grading-node">
                <span className="arch-tag">05. Self-Grader</span>
                <h4>Evaluator Loop</h4>
                <p>Grades answer faithfulness. If context is missing, rewrites query and retries up to 2x.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Panels Feature Overview */}
      <section className="landing-features" id="features">
        <div className="landing-container">
          <div className="section-header-center">
            <span className="section-sub">Modular 3-Panel Workspace</span>
            <h2 className="section-title">Designed for In-Depth Document Research</h2>
            <p className="section-desc">
              Three synchronized panels give you complete visibility and control over your knowledge base, conversation, and agent decisions.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <span className="feature-icon">🗂</span>
              </div>
              <h3>Left Panel: Sources & Context</h3>
              <p>
                Add, select, and organize PDF, Word, Markdown, and TXT documents.
                View real-time chunk status and toggle active sources for fine-grained retrieval control.
              </p>
              <ul className="feature-list">
                <li>✓ Drag-and-drop multi-file ingestion</li>
                <li>✓ Automatic chunking and FAISS indexing</li>
                <li>✓ Active source filtering & conversation switcher</li>
              </ul>
            </div>

            <div className="feature-card highlighted-card">
              <div className="feature-icon-wrapper">
                <span className="feature-icon">💬</span>
              </div>
              <h3>Middle Panel: Conversational Chat</h3>
              <p>
                Stream responses with full markdown rendering, LaTeX math support,
                interactive citation pills, and on-the-fly search mode selection.
              </p>
              <ul className="feature-list">
                <li>✓ Auto, Hybrid, and Pure Chat routing modes</li>
                <li>✓ Real-time streaming tokens via SSE</li>
                <li>✓ Instant source citation anchors</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <span className="feature-icon">⬡</span>
              </div>
              <h3>Right Panel: Agent Executions & History</h3>
              <p>
                Inspect node-by-node execution graphs, self-grading scores, rewritten queries,
                and time-travel back to any prior checkpoint to resume execution.
              </p>
              <ul className="feature-list">
                <li>✓ Real-time LangGraph execution timeline</li>
                <li>✓ Checkpoint history with time-travel resumption</li>
                <li>✓ Retrieved chunks with relevance scores</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="landing-footer-cta">
        <div className="landing-container">
          <div className="footer-cta-card">
            <h2>Ready to explore your documents?</h2>
            <p>
              Create a notebook or pick an existing workspace to start querying your knowledge base with LangGraph.
            </p>
            <Link to="/notebooks" className="btn-primary hero-btn-lg">
              Launch Workspace Now →
            </Link>
          </div>

          <footer className="landing-bottom-bar">
            <span>Agentic RAG • LangGraph • FastAPI • FAISS • React 19</span>
            <span>Local & Private Workspace</span>
          </footer>
        </div>
      </section>
    </div>
  );
}
