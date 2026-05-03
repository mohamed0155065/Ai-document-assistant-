export async function askAI(prompt: string) {
    console.log("AI FUNCTION STARTED"); // للتأكد إن الدالة بتتندّه

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
        throw new Error("GROQ_API_KEY is missing in .env file");
    }

    try {
        const res = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: "llama-3.1-8b-instant",
                    messages: [
                        {
                            role: "user",
                            content: prompt,
                        },
                    ],
                }),
            }
        );

        console.log("STATUS:", res.status);

        const data = await res.json();

        console.log("FULL RESPONSE:", JSON.stringify(data, null, 2));

        if (!res.ok) {
            throw new Error(data?.error?.message || "Groq API error");
        }

        const result =
            data?.choices?.[0]?.message?.content ||
            data?.choices?.[0]?.text;

        return result || "No response generated";
    } catch (err) {
        console.log("FETCH ERROR:", err);
        throw err;
    }
}