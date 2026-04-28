import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractTextFromFile } from "@/lib/extractTextFromFile";

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

        const formData = await req.formData();
        const projectId = formData.get("projectId") as string;
        const files = formData.getAll("files") as File[];

        if (!projectId) {
            return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
        }

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
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

        const allowedTypes = [
            "application/pdf",
            "text/plain",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

        const results = [];

        for (const file of files) {
            if (!allowedTypes.includes(file.type)) {
                return NextResponse.json(
                    { error: `Unsupported file type: ${file.name}` },
                    { status: 400 }
                );
            }

            if (file.size > 5 * 1024 * 1024) {
                return NextResponse.json(
                    { error: `File too large: ${file.name}` },
                    { status: 400 }
                );
            }

            const filePath = `${user.id}/${projectId}/${Date.now()}-${file.name}`;
            const fileBuffer = Buffer.from(await file.arrayBuffer());

            const { error: uploadError } = await supabase.storage
                .from("documents")
                .upload(filePath, fileBuffer, {
                    contentType: file.type,
                    upsert: false,
                });

            if (uploadError) {
                return NextResponse.json(
                    { error: uploadError.message },
                    { status: 500 }
                );
            }

            const extractedText = await extractTextFromFile(file);

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
                return NextResponse.json(
                    { error: insertError.message },
                    { status: 500 }
                );
            }

            results.push(data);
        }

        return NextResponse.json({ documents: results });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Upload failed" },
            { status: 500 }
        );
    }
}