import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold">AI Document Assistant</h1>
        <p className="mt-4 text-zinc-400">
          Current user: {user ? user.email : "No user logged in"}
        </p>
      </div>
    </main>
  );
}