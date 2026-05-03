import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CreateProjectForm from "@/components/porjects/create-project-form";
import UploadBox from "@/components/upload/upload-box";
import ProjectPromptBox from "@/components/ai/project-prompt-box";
import GenerationsList from "@/components/ai/generations";
import Generations from "@/components/ai/generations";

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ project?: string }>;
}) {
    const { project: selectedProjectIdFromUrl } = await searchParams;

    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (projectsError) {
        console.error(projectsError.message);
    }

    const selectedProject =
        projects?.find((p) => p.id === selectedProjectIdFromUrl) ||
        projects?.[0] ||
        null;

    let documents: any[] = [];
    let generations: any[] = [];

    if (selectedProject) {
        const { data: docs, error: docsError } = await supabase
            .from("documents")
            .select("*")
            .eq("project_id", selectedProject.id)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        const { data: gens, error: gensError } = await supabase
            .from("generations")
            .select("*")
            .eq("project_id", selectedProject.id)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (docsError) console.error(docsError.message);
        if (gensError) console.error(gensError.message);

        documents = docs || [];
        generations = gens || [];
    }

    const getFileIcon = (type: string) => {
        if (type === "application/pdf") return "📄";
        if (type === "text/plain") return "📝";
        return "📃";
    };

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });

    return (
        <main className="min-h-screen bg-black text-white">
            <div className="flex flex-col lg:flex-row min-h-screen">

                {/* Sidebar */}
                <aside className="w-full lg:w-80 xl:w-96 shrink-0 border-b lg:border-b-0
                    lg:border-r border-zinc-800 bg-zinc-950 p-4 sm:p-5
                    space-y-6 lg:min-h-screen lg:sticky lg:top-0 lg:overflow-y-auto">

                    {/* Logo / Title */}
                    <div className="space-y-1">
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                            AI Dashboard
                        </h1>
                        <p className="text-xs sm:text-sm text-zinc-400">
                            Create projects, upload files, and analyze with AI.
                        </p>
                    </div>

                    {/* Create Project */}
                    <CreateProjectForm />

                    {/* Projects List */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                                Projects
                            </h2>
                            {projects && (
                                <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">
                                    {projects.length}
                                </span>
                            )}
                        </div>

                        <div className="space-y-2 max-h-64 lg:max-h-none overflow-y-auto pr-1">
                            {projects && projects.length > 0 ? (
                                projects.map((project) => {
                                    const active = selectedProject?.id === project.id;
                                    return (
                                        <Link
                                            key={project.id}
                                            href={`/auth/dashboard?project=${project.id}`}
                                            className={`block rounded-xl border p-3 sm:p-4
                                                transition-all duration-150 ${active
                                                    ? "border-white bg-zinc-800"
                                                    : "border-zinc-800 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800/60"
                                                }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                {active && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                                                )}
                                                <p className="font-medium text-sm truncate">
                                                    {project.title}
                                                </p>
                                            </div>
                                            {project.description && (
                                                <p className="text-xs text-zinc-500 mt-1 line-clamp-1 pl-3.5">
                                                    {project.description}
                                                </p>
                                            )}
                                        </Link>
                                    );
                                })
                            ) : (
                                <div className="rounded-xl border border-dashed border-zinc-800
                                    p-4 text-center text-zinc-500 text-sm">
                                    No projects yet.
                                </div>
                            )}
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <section className="flex-1 bg-zinc-950 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    {!selectedProject ? (
                        <div className="max-w-2xl mx-auto h-full flex flex-col
                            items-center justify-center py-24 text-center space-y-4">

                            <h2 className="text-2xl sm:text-3xl font-bold">
                                Start your first project
                            </h2>
                            <p className="text-zinc-400 text-sm sm:text-base max-w-md">
                                Create a project from the sidebar, upload your files,
                                and let AI analyze them for you.
                            </p>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">

                            {/* Project Header */}
                            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:p-6">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <h2 className="text-2xl sm:text-3xl font-bold truncate">
                                            {selectedProject.title}
                                        </h2>
                                        {selectedProject.description && (
                                            <p className="text-zinc-400 mt-2 text-sm sm:text-base">
                                                {selectedProject.description}
                                            </p>
                                        )}
                                    </div>
                                    <div className="shrink-0 text-xs text-zinc-600 mt-1 hidden sm:block">
                                        {formatDate(selectedProject.created_at)}
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="flex gap-6 mt-4 pt-4 border-t border-zinc-800">
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-white">
                                            {documents.length}
                                        </p>
                                        <p className="text-xs text-zinc-500">Files</p>
                                    </div>
                                    <div className="w-px bg-zinc-800" />
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-white">
                                            {generations.length}
                                        </p>
                                        <p className="text-xs text-zinc-500">Analyses</p>
                                    </div>
                                </div>
                            </div>

                            {/* Upload Box */}
                            <UploadBox projectId={selectedProject.id} />

                            {/* AI Prompt Box */}
                            <ProjectPromptBox projectId={selectedProject.id} />

                            {/* Uploaded Files */}
                            <section className="space-y-4">
                                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                                    📎 Uploaded Files
                                    <span className="text-xs font-normal text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                                        {documents.length}
                                    </span>
                                </h3>

                                {documents.length > 0 ? (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {documents.map((doc) => (
                                            <div
                                                key={doc.id}
                                                className="flex items-center gap-3 rounded-xl
                                                    border border-zinc-800 bg-zinc-900 p-4
                                                    hover:border-zinc-700 transition-colors"
                                            >
                                                <span className="text-2xl shrink-0">
                                                    {getFileIcon(doc.file_type)}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-sm truncate">
                                                        {doc.file_name}
                                                    </p>
                                                    <p className="text-xs text-zinc-500 mt-0.5">
                                                        {formatDate(doc.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-dashed border-zinc-800
                                        p-6 text-center text-zinc-500 text-sm">
                                        No files uploaded yet. Upload a file to get started.
                                    </div>
                                )}
                            </section>

                            {/* Generations List */}
                            <Generations generations={generations} />

                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}