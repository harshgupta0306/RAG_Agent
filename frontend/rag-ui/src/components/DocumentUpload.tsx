import React, { useState } from "react";
import { useParams } from "react-router";

import { uploadDocument } from "../api/rag";

const SUPPORTED_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".md",
  ".txt",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const DocumentUpload: React.FC = () => {
  const { notebookId } = useParams<{ notebookId: string }>();

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [uploading, setUploading] =
    useState(false);

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError(null);

    // Validate extension
    const extension =
      "." +
      file.name
        .split(".")
        .pop()
        ?.toLowerCase();

    if (
      !SUPPORTED_EXTENSIONS.includes(extension)
    ) {
      setError(
        "Unsupported file type. Please upload PDF, DOCX, MD or TXT."
      );

      setSelectedFile(null);
      return;
    }

    // Validate size
    if (file.size > MAX_FILE_SIZE) {
      setError(
        "File size must be less than 10 MB."
      );

      setSelectedFile(null);
      return;
    }

    // Store file
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      return;
    }

    if (!notebookId) {
      setError("Notebook ID is missing.");
      return;
    }

    try {
      setError(null);
      setUploading(true);

      const result = await uploadDocument(
        selectedFile,
        notebookId
      );

      console.log(
        "Upload successful:",
        result
      );

      setSelectedFile(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to upload document."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="document-upload">

      <input
        type="file"
        accept=".pdf,.docx,.md,.txt"
        onChange={handleFileChange}
        disabled={uploading}
      />

      {selectedFile && (
        <div>
          <p>
            {selectedFile.name}
          </p>

          <p>
            {(selectedFile.size / 1024).toFixed(1)} KB
          </p>

          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading
              ? "Uploading..."
              : "Upload"}
          </button>
        </div>
      )}

      {error && (
        <p>
          {error}
        </p>
      )}

    </div>
  );
};

export default DocumentUpload;