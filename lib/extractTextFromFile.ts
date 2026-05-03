import mammoth from "mammoth";
import PDFParser from "pdf2json";

export async function extractTextFromFile(
    buffer: Buffer,
    fileType: string
): Promise<string> {
    // TXT
    if (fileType === "text/plain") {
        return buffer.toString("utf-8").trim();
    }

    // PDF
    if (fileType === "application/pdf") {
        return new Promise((resolve, reject) => {
            const pdfParser = new PDFParser();

            pdfParser.on("pdfParser_dataError", (err: { parserError: Error } | Error) => {
                reject(err instanceof Error ? err : err.parserError);
            });

            pdfParser.on("pdfParser_dataReady", (pdfData: {
                Pages: {
                    Texts: {
                        R: { T: string }[]
                    }[]
                }[]
            }) => {
                const text = pdfData.Pages.map((page) =>
                    page.Texts.map((t) =>
                        decodeURIComponent(t.R.map((r) => r.T).join(""))
                    ).join(" ")
                ).join("\n");

                resolve(text.trim());
            });

            pdfParser.parseBuffer(buffer);
        });
    }

    // DOCX
    if (
        fileType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
        const result = await mammoth.extractRawText({ buffer });
        return result.value?.trim() || "";
    }

    return "";
}