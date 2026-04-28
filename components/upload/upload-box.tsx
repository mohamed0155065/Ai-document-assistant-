"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UploadBox({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!files.length) return;

    setLoading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("projectId", projectId);

    files.forEach((file) => {
      formData.append("files", file);
    });

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage(data.error || "Upload failed");
      setLoading(false);
      return;
    }

    setMessage(`${data.documents.length} files uploaded successfully.`);
    setFiles([]);
    setLoading(false);
    router.refresh();
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
      <h2 className="text-xl font-semibold">Upload Documents</h2>

      <input
        type="file"
        multiple
        accept=".pdf,.txt,.docx"
        onChange={(e) => setFiles(Array.from(e.target.files || []))}
        className="block w-full text-sm text-zinc-400"
      />

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-zinc-400">Selected files:</p>
          <ul className="space-y-1 text-sm text-zinc-300">
            {files.map((file, index) => (
              <li key={index}>
                {file.name} — {(file.size / 1024).toFixed(1)} KB
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!files.length || loading}
        className="rounded-lg bg-white text-black px-4 py-2 font-medium disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Upload Documents"}
      </button>

      {message && <p className="text-sm text-zinc-400">{message}</p>}
    </div>
  );
}