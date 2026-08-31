import {
  useState,
} from "react";

import type { RetrievedDocument } from "../types/rag";

interface Props {
  documents: RetrievedDocument[];
}

function getDocumentContent(document: RetrievedDocument) {
  return document.content ?? document.page_content ?? document.text ?? "";
}

function getMetadataValue(
  metadata: Record<string, unknown> | undefined,
  keys: string[],
) {
  if (!metadata) {
    return undefined;
  }

  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "string" || typeof value === "number") {
      return String(value);
    }
  }

  return undefined;
}

function getScore(document: RetrievedDocument) {
  const value = document.score ?? document.relevance_score ?? document.metadata?.score;
  return typeof value === "number" ? value.toFixed(3) : undefined;
}

export default function RetrievedDocuments({
  documents,
}: Props) {
  const [expandedContent, setExpandedContent] = useState<Record<string, boolean>>({});

  if (!documents.length) {
    return null;
  }

  return (
    <section className="panel source-panel" aria-labelledby="retrieved-sources-title">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Grounding Context</p>
          <h2 id="retrieved-sources-title">Retrieved Sources</h2>
        </div>
        <span className="panel-count">{documents.length} documents</span>
      </div>

      <div className="source-grid">
        {documents.map((document, index) => {
          const content = getDocumentContent(document);
          const metadata = document.metadata;
          const filename =
            getMetadataValue(metadata, ["filename", "file_name", "source", "path"]) ??
            document.chunk_id ??
            `Source ${index + 1}`;
          const source = getMetadataValue(metadata, ["source", "title", "document"]);
          const category = getMetadataValue(metadata, ["category", "collection", "namespace"]);
          const score = getScore(document);
          const key = document.chunk_id ?? `${filename}-${index}`;
          const isLong = content.length > 420;
          const showAll = expandedContent[key] ?? false;
          const visibleContent = isLong && !showAll ? `${content.slice(0, 420)}...` : content;

          return (
            <details className="source-card" key={key}>
              <summary>
                <span className="source-icon" aria-hidden="true">
                  DOC
                </span>
                <span>
                  <strong>{filename}</strong>
                  <small>{source ?? category ?? document.chunk_id ?? "Retrieved chunk"}</small>
                </span>
                {score && <em>Score {score}</em>}
              </summary>

              <div className="source-details">
                <dl>
                  {category && (
                    <>
                      <dt>Category</dt>
                      <dd>{category}</dd>
                    </>
                  )}
                  {document.chunk_id && (
                    <>
                      <dt>Chunk</dt>
                      <dd>{document.chunk_id}</dd>
                    </>
                  )}
                  {score && (
                    <>
                      <dt>Score</dt>
                      <dd>{score}</dd>
                    </>
                  )}
                </dl>

                <p>{visibleContent || "No text preview was included in this result."}</p>

                {isLong && (
                  <button
                    className="text-button"
                    type="button"
                    onClick={() =>
                      setExpandedContent(previous => ({
                        ...previous,
                        [key]: !showAll,
                      }))
                    }
                  >
                    {showAll ? "Show less" : "Show more"}
                  </button>
                )}
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
