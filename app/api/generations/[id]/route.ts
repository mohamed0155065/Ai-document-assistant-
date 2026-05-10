import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Extract the generation ID from the route params
        const { id } = await params;

        // Initialize the Supabase client
        const supabase = await createClient();

        // Make sure the request is coming from a logged-in user
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        // No session, no access
        if (userError || !user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Delete the generation, but only if it belongs to this user
        // The user_id check makes sure no one can delete someone else's data
        const { error } = await supabase
            .from("generations")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);

        // Something went wrong on the database side
        if (error) {
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        // Deleted successfully
        return NextResponse.json({ success: true });
    } catch (error) {
        // Catch anything unexpected and return a clean error message
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Delete failed" },
            { status: 500 }
        );
    }
}