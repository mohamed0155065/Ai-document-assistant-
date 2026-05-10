'use client'
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
    // Client-side Supabase instance for browser auth
    const supabase = createClient();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        // Prevent the form from doing a native browser submit
        e.preventDefault();
        setLoading(true);
        setError("");

        // Attempt to sign in with email and password via Supabase Auth
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            // Show the error from Supabase directly — wrong password, unconfirmed email, etc.
            setError(error.message);
        } else {
            // Login succeeded — go to the dashboard
            // router.refresh() syncs the server session so protected pages don't redirect back
            router.push("/auth/dashboard");
            router.refresh();
        }

        setLoading(false);
    };

    return (
        <form
            onSubmit={handleLogin}
            className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 space-y-4"
        >
            <h1 className="text-2xl font-bold">Welcome back</h1>

            {/* Email input */}
            <input
                type="email"
                className="w-full rounded-lg bg-zinc-800 px-4 py-3 outline-none"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            {/* Password input */}
            <input
                type="password"
                className="w-full rounded-lg bg-zinc-800 px-4 py-3 outline-none"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            {/* Submit button — disabled while the request is in flight */}
            <button
                disabled={loading}
                className="w-full rounded-lg bg-white text-black py-3 font-medium"
            >
                {loading ? "Signing in..." : "Login"}
            </button>

            {/* Error message from Supabase — wrong credentials, unverified email, etc. */}
            {error && <p className="text-sm text-red-400">{error}</p>}
        </form>
    );
}