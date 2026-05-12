'use client'
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function SignupForm() {
    // Client-side Supabase instance for browser auth
    const supabase = createClient()
    const router = useRouter()

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Success message shown briefly before redirecting
    const [message, setMessage] = useState("");

    const handleSignup = async (e: React.FormEvent) => {
        // Prevent native browser form submission
        e.preventDefault()
        setLoading(true)
        setError("")

        // Create a new account via Supabase Auth
        const { error } = await supabase.auth.signUp({ email, password })

        if (error) {
            // Show whatever Supabase returns — weak password, email already taken, etc.
            setError(error.message)
        } else {
            setMessage('Account created successfully')

            // Account created — send them to login to sign in
            router.push("/auth/dashboard")
        }

        setLoading(false)
    }

    return (
        <form
            onSubmit={handleSignup}
            className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 space-y-4"
        >
            <h1 className="text-2xl font-bold">Create account</h1>

            {/* Email input */}
            <input
                className="w-full rounded-lg bg-zinc-800 px-4 py-3 outline-none"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            {/* Password input */}
            <input
                className="w-full rounded-lg bg-zinc-800 px-4 py-3 outline-none"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            {/* Submit button — disabled while the request is in flight */}
            <button
                disabled={loading}
                className="w-full rounded-lg bg-white text-black py-3 font-medium"
            >
                {loading ? "Creating..." : "Sign up"}
            </button>

            {/* Success message — shown briefly before the redirect kicks in */}
            {message && <p className="text-sm text-zinc-400">{message}</p>}

            {/* Error message from Supabase */}
            {error && <p className="text-sm text-red-400">{error}</p>}
        </form>
    );
}