"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CreateProjectForm() {
    const router = useRouter();

    // Client-side Supabase instance for browser auth and DB writes
    const supabase = createClient();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    // Used for both error and success feedback
    const [message, setMessage] = useState("");

    const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
        // Prevent native browser form submission
        e.preventDefault();

        // Title is the only required field — block early if it's empty
        if (!title.trim()) {
            setMessage("Project title is required");
            return;
        }

        try {
            setLoading(true);
            setMessage("");

            // Confirm the user is still logged in before writing to the DB
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user) {
                setMessage("You must be logged in");
                return;
            }

            // Insert the new project and get back its ID to redirect to
            const { data, error } = await supabase
                .from("projects")
                .insert({
                    user_id: user.id,
                    title: title.trim(),
                    description: description.trim() || null, // Store null if description is empty
                })
                .select("id")
                .single();

            if (error) {
                setMessage(error.message);
                return;
            }

            // Clear the form on success
            setTitle("");
            setDescription("");

            // Navigate to the new project and refresh so the sidebar picks it up
            router.push(`/auth/dashboard?project=${data.id}`);
            router.refresh();
        } catch (error) {
            setMessage(
                error instanceof Error ? error.message : "Failed to create project"
            );
        } finally {
            // Always clear the loading state whether it succeeded or failed
            setLoading(false);
        }
    };

    return (
        <form
            onSubmit={handleCreateProject}
            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 space-y-3"
        >
            <h2 className="text-lg font-semibold">New Project</h2>

            {/* Project title — required */}
            <input
                type="text"
                placeholder="Project title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg bg-zinc-800 px-4 py-3 outline-none"
            />

            {/* Project description — optional */}
            <textarea
                placeholder="Project description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg bg-zinc-800 px-4 py-3 outline-none min-h-[100px]"
            />

            {/* Submit button — disabled while the request is in flight */}
            <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-white text-black px-4 py-2 font-medium disabled:opacity-50"
            >
                {loading ? "Creating..." : "Create Project"}
            </button>

            {/* Feedback message — errors and success use the same state */}
            {message && <p className="text-sm text-zinc-400">{message}</p>}
        </form>
    );
}