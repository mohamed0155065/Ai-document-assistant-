'use client'
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function LogoutButton() {
    const router = useRouter()
    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
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