import { useEffect, useRef } from "react";
import type { Message as MessageType, RetrievedDocument } from "../../types/rag";
import Message from "./Message";

interface MessageListProps {
  messages: MessageType[];
  streamingAnswer: string;
  isStreaming: boolean;
  retrievedDocuments: RetrievedDocument[];
  onViewSources?: () => void;
}

export default function MessageList({
  messages,
  streamingAnswer,
  isStreaming,
  retrievedDocuments,
  onViewSources,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom during streaming or when new messages arrive
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, streamingAnswer]);

  // Check if the last persisted message is assistant — if so, the streaming answer
  // is a duplicate of the final answer that was already saved
  const lastPersistedIsAssistant =
    messages.length > 0 && messages[messages.length - 1].role === "assistant";

  return (
    <div className="message-list" ref={containerRef}>
      {messages.map(msg => (
        <Message
          key={msg.id}
          role={msg.role}
          content={msg.content}
          retrievedDocuments={
            msg.role === "assistant" && msg === messages[messages.length - 1]
              ? retrievedDocuments
              : undefined
          }
          onViewSources={
            msg.role === "assistant" && msg === messages[messages.length - 1]
              ? onViewSources
              : undefined
          }
        />
      ))}

      {/* Live streaming answer — only show if we're streaming AND the answer 
          hasn't already been persisted as the last assistant message */}
      {isStreaming && streamingAnswer && !lastPersistedIsAssistant && (
        <Message
          role="assistant"
          content={streamingAnswer}
          streaming={true}
          retrievedDocuments={retrievedDocuments}
          onViewSources={onViewSources}
        />
      )}

      {/* Non-streaming answer that hasn't been persisted yet */}
      {!isStreaming && streamingAnswer && !lastPersistedIsAssistant && (
        <Message
          role="assistant"
          content={streamingAnswer}
          retrievedDocuments={retrievedDocuments}
          onViewSources={onViewSources}
        />
      )}

      <div ref={bottomRef} />
    </div>
  );
}
