import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import LogoutButton from "@/components/auth/logout-button";

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect("/login")
    }
    return (
        <main className="min-h-screen bg-zinc-950 text-white p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Dashboard</h1>
                        <p className="text-zinc-400 mt-2">Welcome, {user.email}</p>
                    </div>
                    <LogoutButton />
                </div>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                    <p className="text-zinc-300">
                        You are now logged in. Next step: uploading and analyzing documents.
                    </p>
                </div>
            </div>
        </main>
    )
}