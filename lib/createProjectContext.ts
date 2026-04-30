type ProjectDocument = {
    file_name: string;
    extracted_text: string | null;
};

export function createProjectContext(documents: ProjectDocument[]) {
    const combined = documents
        .map((doc, index) => {
            return `Document ${index + 1}: ${doc.file_name}\n${doc.extracted_text || ""}`;
        })
        .join("\n\n----------------------\n\n");

    return combined.slice(0, 20000);
}