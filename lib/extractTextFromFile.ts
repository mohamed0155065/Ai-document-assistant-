import pdfParse from "pdf-parse";
import mammoth from "mammoth";

export async function extractTextFromFile(file: File): Promise<string> {
    const buffer = Buffer.from(await file.arrayBuffer());

    if (file.type === "text/plain") {
        return buffer.toString("utf-8");
    }

    if (file.type === "application/pdf") {
        const data = await pdfParse(buffer);
        return data.text;
    }

    if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    }

    throw new Error(`Unsupported file type: ${file.type}`);
}

export async function extractTextFromFiles(files: File[]) {
    const settledResults = await Promise.allSettled(
        files.map(async (file) => {
            const extractedText = await extractTextFromFile(file);

            return {
                fileName: file.name,
                fileType: file.type,
                extractedText,
            };
        })
    );

    return settledResults.map((result, index) => {
        const file = files[index];

        if (result.status === "fulfilled") {
            return {
                success: true,
                fileName: result.value.fileName,
                fileType: result.value.fileType,
                extractedText: result.value.extractedText,
                error: null,
            };
        }

        return {
            success: false,
            fileName: file.name,
            fileType: file.type,
            extractedText: "",
            error: result.reason instanceof Error ? result.reason.message : "Unknown error",
        };
    });
}