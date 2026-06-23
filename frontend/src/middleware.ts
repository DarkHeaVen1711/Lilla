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

/** Decode the role claim from a JWT access token without verifying the signature. */
function getRoleFromToken(token: string): string {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return "customer";
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4) base64 += "=";
    const payload = JSON.parse(atob(base64));
    return payload.role ?? "customer";
  } catch {
    return "customer";
  }
}

export async function middleware(request: NextRequest) {
  let token = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const { pathname } = request.nextUrl;

  // ── Route definitions ────────────────────────────────────────────────────
  const customerRoutes = ["/account", "/checkout"];
  const managerRoutes = ["/manager"];   // accessible to manager + admin
  const adminRoutes = ["/admin"];       // accessible to admin only

  const isCustomerProtected = customerRoutes.some((r) => pathname.startsWith(r));
  const isManagerRoute = managerRoutes.some((r) => pathname.startsWith(r));
  const isAdminRoute = adminRoutes.some((r) => pathname.startsWith(r));
  const isProtected = isCustomerProtected || isManagerRoute || isAdminRoute;

  if (!isProtected) return NextResponse.next();

  // ── Token refresh ─────────────────────────────────────────────────────────
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
          token = access; // use the freshly minted token for role checks below
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
          // Fall through to role check with the new token
        }
      } catch (err) {
        console.error("Middleware refresh failed:", err);
      }
    }

    // If we still have no valid token, redirect to login
    if (!token || isTokenExpired(token)) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── Role guard ────────────────────────────────────────────────────────────
  const role = getRoleFromToken(token!);

  if (isAdminRoute && role !== "admin") {
    // Non-admins who manually navigate to /admin get redirected home
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isManagerRoute && role !== "manager" && role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/account/:path*",
    "/checkout/:path*",
    "/admin/:path*",
    "/manager/:path*",
  ],
};
