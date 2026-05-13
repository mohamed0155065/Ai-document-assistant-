import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {

    // Create an initial response object that will carry
    // updated cookies and session information
    let supabaseResponse = NextResponse.next({ request });

    // Initialize the Supabase server client
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {

                // Retrieve all cookies from the incoming request
                getAll() {
                    return request.cookies.getAll();
                },

                // Sync updated authentication cookies
                // between the request and the response
                setAll(cookiesToSet) {

                    // Update request cookies
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );

                    // Attach updated cookies to the response
                    // so the client receives the latest session state
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Fetch the currently authenticated user
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // =========================================
    // Protect dashboard routes
    // =========================================

    // If the user is not authenticated
    // and attempts to access the dashboard,
    // redirect them to the login page
    if (!user && request.nextUrl.pathname.startsWith("/auth/dashboard")) {

        const url = request.nextUrl.clone();
        url.pathname = "/auth/login";

        return NextResponse.redirect(url);
    }

    // =========================================
    // Prevent authenticated users from visiting
    // login or signup pages
    // =========================================

    // If the user is already authenticated,
    // redirect them to the dashboard instead
    if (
        user &&
        (
            request.nextUrl.pathname === "/auth/login" ||
            request.nextUrl.pathname === "/auth/signup"
        )
    ) {

        const url = request.nextUrl.clone();
        url.pathname = "/auth/dashboard";

        return NextResponse.redirect(url);
    }

    // Return the final response with the updated session
    return supabaseResponse;
}