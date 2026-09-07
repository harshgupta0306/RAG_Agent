import type { DocumentMeta } from "../types/rag";

const API_URL = "http://127.0.0.1:8000";

export async function getDocuments(notebookId: string): Promise<DocumentMeta[]> {
  try {
    const response = await fetch(`${API_URL}/api/notebooks/${notebookId}/documents`);
    if (!response.ok) {
      throw new Error("Failed to fetch documents");
    }
    return response.json();
  } catch (err) {
    // Fallback to localStorage for offline or legacy entries
    try {
      const key = `rag:documents:${notebookId}`;
      return JSON.parse(localStorage.getItem(key) ?? "[]");
    } catch {
      return [];
    }
  }
}

export async function deleteDocument(
  notebookId: string,
  documentId: string
): Promise<void> {
  const response = await fetch(
    `${API_URL}/api/notebooks/${notebookId}/documents/${documentId}`,
    {
      method: "DELETE",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to delete document");
  }

  // Also clean up localStorage if present
  try {
    const key = `rag:documents:${notebookId}`;
    const existing: DocumentMeta[] = JSON.parse(localStorage.getItem(key) ?? "[]");
    const updated = existing.filter(d => d.document_id !== documentId);
    localStorage.setItem(key, JSON.stringify(updated));
    window.dispatchEvent(
      new CustomEvent("documents:changed", { detail: { notebookId } })
    );
  } catch {
    // ignore
  }
}
