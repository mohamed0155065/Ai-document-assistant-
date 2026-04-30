import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { openai } from "@/lib/openai";
import { buildProjectContext } from "@/lib/build-project-context";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { projectId, prompt } = await req.json();

        if (!projectId || !prompt?.trim()) {
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
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const { data: documents, error: docsError } = await supabase
            .from("documents")
            .select("file_name, extracted_text")
            .eq("project_id", projectId)
            .eq("user_id", user.id);

        if (docsError) {
            return NextResponse.json({ error: docsError.message }, { status: 500 });
        }

        if (!documents || documents.length === 0) {
            return NextResponse.json(
                { error: "No documents found in this project" },
                { status: 400 }
            );
        }

        const projectContext = buildProjectContext(documents);

        const finalPrompt = `
You are an expert AI document analyst.

The user uploaded multiple documents inside one project.
Use only the provided project documents to answer.

User Prompt:
${prompt}

Project Documents:
${projectContext}
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content:
                        "You analyze multiple uploaded documents and answer only based on the provided content.",
                },
                {
                    role: "user",
                    content: finalPrompt,
                },
            ],
        });

        const response =
            completion.choices[0]?.message?.content || "No response generated.";

        const { data: generation, error: generationError } = await supabase
            .from("generations")
            .insert({
                user_id: user.id,
                project_id: projectId,
                prompt,
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
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Analysis failed",
            },
            { status: 500 }
        );
    }
}