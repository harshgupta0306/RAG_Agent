import React, { useState } from "react";
import { uploadDocument } from "../api/rag";

const SUPPORTED_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".md",
  ".txt",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB


const DocumentUpload: React.FC = () => {

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [error, setError] =
    useState<string | null>(null);


  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {

    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError(null);

    // -------------------------
    // Validate extension
    // -------------------------

    const extension =
      "." +
      file.name
        .split(".")
        .pop()
        ?.toLowerCase();

    if (
      !SUPPORTED_EXTENSIONS.includes(
        extension
      )
    ) {
      setError(
        "Unsupported file type. Please upload PDF, DOCX, MD or TXT."
      );

      setSelectedFile(null);

      return;
    }

    // -------------------------
    // Validate size
    // -------------------------

    if (file.size > MAX_FILE_SIZE) {

      setError(
        "File size must be less than 10 MB."
      );

      setSelectedFile(null);

      return;
    }

    // -------------------------
    // Store file
    // -------------------------

    setSelectedFile(file);
  };


  const handleUpload = () => {

    if (!selectedFile) {
      return;
    }
    uploadDocument(selectedFile);
    console.log(
      "File ready for upload:",
      selectedFile
    );
  };


  return (
    <div className="document-upload">

      <input
        type="file"
        accept=".pdf,.docx,.md,.txt"
        onChange={handleFileChange}
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
          >
            Upload
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