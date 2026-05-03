'use client'
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
    const supabase = createClient();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
        } else {
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

            {/* Email */}
            <input
                type="email"
                className="w-full rounded-lg bg-zinc-800 px-4 py-3 outline-none"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            {/* Password */}
            <input
                type="password"
                className="w-full rounded-lg bg-zinc-800 px-4 py-3 outline-none"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            {/* Button */}
            <button
                disabled={loading}
                className="w-full rounded-lg bg-white text-black py-3 font-medium"
            >
                {loading ? "Signing in..." : "Login"}
            </button>

            {/* Error */}
            {error && <p className="text-sm text-red-400">{error}</p>}
        </form>
    );
}