'use client'
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function LogoutButton() {
    const router = useRouter()

    const handleLogout = async () => {
        const supabase = createClient()

        // Clear the user's session from Supabase Auth
        await supabase.auth.signOut()

        // Redirect to login, then refresh so the server drops the old session cookie
        router.push("/login")
        router.refresh()
    }

    return (
        <button onClick={handleLogout}
            className="rounded-lg border border-zinc-700 px-4 py-2">
            Logout
        </button>
    )
}