import {
  useEffect,
  useRef,
} from "react";

import type { SearchMode } from "../types/rag";

interface ChatInputProps {
  query: string;
  searchMode: SearchMode;
  running: boolean;
  onQueryChange: (query: string) => void;
  onSubmit: () => void;
}

const modeLabels: Record<SearchMode, string> = {
  auto: "Auto",
  semantic: "Semantic",
  hybrid: "Hybrid",
};

export default function ChatInput({
  query,
  searchMode,
  running,
  onQueryChange,
  onSubmit,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 220)}px`;
  }, [query]);

  return (
    <form
      className="composer"
      onSubmit={event => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <label className="sr-only" htmlFor="rag-query">
        Ask something about your knowledge base
      </label>
      <textarea
        ref={textareaRef}
        id="rag-query"
        value={query}
        disabled={running}
        rows={2}
        onChange={event => onQueryChange(event.target.value)}
        onKeyDown={event => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            onSubmit();
          }
        }}
        placeholder="Ask something about your knowledge base..."
      />

      <div className="composer-footer">
        <span className="shortcut-hint">Ctrl + Enter to send</span>
        <div className="composer-actions">
          <span className="mode-indicator">{modeLabels[searchMode]}</span>
          <button type="submit" disabled={running || !query.trim()}>
            <span aria-hidden="true">{running ? "..." : "^"}</span>
            {running ? "Running" : "Send"}
          </button>
        </div>
      </div>
    </form>
  );
}
