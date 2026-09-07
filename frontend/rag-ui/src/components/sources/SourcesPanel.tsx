import React, { useState } from "react";
import type { Conversation, DocumentMeta } from "../../types/rag";
import DocumentUpload from "../documents/DocumentUpload";
import ConversationList from "../conversations/ConversationList";

interface SourcesPanelProps {
  notebookId: string;
  documents: DocumentMeta[];
  selectedDocumentIds: Set<string>;
  onToggleSelectDocument: (id: string) => void;
  onSelectAllDocuments: () => void;
  onDeselectAllDocuments: () => void;
  onDocumentUploaded: (doc: DocumentMeta) => void;
  onDeleteDocument: (docId: string) => Promise<void>;
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (conv: Conversation) => void;
  onCreateConversation: () => void;
  conversationsLoading?: boolean;
}

const typeIcons: Record<string, string> = {
  pdf: "PDF",
  docx: "DOC",
  md: "MD",
  txt: "TXT",
};

const statusLabels: Record<string, string> = {
  indexed: "Ready",
  uploaded: "Processing",
  failed: "Failed",
};

export default function SourcesPanel({
  notebookId,
  documents,
  selectedDocumentIds,
  onToggleSelectDocument,
  onSelectAllDocuments,
  onDeselectAllDocuments,
  onDocumentUploaded,
  onDeleteDocument,
  conversations,
  selectedConversationId,
  onSelectConversation,
  onCreateConversation,
  conversationsLoading = false,
}: SourcesPanelProps) {
  const [filterQuery, setFilterQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredDocs = documents.filter(doc =>
    doc.file_name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const allSelected =
    documents.length > 0 &&
    documents.every(d => selectedDocumentIds.has(d.document_id));

  const handleDelete = async (e: React.MouseEvent, docId: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to remove this source?")) return;
    try {
      setDeletingId(docId);
      await onDeleteDocument(docId);
    } catch (err) {
      console.error("Failed to delete document:", err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <aside className="sidebar sources-panel">
      <div className="sidebar-scroll">
        {/* Panel Header */}
        <div className="sources-header">
          <div className="sources-title-wrap">
            <span className="sources-icon" aria-hidden="true">🗂</span>
            <div className="sources-title-meta">
              <h2 className="sources-title">Knowledge Sources</h2>
              <span className="sources-badge">
                {documents.length} {documents.length === 1 ? "source" : "sources"}
              </span>
            </div>
          </div>
        </div>

        {/* Add Source Section */}
        <div className="sidebar-section sources-add-section">
          <span className="section-label">Add Source</span>
          <DocumentUpload
            notebookId={notebookId}
            onUploaded={onDocumentUploaded}
          />
        </div>

        {/* Display & Select Sources Section */}
        <div className="sidebar-section sources-list-section">
          <div className="sources-toolbar">
            <span className="section-label">Sources ({documents.length})</span>
            {documents.length > 0 && (
              <button
                type="button"
                className="sources-select-all-btn"
                onClick={allSelected ? onDeselectAllDocuments : onSelectAllDocuments}
              >
                {allSelected ? "Deselect All" : "Select All"}
              </button>
            )}
          </div>

          {documents.length > 3 && (
            <div className="sources-search-box">
              <input
                type="text"
                className="sources-search-input"
                placeholder="Search sources…"
                value={filterQuery}
                onChange={e => setFilterQuery(e.target.value)}
              />
            </div>
          )}

          {documents.length === 0 ? (
            <div className="sources-empty">
              <span className="sources-empty-icon">📄</span>
              <p className="sidebar-empty-text">
                No sources added yet. Drop a PDF, DOCX, MD, or TXT file above to build your knowledge base.
              </p>
            </div>
          ) : (
            <div className="document-list">
              {filteredDocs.map((doc, i) => {
                const docId = doc.document_id ?? `${doc.file_name}-${i}`;
                const ext = (doc.file_type || "txt").toLowerCase();
                const isSelected = selectedDocumentIds.has(docId);
                const statusClass =
                  doc.status === "failed"
                    ? "status-error"
                    : doc.status === "indexed"
                    ? "status-ready"
                    : "status-processing";

                return (
                  <div
                    key={docId}
                    className={`document-row ${isSelected ? "selected" : ""}`}
                    onClick={() => onToggleSelectDocument(docId)}
                    title={`Click to ${isSelected ? "deselect" : "select"} this source for retrieval`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelectDocument(docId)}
                      onClick={e => e.stopPropagation()}
                      className="source-checkbox"
                      aria-label={`Select ${doc.file_name}`}
                    />
                    <span className={`doc-type-badge ${ext}`} aria-hidden="true">
                      {typeIcons[ext] ?? ext.toUpperCase()}
                    </span>
                    <div className="doc-info">
                      <span className="doc-name" title={doc.file_name}>
                        {doc.file_name}
                      </span>
                      <span className="doc-meta">
                        {doc.chunks > 0 && <span>{doc.chunks} chunks</span>}
                        <span className={`doc-status ${statusClass}`}>
                          {statusLabels[doc.status] ?? doc.status}
                        </span>
                      </span>
                    </div>

                    <button
                      type="button"
                      className="doc-delete-btn"
                      onClick={e => handleDelete(e, docId)}
                      disabled={deletingId === docId}
                      aria-label={`Delete ${doc.file_name}`}
                      title="Remove source"
                    >
                      {deletingId === docId ? "…" : "×"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Conversations Subsection */}
        <div className="sidebar-section sources-conversations-section">
          <ConversationList
            conversations={conversations}
            selectedId={selectedConversationId}
            onSelect={onSelectConversation}
            onCreate={onCreateConversation}
            loading={conversationsLoading}
          />
        </div>
      </div>
    </aside>
  );
}
