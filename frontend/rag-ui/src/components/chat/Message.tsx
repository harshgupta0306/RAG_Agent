import type { RetrievedDocument, Citation } from "../../types/rag";
import MarkdownText from "../MarkdownText";

interface MessageProps {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
  retrievedDocuments?: RetrievedDocument[];
  citations?: Citation[];
  onViewSources?: () => void;
}

function getFilename(doc: RetrievedDocument, index: number) {
  const md = doc.metadata ?? {};
  return (
    (md["filename"] as string) ||
    (md["file_name"] as string) ||
    doc.chunk_id ||
    "Source " + String(index + 1)
  );
}

export default function Message({
  role,
  content,
  streaming = false,
  retrievedDocuments = [],
  citations,
  onViewSources,
}: MessageProps) {
  const hasSources = retrievedDocuments.length > 0;
  const hasCitations = citations && citations.length > 0;

  return (
    <article className={`message ${role}`}>
      <div className="message-role">
        {role === "user" ? "You" : "Assistant"}
      </div>
      <div className="message-content">
        {role === "assistant" ? (
          <>
            <MarkdownText content={content} />
            {streaming && <span className="stream-cursor" aria-hidden="true" />}

            {/* Citation display — future-ready */}
            {hasCitations && (
              <div className="message-citations">
                <div className="citations-label">Sources</div>
                <ul>
                  {citations!.map(c => (
                    <li key={c.index}>
                      <span className="citation-idx">[{c.index}]</span>
                      <span className="citation-name">{c.filename}</span>
                      {c.page !== undefined && (
                        <span className="citation-meta"> — Page {String(c.page)}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Inline source references from retrieved documents */}
            {hasSources && !hasCitations && (
              <div className="message-citations">
                <div className="citations-label">Sources</div>
                <ul>
                  {retrievedDocuments.slice(0, 3).map((d, i) => {
                    const page = d.metadata
                      ? (d.metadata["page"] ?? d.metadata["page_number"])
                      : undefined;
                    return (
                      <li key={i}>
                        <span className="citation-idx">[{i + 1}]</span>
                        <span className="citation-name">{getFilename(d, i)}</span>
                        {page !== undefined && (
                          <span className="citation-meta"> — Page {String(page)}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {onViewSources && (
                  <button
                    type="button"
                    className="btn-text"
                    onClick={onViewSources}
                  >
                    View all sources →
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <p>{content}</p>
        )}
      </div>
    </article>
  );
}
