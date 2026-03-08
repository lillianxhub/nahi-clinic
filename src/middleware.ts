import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const { pathname } = req.nextUrl;

        // Redirect from login or root if already authenticated
        if (token && (pathname === "/login" || pathname === "/")) {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const { pathname } = req.nextUrl;
                // Public routes that don't need authentication for access
                // Note: / (root) and /login are handled in the middleware function above if authenticated
                if (
                    pathname === "/login" ||
                    pathname === "/" ||
                    pathname.startsWith("/api/auth")
                ) {
                    return true;
                }
                // Return true if authenticated
                return !!token;
            },
        },
    },
);

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
