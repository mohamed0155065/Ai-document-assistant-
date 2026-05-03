'use client'
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"


export default function SignupForm() {
    const supabase = createClient()
    const router = useRouter()

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        const { error } = await supabase.auth.signUp({ email, password, })
        if (error) {
            setError(error.message)
        }
        else {
            setMessage('Account created successfully ')
            router.push("/login");

        }
        setLoading(false)
    }
    return (
        <form
            onSubmit={handleSignup}
            className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 space-y-4"
        >
            <h1 className="text-2xl font-bold">Create account</h1>

            <input
                className="w-full rounded-lg bg-zinc-800 px-4 py-3 outline-none"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            <input
                className="w-full rounded-lg bg-zinc-800 px-4 py-3 outline-none"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            <button
                disabled={loading}
                className="w-full rounded-lg bg-white text-black py-3 font-medium"
            >
                {loading ? "Creating..." : "Sign up"}
            </button>

            {message && <p className="text-sm text-zinc-400">{message}</p>}
        </form>
    );
}