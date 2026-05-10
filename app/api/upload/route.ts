import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractTextFromFile } from "@/lib/extractTextFromFile";

// Only these file types are allowed through
const ALLOWED_TYPES = [
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Hard limit of 5MB per file
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(req: Request) {
    try {
        // Initialize the Supabase client
        const supabase = await createClient();

        // Make sure the request is coming from a logged-in user
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        // No session, no access
        if (userError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Parse the incoming form data
        const formData = await req.formData();
        const projectId = formData.get("projectId");
        const rawFiles = formData.getAll("files");

        // Project ID is required to know where to attach the documents
        if (!projectId || typeof projectId !== "string") {
            return NextResponse.json(
                { error: "Project ID is required" },
                { status: 400 }
            );
        }

        // Filter out anything that is not an actual File object
        const files = rawFiles.filter((f): f is File => f instanceof File);

        // Nothing to upload
        if (files.length === 0) {
            return NextResponse.json(
                { error: "No files uploaded" },
                { status: 400 }
            );
        }

        // Confirm the project exists and belongs to this user
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

        // This will hold the successfully uploaded documents to return at the end
        const results = [];

        for (const file of files) {
            // Reject unsupported file types before doing any processing
            if (!ALLOWED_TYPES.includes(file.type)) {
                return NextResponse.json(
                    { error: `Unsupported file type: ${file.name}` },
                    { status: 400 }
                );
            }

            // Reject files that exceed the size limit
            if (file.size > MAX_FILE_SIZE) {
                return NextResponse.json(
                    { error: `File too large: ${file.name}` },
                    { status: 400 }
                );
            }

            // Sanitize the file name to avoid path issues in storage
            const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "-");

            // Build a unique storage path per user, project, and timestamp
            const filePath = `${user.id}/${projectId}/${Date.now()}-${safeFileName}`;

            // Read the file into memory once and reuse the buffer for both extraction and upload
            const fileBuffer = Buffer.from(await file.arrayBuffer());

            // Try to extract readable text from the file for AI context later
            let extractedText = "";
            try {
                extractedText = await extractTextFromFile(fileBuffer, file.type);
            } catch (err) {
                // If extraction fails, we continue with an empty string rather than blocking the upload
                console.error("EXTRACTION ERROR:", err);
                extractedText = "";
            }

            // Upload the raw file to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from("documents")
                .upload(filePath, fileBuffer, {
                    contentType: file.type,
                    upsert: false, // Never overwrite an existing file at the same path
                });

            if (uploadError) {
                console.error("UPLOAD ERROR:", uploadError);
                return NextResponse.json(
                    { error: uploadError.message },
                    { status: 500 }
                );
            }

            // Save the document metadata and extracted text to the database
            const { data, error: insertError } = await supabase
                .from("documents")
                .insert({
                    user_id: user.id,
                    project_id: projectId,
                    file_name: file.name,
                    file_path: filePath,
                    file_type: file.type,
                    extracted_text: extractedText,
                })
                .select()
                .single();

            if (insertError) {
                console.error("DB INSERT ERROR:", insertError);
                return NextResponse.json(
                    { error: insertError.message },
                    { status: 500 }
                );
            }

            // Document processed successfully, add it to the results
            results.push(data);
        }

        // All files uploaded and saved, return the full list
        return NextResponse.json({
            documents: results,
        });

    } catch (error) {
        // Catch anything unexpected and return a clean error message
        console.error("UPLOAD ROUTE FATAL ERROR:", error);
        return NextResponse.json(
            {
                error:
                    error instanceof Error
                        ? error.message
                        : "Upload failed",
            },
            { status: 500 }
        );
    }
}