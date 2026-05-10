"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function UploadBox({ projectId }: { projectId: string }) {
  const router = useRouter();

  // Ref to the hidden file input so we can trigger it from the drop zone click
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Tracks whether the message is a success or error to apply the right styles
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");

  // Tracks whether the user is dragging a file over the drop zone
  const [isDragging, setIsDragging] = useState(false);

  const handleUpload = async () => {
    if (!files.length) {
      setMessage("Please select at least one file.");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      setMessageType("");

      // Build a FormData payload — multipart so we can send multiple files
      const formData = new FormData();
      formData.append("projectId", projectId);
      files.forEach((file) => formData.append("files", file));

      // Send to the upload API endpoint
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      // Safely parse the response — fall back to empty object if it fails
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMessage(data.error || "Upload failed.");
        setMessageType("error");
        return;
      }

      setMessage(`${data.documents.length} file(s) uploaded successfully!`);
      setMessageType("success");

      // Clear the selected files and reset the hidden input
      setFiles([]);
      if (inputRef.current) inputRef.current.value = "";

      // Refresh server data so the files list updates without a full page reload
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    // Filter dropped files to only allow supported types
    const dropped = Array.from(e.dataTransfer.files).filter((f) =>
      [
        "application/pdf",
        "text/plain",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ].includes(f.type)
    );

    if (dropped.length) {
      setFiles(dropped);
      setMessage("");
      setMessageType("");
    } else {
      // All dropped files were unsupported types
      setMessage("Only PDF, TXT, and DOCX files are allowed.");
      setMessageType("error");
    }
  };

  // Remove a single file from the selected list by index
  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Map MIME types to a readable icon
  const getFileIcon = (type: string) => {
    if (type === "application/pdf") return "PDF";
    if (type === "text/plain") return "TXT";
    return "DOC";
  };

  return (
    <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6 space-y-5">

      {/* Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold text-white">
          Upload Documents
        </h2>
        <p className="text-xs sm:text-sm text-zinc-500 mt-1">
          Supported formats: PDF, TXT, DOCX — Max 5MB per file
        </p>
      </div>

      {/* Drop zone — clicking it triggers the hidden file input */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed 
          p-6 sm:p-10 text-center transition-colors duration-200
          ${isDragging
            ? "border-white bg-zinc-800"
            : "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50"
          }`}
      >
        <div className="text-3xl sm:text-4xl mb-2">📂</div>
        <p className="text-zinc-400 text-xs sm:text-sm">
          Drag & drop files here, or{" "}
          <span className="text-white underline">browse</span>
        </p>

        {/* Hidden input — triggered by clicking the drop zone */}
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.txt,.docx"
          onChange={(e) => {
            setFiles(Array.from(e.target.files || []));
            setMessage("");
            setMessageType("");
          }}
          className="hidden"
        />
      </div>

      {/* List of selected files with individual remove buttons */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs sm:text-sm text-zinc-400 font-medium">
            {files.length} file(s) selected:
          </p>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li
                key={index}
                className="flex items-center justify-between gap-2 
                  rounded-lg bg-zinc-800 px-3 sm:px-4 py-2 text-xs sm:text-sm"
              >
                <div className="flex items-center gap-2 text-zinc-300 min-w-0">
                  <span className="shrink-0">{getFileIcon(file.type)}</span>
                  <span className="truncate">{file.name}</span>
                  {/* File size — hidden on mobile to save space */}
                  <span className="text-zinc-500 shrink-0 hidden sm:inline">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                {/* Remove this file from the selection */}
                <button
                  onClick={() => removeFile(index)}
                  className="shrink-0 text-zinc-500 hover:text-red-400 
                    transition-colors text-base"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Upload button — disabled while loading or no files are selected */}
      <button
        type="button"
        onClick={handleUpload}
        disabled={loading || files.length === 0}
        className="w-full rounded-lg bg-white text-black px-4 py-2.5 
          text-sm sm:text-base font-medium transition-opacity duration-200 
          disabled:opacity-40 hover:opacity-90"
      >
        {/* Show a spinner while the upload is in progress */}
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
            Uploading...
          </span>
        ) : (
          "Upload Documents"
        )}
      </button>

      {/* Success or error message — styled differently based on messageType */}
      {message && (
        <p
          className={`text-xs sm:text-sm rounded-lg px-4 py-2 ${messageType === "success"
            ? "bg-green-900/30 text-green-400 border border-green-800"
            : "bg-red-900/30 text-red-400 border border-red-800"
            }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}