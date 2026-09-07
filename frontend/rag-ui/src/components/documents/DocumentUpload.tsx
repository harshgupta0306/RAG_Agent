import React, { useCallback, useState, useRef } from "react";
import { uploadDocument } from "../../api/rag";
import type { DocumentMeta } from "../../types/rag";

interface DocumentUploadProps {
  notebookId: string;
  onUploaded: (doc: DocumentMeta) => void;
}

const SUPPORTED_EXTENSIONS = [".pdf", ".docx", ".md", ".txt"];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

type UploadStatus = "idle" | "uploading" | "processing" | "ready" | "failed";

export default function DocumentUpload({
  notebookId,
  onUploaded,
}: DocumentUploadProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      return "Unsupported file type. Upload PDF, DOCX, MD, or TXT.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size must be under 10 MB.";
    }
    return null;
  }, []);

  const handleUpload = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setStatus("uploading");

    try {
      const result = await uploadDocument(file, notebookId);
      setStatus("ready");

      const doc: DocumentMeta = {
        document_id: result.document_id,
        notebook_id: result.notebook_id,
        file_name: result.file_name,
        file_type: result.file_type,
        chunks: result.chunks,
        status: result.status,
      };

      // Persist to localStorage (existing pattern)
      try {
        const key = `rag:documents:${notebookId}`;
        const existing = JSON.parse(localStorage.getItem(key) ?? "[]");
        existing.push(doc);
        localStorage.setItem(key, JSON.stringify(existing));
        window.dispatchEvent(
          new CustomEvent("documents:changed", { detail: { notebookId } })
        );
      } catch (err) {
        console.error("Failed to update local document list", err);
      }

      onUploaded(doc);

      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      setStatus("failed");
      setError(err instanceof Error ? err.message : "Upload failed.");
    }
  }, [notebookId, onUploaded, validateFile]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
      if (inputRef.current) inputRef.current.value = "";
    },
    [handleUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  const statusLabels: Record<UploadStatus, string> = {
    idle: "",
    uploading: "Uploading…",
    processing: "Processing…",
    ready: "✓ Uploaded",
    failed: "Upload failed",
  };

  return (
    <div
      className={`doc-upload ${dragOver ? "drag-over" : ""} ${status !== "idle" ? `upload-${status}` : ""}`}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.md,.txt"
        onChange={handleFileChange}
        disabled={status === "uploading"}
        className="doc-upload-input"
        id="doc-upload-input"
        aria-label="Upload document"
      />
      <label htmlFor="doc-upload-input" className="doc-upload-label">
        <span className="doc-upload-icon" aria-hidden="true">↑</span>
        <span className="doc-upload-text">
          {status === "idle"
            ? "Upload or drop file"
            : statusLabels[status]}
        </span>
      </label>

      {error && (
        <div className="doc-upload-error">{error}</div>
      )}
    </div>
  );
}
