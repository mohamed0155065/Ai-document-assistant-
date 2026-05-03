"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Generation = {
    id: string;
    prompt: string;
    response: string;
    created_at: string;
};

export default function Generations({
    generations,
}: {
    generations: Generation[];
}) {
    const router = useRouter();
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this response?")) return;

        setDeletingId(id);

        try {
            const res = await fetch(`/api/generations/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) {
                const data = await res.json();
                alert(data.error || "Delete failed");
                return;
            }

            router.refresh();
        } catch {
            alert("Something went wrong.");
        } finally {
            setDeletingId(null);
        }
    };

    if (generations.length === 0) return null;

    return (
        <section className="space-y-4 pb-8">
            <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                🤖 AI Responses
                <span className="text-xs font-normal text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                    {generations.length}
                </span>
            </h3>

            <div className="space-y-4">
                {generations.map((gen) => (
                    <div
                        key={gen.id}
                        className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5 space-y-3"
                    >
                        {/* Prompt */}
                        <div className="flex items-start gap-3">

                            <p className="text-sm text-zinc-300 bg-zinc-800 rounded-lg px-3 py-2 flex-1">
                                {gen.prompt}
                            </p>
                        </div>

                        {/* Response */}
                        <div className="flex items-start gap-3">

                            <p className="text-sm text-zinc-400 bg-zinc-800/50 rounded-lg px-3 py-2 flex-1 whitespace-pre-wrap">
                                {gen.response}
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-1">
                            <p className="text-xs text-zinc-600">
                                {formatDate(gen.created_at)}
                            </p>
                            <button
                                onClick={() => handleDelete(gen.id)}
                                disabled={deletingId === gen.id}
                                className="text-xs text-zinc-600 hover:text-red-400 
                                    transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                                {deletingId === gen.id ? (
                                    <>
                                        <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10"
                                                stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor"
                                                d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        Deleting...
                                    </>
                                ) : (
                                    <>🗑 Delete</>
                                )}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}