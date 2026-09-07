import { useEffect, useRef } from "react";
import type { SearchMode } from "../../types/rag";

interface ComposerProps {
  query: string;
  searchMode: SearchMode;
  running: boolean;
  error?: string;
  onQueryChange: (query: string) => void;
  onModeChange: (mode: SearchMode) => void;
  onSubmit: () => void;
}

const modes: Array<{ value: SearchMode; label: string }> = [
  { value: "auto", label: "Auto" },
  { value: "hybrid", label: "Chat" },
  { value: "semantic", label: "RAG" },
];

export default function Composer({
  query,
  searchMode,
  running,
  error,
  onQueryChange,
  onModeChange,
  onSubmit,
}: ComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = Math.min(textarea.scrollHeight, 180) + "px";
  }, [query]);

  return (
    <div className="composer-wrapper">
      {error && (
        <div className="composer-error" role="alert">{error}</div>
      )}
      <form
        className="composer"
        onSubmit={e => {
          e.preventDefault();
          onSubmit();
        }}
      >
        <textarea
          ref={textareaRef}
          id="rag-query"
          className="composer-input"
          value={query}
          disabled={running}
          rows={1}
          onChange={e => onQueryChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!running && query.trim()) onSubmit();
            }
          }}
          placeholder="Ask something…"
          aria-label="Ask something about your knowledge base"
        />
        <div className="composer-bar">
          <div className="composer-mode">
            {modes.map(m => (
              <button
                key={m.value}
                type="button"
                className={`mode-btn ${searchMode === m.value ? "active" : ""}`}
                onClick={() => onModeChange(m.value)}
                aria-pressed={searchMode === m.value}
              >
                {m.label}
              </button>
            ))}
          </div>
          <button
            type="submit"
            className="composer-send"
            disabled={running || !query.trim()}
          >
            {running ? (
              <span className="send-loading" aria-hidden="true" />
            ) : (
              <span aria-hidden="true">↑</span>
            )}
            <span className="sr-only">{running ? "Running" : "Send"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
