"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CreateProjectForm() {
    const router = useRouter();
    const supabase = createClient();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!title.trim()) {
            setMessage("Project title is required");
            return;
        }

        try {
            setLoading(true);
            setMessage("");

            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user) {
                setMessage("You must be logged in");
                return;
            }

            const { data, error } = await supabase
                .from("projects")
                .insert({
                    user_id: user.id,
                    title: title.trim(),
                    description: description.trim() || null,
                })
                .select("id")
                .single();

            if (error) {
                setMessage(error.message);
                return;
            }

            setTitle("");
            setDescription("");

            router.push(`/auth/dashboard?project=${data.id}`);
            router.refresh();
        } catch (error) {
            setMessage(
                error instanceof Error ? error.message : "Failed to create project"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleCreateProject}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 space-y-3"
        >
            <h2 className="text-lg font-semibold">New Project</h2>

            <input
                type="text"
                placeholder="Project title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg bg-zinc-800 px-4 py-3 outline-none"
            />

            <textarea
                placeholder="Project description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg bg-zinc-800 px-4 py-3 outline-none min-h-[100px]"
            />

            <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-white text-black px-4 py-2 font-medium disabled:opacity-50"
            >
                {loading ? "Creating..." : "Create Project"}
            </button>

            {message && <p className="text-sm text-zinc-400">{message}</p>}
        </form>
    );
}