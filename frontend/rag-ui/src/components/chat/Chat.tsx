import type { Message as MessageType, RetrievedDocument, SearchMode } from "../../types/rag";
import MessageList from "./MessageList";
import Composer from "./Composer";
import EmptyState from "../shared/EmptyState";

interface ChatProps {
  // Conversation state
  conversationTitle: string;
  notebookName: string;
  searchMode: SearchMode;
  messages: MessageType[];
  streamingAnswer: string;
  isStreaming: boolean;
  retrievedDocuments: RetrievedDocument[];
  statusMessage: string;

  // Composer
  query: string;
  running: boolean;
  error?: string;
  onQueryChange: (query: string) => void;
  onModeChange: (mode: SearchMode) => void;
  onSubmit: () => void;
  onViewSources?: () => void;

  // State flags
  hasConversation: boolean;
}

export default function Chat({
  conversationTitle,
  notebookName,
  searchMode,
  messages,
  streamingAnswer,
  isStreaming,
  retrievedDocuments,
  statusMessage,
  query,
  running,
  error,
  onQueryChange,
  onModeChange,
  onSubmit,
  onViewSources,
  hasConversation,
}: ChatProps) {
  const hasMessages = messages.length > 0 || streamingAnswer;

  return (
    <main className="chat-panel">
      {/* Conversation header */}
      {hasConversation && (
        <div className="chat-header">
          <div className="chat-header-info">
            <h2 className="chat-title">{conversationTitle || "New Conversation"}</h2>
            <span className="chat-meta">
              {notebookName && <span>{notebookName}</span>}
              <span className="chat-mode-badge">{searchMode}</span>
            </span>
          </div>
        </div>
      )}

      {/* Message area */}
      <div className="chat-messages-area">
        {!hasMessages && !hasConversation ? (
          <div className="chat-empty-wrapper">
            <EmptyState
              icon="◇"
              title="Start a conversation"
              description="Ask a question about your sources to see the agent work."
            />
          </div>
        ) : !hasMessages && hasConversation ? (
          <div className="chat-empty-wrapper">
            <EmptyState
              icon="→"
              title="Ask something"
              description="Type a question below to query your knowledge base."
            />
          </div>
        ) : (
          <>
            <MessageList
              messages={messages}
              streamingAnswer={streamingAnswer}
              isStreaming={isStreaming}
              retrievedDocuments={retrievedDocuments}
              onViewSources={onViewSources}
            />

            {/* Streaming status */}
            {running && statusMessage && (
              <div className="streaming-status" aria-live="polite">
                <span className="streaming-dot" aria-hidden="true" />
                {statusMessage}
              </div>
            )}
          </>
        )}
      </div>

      {/* Composer */}
      <div className="chat-composer">
        <Composer
          query={query}
          searchMode={searchMode}
          running={running}
          error={error}
          onQueryChange={onQueryChange}
          onModeChange={onModeChange}
          onSubmit={onSubmit}
        />
      </div>
    </main>
  );
}
