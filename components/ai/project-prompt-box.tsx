"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ProjectPromptBoxProps = {
    projectId: string;
};

export default function ProjectPromptBox({ projectId }: ProjectPromptBoxProps) {
    const router = useRouter();

    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Holds the latest AI response to show inline before the page refreshes
    const [output, setOutput] = useState("");

    const handleAnalyze = async () => {
        // Don't submit if the prompt is empty
        if (!prompt.trim()) return;

        try {
            setLoading(true);
            setError("");
            setOutput("");

            // Call the analyze endpoint with the project ID and the user's prompt
            const res = await fetch("/api/analyze", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    projectId,
                    prompt: prompt.trim(),
                }),
            });

            // Safely parse the response — fall back to an empty object if it fails
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(data.error || "Analysis failed");
                return;
            }

            // Show the response immediately without waiting for the page to refresh
            setOutput(data.generation?.response || "No response generated");

            // Clear the input after a successful analysis
            setPrompt("");

            // Refresh the server data so the new generation appears in the history list
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Analysis failed");
        } finally {
            // Always clear the loading state whether it succeeded or failed
            setLoading(false);
        }
    };

    return (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
            <h2 className="text-xl font-semibold">Ask AI about this project</h2>

            {/* Prompt input */}
            <textarea
                className="w-full min-h-[160px] rounded-xl bg-zinc-800 px-4 py-3 outline-none"
                placeholder="Ask anything about your uploaded files..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
            />

            {/* Submit button — disabled while loading or if the prompt is empty */}
            <button
                type="button"
                className="rounded-lg bg-white text-black px-4 py-2 font-medium disabled:opacity-50"
                disabled={loading || !prompt.trim()}
                onClick={handleAnalyze}
            >
                {loading ? "Analyzing..." : "Analyze"}
            </button>

            {/* Error message */}
            {error && <p className="text-sm text-red-400">{error}</p>}

            {/* Inline response — shows immediately after the API returns */}
            {output && (
                <div className="rounded-xl border border-zinc-800 p-4 whitespace-pre-wrap text-zinc-200">
                    {output}
                </div>
            )}
        </div>
    );
}