import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center space-y-6 max-w-2xl px-6">
        <h1 className="text-5xl font-bold">AI Multi-File Project Analyzer</h1>

        <p className="text-zinc-400">
          Create projects, upload multiple files, and ask AI to analyze all files
          inside a project using your custom prompt.
        </p>

        <div className="flex gap-4 justify-center">
          {user ? (
            <Link
              href="/auth/dashboard"
              className="px-6 py-3 rounded-xl bg-white text-black font-medium"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="px-6 py-3 rounded-xl bg-white text-black font-medium"
              >
                Login
              </Link>
              <Link
                href="/auth/signup"
                className="px-6 py-3 rounded-xl border border-zinc-700"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  );
}