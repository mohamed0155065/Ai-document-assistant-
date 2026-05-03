import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { askAI } from "@/lib/ai";
import { createProjectContext } from "@/lib/createProjectContext";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json().catch(() => null);

        const projectId = body?.projectId;
        const prompt = body?.prompt;

        if (
            typeof projectId !== "string" ||
            typeof prompt !== "string" ||
            !projectId.trim() ||
            !prompt.trim()
        ) {
            return NextResponse.json(
                { error: "projectId and prompt are required" },
                { status: 400 }
            );
        }

        const { data: project, error: projectError } = await supabase
            .from("projects")
            .select("id")
            .eq("id", projectId)
            .eq("user_id", user.id)
            .single();

        if (projectError || !project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        const { data: documents, error: docsError } = await supabase
            .from("documents")
            .select("file_name, extracted_text")
            .eq("project_id", projectId)
            .eq("user_id", user.id);

        if (docsError) {
            return NextResponse.json(
                { error: docsError.message },
                { status: 500 }
            );
        }

        if (!documents || documents.length === 0) {
            return NextResponse.json(
                { error: "No documents found in this project" },
                { status: 400 }
            );
        }

        const projectContext = createProjectContext(documents);

        const finalPrompt = `
You are an expert AI document analyst.

Use ONLY the provided documents to answer.

User Question:
${prompt}

Documents:
${projectContext}
`;

        // 🔥 AI CALL
        const aiResponse = await askAI(finalPrompt);

        const response =
            typeof aiResponse === "string"
                ? aiResponse.trim()
                : "No response generated";

        const { data: generation, error: generationError } =
            await supabase
                .from("generations")
                .insert({
                    user_id: user.id,
                    project_id: projectId,
                    prompt: prompt.trim(),
                    response,
                })
                .select()
                .single();

        if (generationError) {
            return NextResponse.json(
                { error: generationError.message },
                { status: 500 }
            );
        }

        return NextResponse.json({ generation });
    } catch (error) {
        console.error("ANALYSIS ERROR:", error);

        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Analysis failed",
            },
            { status: 500 }
        );
    }
}