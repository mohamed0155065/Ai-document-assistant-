import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UploadBox from "@/components/upload/upload-box";
import ProjectPromptBox from "@/components/ai/project-prompt-box";

export default async function ProjectDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const { data: project } = await supabase
        .from("projects")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

    if (!project) {
        redirect("/dashboard");
    }

    const { data: documents } = await supabase
        .from("documents")
        .select("*")
        .eq("project_id", id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    const { data: generations } = await supabase
        .from("generations")
        .select("*")
        .eq("project_id", id)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    return (
        <main className="min-h-screen bg-zinc-950 text-white p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                    <h1 className="text-3xl font-bold">{project.title}</h1>
                    <p className="text-zinc-400 mt-3">
                        {project.description || "No description"}
                    </p>
                </div>

                <UploadBox projectId={project.id} />

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">Project Files</h2>
                    <div className="grid gap-4">
                        {documents?.map((doc) => (
                            <div
                                key={doc.id}
                                className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
                            >
                                <p className="font-medium">{doc.file_name}</p>
                                <p className="text-sm text-zinc-400">{doc.file_type}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <ProjectPromptBox projectId={project.id} />

                <section className="space-y-4">
                    <h2 className="text-xl font-semibold">Previous Analyses</h2>
                    <div className="space-y-4">
                        {generations?.map((gen) => (
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
                        ))}
                    </div>
                </section>
            </div>
        </main>
    );
}