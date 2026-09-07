import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  getNotebooks,
  createNotebook,
  deleteNotebook,
  type Notebook,
} from "../api/notebooks";

export default function NotebooksPage() {
  const navigate = useNavigate();
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState("");
  const [newNotebookName, setNewNotebookName] = useState("");
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchNotebooks = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const data = await getNotebooks();
      setNotebooks(data);
    } catch (err) {
      console.error("Failed to load notebooks", err);
      setErrorMessage("Could not load notebooks. Please ensure the backend is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotebooks();
  }, [fetchNotebooks]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newNotebookName.trim();
    if (!trimmed || creating) return;

    try {
      setCreating(true);
      const created = await createNotebook(trimmed);
      setNotebooks(prev => [created, ...prev]);
      setNewNotebookName("");
      setShowCreateModal(false);
      // Directly navigate to the newly created notebook's workspace
      navigate(`/notebooks/${created.id}`);
    } catch (err) {
      console.error("Failed to create notebook", err);
      setErrorMessage("Failed to create notebook. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${name}" and all its documents?`)) {
      return;
    }

    try {
      setDeletingId(id);
      await deleteNotebook(id);
      setNotebooks(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error("Failed to delete notebook", err);
      setErrorMessage("Failed to delete notebook.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredNotebooks = notebooks.filter(nb =>
    nb.name.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const formatDate = (isoString?: string) => {
    if (!isoString) return "";
    try {
      return new Date(isoString).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="notebooks-page">
      {/* Top Navigation Bar - styled matching chat header */}
      <header className="notebooks-header">
        <div className="notebooks-nav-container">
          <div className="header-brand">
            <Link to="/" className="landing-brand-link" title="Agentic RAG Home">
              <span className="header-logo" aria-hidden="true">AR</span>
              <span className="header-brand-title">Agentic RAG</span>
            </Link>
            <span className="header-divider">/</span>
            <span className="header-section-badge">Workspaces</span>
            {!loading && (
              <span className="notebooks-count-badge">
                {notebooks.length} {notebooks.length === 1 ? "notebook" : "notebooks"}
              </span>
            )}
          </div>

          <div className="notebooks-header-actions">
            <span className="header-status active" title="Agent online and ready">
              <span className="header-status-dot" aria-hidden="true" />
              Agent Online
            </span>
            <Link to="/" className="nav-btn-secondary" title="Return to Landing Page">
              <span>←</span> Home
            </Link>
            <button
              type="button"
              className="nav-btn-primary"
              onClick={() => setShowCreateModal(true)}
              title="Create new notebook workspace"
            >
              <span>+</span> New Notebook
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="notebooks-main">
        <div className="notebooks-container">
          {/* Header Title & Filter Bar */}
          <div className="notebooks-title-bar">
            <div>
              <h1 className="notebooks-page-title">Notebook Workspaces</h1>
              <p className="notebooks-page-subtitle">
                Select a notebook to query documents with hybrid retrieval, inspect execution traces, and resume checkpoints.
              </p>
            </div>

            <div className="notebooks-filter-group">
              <div className="notebooks-search-wrapper">
                <span className="notebooks-search-icon" aria-hidden="true">🔍</span>
                <input
                  type="text"
                  placeholder="Search notebooks…"
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  className="notebooks-search-input"
                />
                {searchFilter && (
                  <button
                    type="button"
                    className="notebooks-search-clear"
                    onClick={() => setSearchFilter("")}
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="notebooks-error-banner">
              <span>⚠️ {errorMessage}</span>
              <button
                type="button"
                className="btn-secondary btn-sm"
                onClick={fetchNotebooks}
              >
                Retry
              </button>
            </div>
          )}

          {/* Quick inline creation card */}
          <form className="quick-create-card" onSubmit={handleCreate}>
            <span className="quick-create-icon" aria-hidden="true">📓</span>
            <input
              type="text"
              placeholder="Create a new notebook (e.g. Legal Docs, Financial Reports, ML Papers)…"
              value={newNotebookName}
              onChange={e => setNewNotebookName(e.target.value)}
              className="quick-create-input"
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={!newNotebookName.trim() || creating}
            >
              {creating ? (
                <>
                  <span className="send-loading" aria-hidden="true" />
                  Creating…
                </>
              ) : (
                <>
                  <span>+</span> Create & Open →
                </>
              )}
            </button>
          </form>

          {/* Notebooks Grid */}
          {loading ? (
            <div className="notebooks-grid-loading">
              {[1, 2, 3].map(n => (
                <div key={n} className="notebook-card-skeleton" />
              ))}
            </div>
          ) : filteredNotebooks.length === 0 ? (
            <div className="notebooks-empty-state">
              <span className="empty-icon">📂</span>
              <h3>No notebooks found</h3>
              <p>
                {searchFilter
                  ? `No notebook matching "${searchFilter}"`
                  : "You haven't created any notebooks yet. Create your first notebook above to get started."}
              </p>
              {searchFilter && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setSearchFilter("")}
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="notebooks-grid">
              {filteredNotebooks.map(nb => {
                const docCount = nb.documents_count ?? 0;
                const convCount = nb.conversations_count ?? 0;
                const isDeleting = deletingId === nb.id;

                return (
                  <div
                    key={nb.id}
                    className="notebook-card"
                    onClick={() => navigate(`/notebooks/${nb.id}`)}
                  >
                    <div className="notebook-card-top">
                      <span className="notebook-card-icon">📓</span>
                      <button
                        type="button"
                        className="notebook-delete-btn"
                        onClick={e => handleDelete(e, nb.id, nb.name)}
                        disabled={isDeleting}
                        title="Delete notebook"
                        aria-label={`Delete ${nb.name}`}
                      >
                        {isDeleting ? "…" : "×"}
                      </button>
                    </div>

                    <h3 className="notebook-card-title">{nb.name}</h3>

                    <div className="notebook-card-meta">
                      <span className="notebook-meta-pill">
                        📄 {docCount} {docCount === 1 ? "source" : "sources"}
                      </span>
                      <span className="notebook-meta-pill">
                        💬 {convCount} {convCount === 1 ? "chat" : "chats"}
                      </span>
                    </div>

                    <div className="notebook-card-footer">
                      <span className="notebook-date">
                        {nb.created_at ? formatDate(nb.created_at) : "Created recently"}
                      </span>
                      <button
                        type="button"
                        className="notebook-open-btn"
                        onClick={e => {
                          e.stopPropagation();
                          navigate(`/notebooks/${nb.id}`);
                        }}
                      >
                        Open Workspace →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Create Notebook Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Notebook</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowCreateModal(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <label htmlFor="modal-nb-input" className="modal-label">
                  Notebook Name
                </label>
                <input
                  id="modal-nb-input"
                  type="text"
                  className="modal-input"
                  placeholder="e.g. Q3 Earnings Reports, Product Specs"
                  value={newNotebookName}
                  onChange={e => setNewNotebookName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!newNotebookName.trim() || creating}
                >
                  {creating ? "Creating…" : "Create Notebook"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
