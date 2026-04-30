"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function ProjectPromptBox(projectId: { projectId: string }) {
    const router = useRouter()
    const [prompt, setPrompt] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [output, setOutput] = useState("")
    const handleAnalyze = async () => {
        if (!prompt.trim()) return

        setLoading(true)
        setError("")
        setOutput("")

        const res = await fetch("/app/api/analyze", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ projectId, prompt })
        })
        const data = await res.json()
        if (!res.ok) {
            setError(data.error || 'Analysis failed')
            setLoading(false)
            return
        }

        setOutput(data.generation.response)
        setLoading(false)
        router.refresh()
    }
    return (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
            <h2 className="text-xl font-semibold">Ask me about your project</h2>
            <textarea
                className="w-full min-h-[160px] rounded-xl bg-zinc-800 px-4 py-3 outline-none"
                placeholder="Ask anything"
                value={prompt}
                onChange={(e) => {
                    setPrompt(e.target.value)
                }}
            />
            <button
                className="rounded-lg bg-white text-black px-4 py-2 font-medium disabled:opacity-50"
                disabled={loading || !prompt.trim()}
                onClick={handleAnalyze}
            >
                {loading ? "...Analyzing" : "Analyze All Files"}
            </button>

            {error && <p className="text-sm text-red-400">{error}</p>}
            {output && (
                <div className="rounded-xl border border-zinc-800 p-4 whitespace-pre-wrap text-zinc-200">{output}</div>
            )}
        </div >
    )
}