import type { Conversation } from "../../types/rag";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
  onCreate: () => void;
  loading?: boolean;
}

function truncateTitle(title: string, max = 48) {
  return title.length > max ? title.slice(0, max) + "…" : title;
}

export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onCreate,
  loading = false,
}: ConversationListProps) {
  return (
    <div className="conversation-list">
      <div className="conversation-list-header">
        <span className="section-label">Conversations</span>
        <button
          type="button"
          className="btn-icon"
          onClick={onCreate}
          title="New conversation"
          aria-label="New conversation"
        >
          +
        </button>
      </div>

      {loading && conversations.length === 0 && (
        <div className="conversation-loading">Loading…</div>
      )}

      {!loading && conversations.length === 0 && (
        <p className="sidebar-empty-text">
          Start a conversation to ask questions about your sources.
        </p>
      )}

      <div className="conversation-items">
        {conversations.map(conv => (
          <button
            key={conv.id}
            type="button"
            className={`conversation-item ${conv.id === selectedId ? "active" : ""}`}
            onClick={() => onSelect(conv)}
          >
            <span className="conv-title">{truncateTitle(conv.title)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
