import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractTextFromFile } from "@/lib/extractTextFromFile";

const ALLOWED_TYPES = [
    "application/pdf",
    "text/plain",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

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

        const formData = await req.formData();
        const projectId = formData.get("projectId");
        const rawFiles = formData.getAll("files");

        if (!projectId || typeof projectId !== "string") {
            return NextResponse.json(
                { error: "Project ID is required" },
                { status: 400 }
            );
        }

        const files = rawFiles.filter((f): f is File => f instanceof File);

        if (files.length === 0) {
            return NextResponse.json(
                { error: "No files uploaded" },
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

        const results = [];

        for (const file of files) {
            if (!ALLOWED_TYPES.includes(file.type)) {
                return NextResponse.json(
                    { error: `Unsupported file type: ${file.name}` },
                    { status: 400 }
                );
            }

            if (file.size > MAX_FILE_SIZE) {
                return NextResponse.json(
                    { error: `File too large: ${file.name}` },
                    { status: 400 }
                );
            }

            const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "-");
            const filePath = `${user.id}/${projectId}/${Date.now()}-${safeFileName}`;

            // ✅ اقرأ الـ buffer مرة واحدة بس
            const fileBuffer = Buffer.from(await file.arrayBuffer());

            // ✅ Extract text
            let extractedText = "";
            try {
                extractedText = await extractTextFromFile(fileBuffer, file.type);
            } catch (err) {
                console.error("EXTRACTION ERROR:", err);
                extractedText = "";
            }

            // Upload to Storage
            const { error: uploadError } = await supabase.storage
                .from("documents")
                .upload(filePath, fileBuffer, {
                    contentType: file.type,
                    upsert: false,
                });

            if (uploadError) {
                console.error("UPLOAD ERROR:", uploadError);
                return NextResponse.json(
                    { error: uploadError.message },
                    { status: 500 }
                );
            }

            // Insert into DB
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

            results.push(data);
        }

        return NextResponse.json({
            documents: results,
        });

    } catch (error) {
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