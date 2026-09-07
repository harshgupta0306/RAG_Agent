import type { DocumentMeta } from "../../types/rag";

interface DocumentListProps {
  documents: DocumentMeta[];
}

const typeIcons: Record<string, string> = {
  pdf: "PDF",
  docx: "DOC",
  md: "MD",
  txt: "TXT",
};

const statusLabels: Record<string, string> = {
  indexed: "Ready",
  uploaded: "Processing",
  failed: "Failed",
};

export default function DocumentList({ documents }: DocumentListProps) {
  if (documents.length === 0) return null;

  return (
    <div className="document-list">
      {documents.map((doc, i) => {
        const ext = (doc.file_type || "txt").toLowerCase();
        const statusClass = doc.status === "failed" ? "status-error" : doc.status === "indexed" ? "status-ready" : "status-processing";

        return (
          <div
            key={doc.document_id ?? `${doc.file_name}-${i}`}
            className="document-row"
          >
            <span className={`doc-type-badge ${ext}`} aria-hidden="true">
              {typeIcons[ext] ?? ext.toUpperCase()}
            </span>
            <div className="doc-info">
              <span className="doc-name">{doc.file_name}</span>
              <span className="doc-meta">
                {doc.chunks > 0 && <span>{doc.chunks} chunks</span>}
                <span className={`doc-status ${statusClass}`}>
                  {statusLabels[doc.status] ?? doc.status}
                </span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
