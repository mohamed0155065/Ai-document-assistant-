import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UploadBox from "@/components/upload/upload-box";
import ProjectPromptBox from "@/components/ai/project-prompt-box";

// Server component — all data fetching happens here before anything renders
export default async function ProjectDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    // Extract the project ID from the URL
    const { id } = await params;

    const supabase = await createClient();

    // Check if the user is logged in
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Not logged in — send them to the login page
    if (!user) {
        redirect("/auth/login");
    }

    // Fetch the project and confirm it belongs to this user
    const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

    // Project not found or doesn't belong to this user — redirect to dashboard
    if (projectError || !project) {
        redirect("/auth/dashboard");
    }

    // Fetch all documents uploaded to this project, newest first
    const { data: documents, error: docsError } = await supabase
        .from("documents")
        .select("*")
        .eq("project_id", id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    // Fetch all previous AI analyses for this project, newest first
    const { data: generations, error: generationsError } = await supabase
        .from("generations")
        .select("*")
        .eq("project_id", id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    // Log errors but don't block rendering — the UI handles empty states gracefully
    if (docsError) {
        console.error(docsError.message);
    }

    if (generationsError) {
        console.error(generationsError.message);
    }

    return (
        <main className="min-h-screen bg-zinc-950 text-white p-8">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Project header — title and description */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                    <h1 className="text-3xl font-bold">{project.title}</h1>
                    <p className="text-zinc-400 mt-3">
                        {project.description || "No description"}
                    </p>
                </div>

                {/* File upload area */}
                <UploadBox projectId={project.id} />

                {/* List of uploaded documents */}
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">Project Files</h2>

                    <div className="grid gap-4">
                        {documents && documents.length > 0 ? (
                            documents.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
                                >
                                    <p className="font-medium">{doc.file_name}</p>
                                    <p className="text-sm text-zinc-400">{doc.file_type}</p>
                                </div>
                            ))
                        ) : (
                            // Empty state — no documents uploaded yet
                            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-zinc-400">
                                No files uploaded yet.
                            </div>
                        )}
                    </div>
                </section>

                {/* AI prompt input — user asks questions about the documents */}
                <ProjectPromptBox projectId={project.id} />

                {/* History of all previous AI analyses for this project */}
                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">Previous Analyses</h2>

                    <div className="space-y-4">
                        {generations && generations.length > 0 ? (
                            generations.map((gen) => (
                                <div
                                    key={gen.id}
                                    className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5"
                                >
                                    <p className="text-sm text-zinc-400 mb-2">Prompt</p>
                                    <p className="mb-4 whitespace-pre-wrap">{gen.prompt}</p>

                                    <p className="text-sm text-zinc-400 mb-2">Response</p>
                                    <div className="whitespace-pre-wrap text-zinc-200">
                                        {gen.response}
                                    </div>
                                </div>
                            ))
                        ) : (
                            // Empty state — no analyses run yet
                            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-zinc-400">
                                No analyses yet.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}