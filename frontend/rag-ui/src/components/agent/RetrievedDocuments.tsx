import { useState } from "react";
import type { RetrievedDocument } from "../../types/rag";

interface RetrievedDocumentsProps {
  documents: RetrievedDocument[];
}

function getDocContent(doc: RetrievedDocument) {
  return doc.content ?? doc.page_content ?? doc.text ?? "";
}

function getMetaValue(
  metadata: Record<string, unknown> | undefined,
  keys: string[],
) {
  if (!metadata) return undefined;
  for (const key of keys) {
    const val = metadata[key];
    if (typeof val === "string" || typeof val === "number") return String(val);
  }
  return undefined;
}

function getScore(doc: RetrievedDocument) {
  const val = doc.score ?? doc.relevance_score ?? doc.metadata?.score;
  return typeof val === "number" ? val.toFixed(3) : undefined;
}

export default function RetrievedDocuments({ documents }: RetrievedDocumentsProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (!documents.length) return null;

  return (
    <section className="agent-section" aria-labelledby="retrieved-docs-title">
      <div className="agent-section-header">
        <h3 id="retrieved-docs-title">Retrieved Sources</h3>
        <span className="agent-count">{documents.length} docs</span>
      </div>

      <div className="retrieved-list">
        {documents.map((doc, index) => {
          const content = getDocContent(doc);
          const meta = doc.metadata;
          const filename = getMetaValue(meta, ["filename", "file_name", "source", "path"])
            ?? doc.chunk_id
            ?? `Source ${index + 1}`;
          const page = getMetaValue(meta, ["page", "page_number"]);
          const score = getScore(doc);
          const key = doc.chunk_id ?? `${filename}-${index}`;
          const isExpanded = expanded[key] ?? false;
          const isLong = content.length > 300;

          return (
            <details
              key={key}
              className="retrieved-item"
              open={isExpanded}
              onToggle={e => {
                setExpanded(prev => ({
                  ...prev,
                  [key]: (e.target as HTMLDetailsElement).open,
                }));
              }}
            >
              <summary className="retrieved-summary">
                <div className="retrieved-info">
                  <span className="retrieved-name">{filename}</span>
                  <span className="retrieved-meta">
                    {page && <span>Page {page}</span>}
                    {doc.chunk_id && <span>{doc.chunk_id}</span>}
                    {score && <span>Score {score}</span>}
                  </span>
                </div>
                <span className="retrieved-chevron" aria-hidden="true">▾</span>
              </summary>
              <div className="retrieved-content">
                <p>{isLong && !isExpanded ? content.slice(0, 300) + "…" : content || "No preview available."}</p>
                {meta && Object.keys(meta).length > 0 && (
                  <div className="retrieved-metadata">
                    {Object.entries(meta)
                      .filter(([k]) => !["filename", "file_name", "source", "page", "page_number"].includes(k))
                      .slice(0, 5)
                      .map(([k, v]) => (
                        <div key={k} className="retrieved-meta-row">
                          <span>{k}</span>
                          <code>{typeof v === "object" ? JSON.stringify(v) : String(v)}</code>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
