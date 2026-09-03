import type {
  ConversationSummary,
  SearchMode,
} from "../types/rag";
import DocumentUpload from "./DocumentUpload";

interface SidebarProps {
  collapsed: boolean;
  conversations: ConversationSummary[];
  currentThreadId: string;
  searchMode: SearchMode;
  onToggle: () => void;
  onNewChat: () => void;
  onModeChange: (mode: SearchMode) => void;
  onSelectConversation: (threadId: string) => void;
}

const searchModes: Array<{
  value: SearchMode;
  label: string;
}> = [
  {
    value: "auto",
    label: "Auto",
  },
  {
    value: "semantic",
    label: "Semantic",
  },
  {
    value: "hybrid",
    label: "Hybrid",
  },
];

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

export default function Sidebar({
  collapsed,
  conversations,
  currentThreadId,
  searchMode,
  onToggle,
  onNewChat,
  onModeChange,
  onSelectConversation,
}: SidebarProps) {
  return (
    <aside className={`sidebar ${collapsed ? "sidebar-collapsed" : ""}`}>
      <div className="sidebar-top">
        <button
          className="sidebar-toggle"
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? ">" : "<"}
        </button>
      </div>

      <button className="new-chat-button" type="button" onClick={onNewChat}>
        <span aria-hidden="true">+</span>
        <span>New Chat</span>
      </button>

      <section className="sidebar-section" aria-labelledby="search-mode-label">
        <div className="sidebar-label" id="search-mode-label">
          Search Mode
        </div>
        <div className="segmented-control" role="radiogroup" aria-labelledby="search-mode-label">
          {searchModes.map(mode => (
            <button
              key={mode.value}
              className={searchMode === mode.value ? "active" : ""}
              type="button"
              role="radio"
              aria-checked={searchMode === mode.value}
              onClick={() => onModeChange(mode.value)}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </section>
      <DocumentUpload></DocumentUpload>
      <section className="sidebar-section conversation-list" aria-labelledby="history-label">
        <div className="sidebar-label" id="history-label">
          Local Session
        </div>

        {conversations.length === 0 ? (
          <p className="sidebar-empty">Recent queries appear here for this browser session.</p>
        ) : (
          <div className="conversation-group">
            <span>Today</span>
            {conversations.map(conversation => (
              <button
                key={conversation.threadId}
                className={
                  conversation.threadId === currentThreadId
                    ? "conversation-item active"
                    : "conversation-item"
                }
                type="button"
                onClick={() => onSelectConversation(conversation.threadId)}
              >
                <strong>{conversation.title}</strong>
                <small>
                  {conversation.mode} / {formatTime(conversation.updatedAt)}
                </small>
              </button>
            ))}
          </div>
        )}
      </section>
    </aside>
  );
}
