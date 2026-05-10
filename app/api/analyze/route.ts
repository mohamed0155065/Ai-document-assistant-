import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { askAI } from "@/lib/ai";
import { createProjectContext } from "@/lib/createProjectContext";

export async function POST(req: Request) {
    try {
        // Initialize Supabase client to interact with the database
        const supabase = await createClient();

        // Verify the user's identity through their session
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        // If no user or auth error → return 401 immediately, no further processing
        if (userError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Safely parse the request body — returns null instead of throwing if malformed
        const body = await req.json().catch(() => null);

        const projectId = body?.projectId;
        const prompt = body?.prompt;

        // Validate that both projectId and prompt exist and are non-empty strings
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

        // Verify the project actually belongs to this user (authorization, not just authentication)
        const { data: project, error: projectError } = await supabase
            .from("projects")
            .select("id")
            .eq("id", projectId)
            .eq("user_id", user.id) // ownership check at the DB level, no data leaks
            .single();

        if (projectError || !project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        // Fetch all documents linked to this project
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

        // No documents found — nothing to analyze, stop early
        if (!documents || documents.length === 0) {
            return NextResponse.json(
                { error: "No documents found in this project" },
                { status: 400 }
            );
        }

        // Transform documents into a structured text context for the AI
        const projectContext = createProjectContext(documents);

        // Build the final prompt — AI is strictly constrained to the provided documents only
        const finalPrompt = `
You are an expert AI document analyst.

Use ONLY the provided documents to answer.

User Question:
${prompt}

Documents:
${projectContext}
`;

        //  Call the AI with the fully constructed prompt
        const aiResponse = await askAI(finalPrompt);

        // If response isn't a string, fall back to a safe default instead of crashing
        const response =
            typeof aiResponse === "string"
                ? aiResponse.trim()
                : "No response generated";

        // Persist the generation to the database for history and auditing
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

        // Everything went well → return the saved generation to the client
        return NextResponse.json({ generation });
    } catch (error) {
        // Global catch — handles any unexpected runtime errors gracefully
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