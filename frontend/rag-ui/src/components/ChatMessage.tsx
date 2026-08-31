import MarkdownText from "./MarkdownText";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

export default function ChatMessage({
  role,
  content,
  streaming = false,
}: ChatMessageProps) {
  return (
    <article className={`chat-message ${role}`}>
      <div className="message-label">{role === "user" ? "YOU" : "ASSISTANT"}</div>
      <div className="message-body">
        {role === "assistant" ? (
          <>
            <MarkdownText content={content} />
            {streaming && <span className="stream-cursor" aria-hidden="true" />}
          </>
        ) : (
          <p>{content}</p>
        )}
      </div>
    </article>
  );
}
