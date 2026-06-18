import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) {
      base64 += "=";
    }
    const payload = JSON.parse(atob(base64));
    const exp = payload.exp;
    if (!exp) return true;
    return Date.now() >= exp * 1000 - 10000;
  } catch {
    return true;
  }
}

export async function middleware(request: NextRequest) {
  let token = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const { pathname } = request.nextUrl;

  const protectedRoutes = ["/account", "/checkout"];
  const isProtected = protectedRoutes.some(route => pathname.startsWith(route));

  if (isProtected) {
    const isExpired = token ? isTokenExpired(token) : true;

    if (isExpired) {
      if (refreshToken) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/auth/token/refresh/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh: refreshToken }),
          });

          if (res.ok) {
            const { access, refresh } = await res.json();
            const response = NextResponse.next();
            response.cookies.set("access_token", access, {
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "strict",
              path: "/",
              maxAge: 60 * 60 * 24 * 7,
            });
            if (refresh) {
              response.cookies.set("refresh_token", refresh, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                path: "/",
                maxAge: 60 * 60 * 24 * 30,
              });
            }
            return response;
          }
        } catch (err) {
          console.error("Middleware refresh failed:", err);
        }
      }

      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/checkout/:path*"],
};
