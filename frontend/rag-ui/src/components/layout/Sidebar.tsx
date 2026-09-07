import type { Conversation, DocumentMeta } from "../../types/rag";
import NotebookSelector from "../notebooks/NotebookSelector";
import DocumentList from "../documents/DocumentList";
import DocumentUpload from "../documents/DocumentUpload";
import ConversationList from "../conversations/ConversationList";
import EmptyState from "../shared/EmptyState";

interface SidebarProps {
  // Notebook
  selectedNotebookId: string | null;
  onSelectNotebook: (id: string) => void;

  // Documents
  documents: DocumentMeta[];
  onDocumentUploaded: (doc: DocumentMeta) => void;

  // Conversations
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversation: (conv: Conversation) => void;
  onCreateConversation: () => void;
  conversationsLoading?: boolean;
}

export default function Sidebar({
  selectedNotebookId,
  onSelectNotebook,
  documents,
  onDocumentUploaded,
  conversations,
  selectedConversationId,
  onSelectConversation,
  onCreateConversation,
  conversationsLoading = false,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-scroll">
        {/* Notebook selector */}
        <NotebookSelector
          selectedId={selectedNotebookId}
          onSelect={onSelectNotebook}
        />

        {selectedNotebookId ? (
          <>
            {/* Sources section */}
            <div className="sidebar-section">
              <span className="section-label">Sources</span>

              {documents.length === 0 ? (
                <p className="sidebar-empty-text">
                  No sources yet. Upload a document below.
                </p>
              ) : (
                <DocumentList documents={documents} />
              )}

              <DocumentUpload
                notebookId={selectedNotebookId}
                onUploaded={onDocumentUploaded}
              />
            </div>

            {/* Conversations section */}
            <div className="sidebar-section">
              <ConversationList
                conversations={conversations}
                selectedId={selectedConversationId}
                onSelect={onSelectConversation}
                onCreate={onCreateConversation}
                loading={conversationsLoading}
              />
            </div>
          </>
        ) : (
          <div className="sidebar-section">
            <EmptyState
              icon="📓"
              title="Create a notebook"
              description="Start by selecting or creating a notebook."
            />
          </div>
        )}
      </div>
    </aside>
  );
}
