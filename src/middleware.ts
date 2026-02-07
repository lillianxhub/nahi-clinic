import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
    process.env.JWT_SECRET || "default-secret-key-change-me",
);

export async function middleware(request: NextRequest) {
    const token = request.cookies.get("auth_token")?.value;
    const { pathname } = request.nextUrl;

    // Public routes
    if (
        pathname === "/login" ||
        pathname === "/" ||
        pathname.startsWith("/api/auth")
    ) {
        if (token && (pathname === "/login" || pathname === "/")) {
            try {
                await jwtVerify(token, secret);
                return NextResponse.redirect(
                    new URL("/dashboard", request.url),
                );
            } catch (e) {
                // Token invalid, let them stay on login
            }
        }
        return NextResponse.next();
    }

    // Protected routes
    if (!token) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
        await jwtVerify(token, secret);
        return NextResponse.next();
    } catch (error) {
        return NextResponse.redirect(new URL("/login", request.url));
    }
}

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
