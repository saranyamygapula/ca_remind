import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "__session";
const WORKSPACE_COOKIE = "__workspace";
const PUBLIC_PATHS = ["/login", "/signup"] as const;

interface JwtPayload {
  exp?: number;
  sub?: string;
  [key: string]: unknown;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function parseJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );
    const jsonStr = atob(padded);
    return JSON.parse(jsonStr) as JwtPayload;
  } catch {
    return null;
  }
}

function isAuthenticated(req: NextRequest): boolean {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;

  const payload = parseJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") {
    return false;
  }

  // Token exp is in seconds: check if not expired (with 10-second leeway)
  return payload.exp * 1000 > Date.now() - 10_000;
}

function hasReadyWorkspace(req: NextRequest): boolean {
  const cookie = req.cookies.get(WORKSPACE_COOKIE)?.value;
  if (!cookie) return false;
  try {
    const data = JSON.parse(decodeURIComponent(cookie));
    return !!data?.orgId && !!data?.businessId;
  } catch {
    return false;
  }
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

// ── Proxy Middleware ────────────────────────────────────────────────────────

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const authed = isAuthenticated(req);
  const rawCookie = req.cookies.get(SESSION_COOKIE)?.value;
  const workspaceReady = hasReadyWorkspace(req);

  // 1. Authenticated user attempting to visit login/signup/landing -> redirect to dashboard
  if (authed && (pathname === "/" || isPublicPath(pathname))) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 2. User with completed workspace trying to access onboarding -> redirect to dashboard
  if (
    authed &&
    workspaceReady &&
    (pathname === "/organization-create" || pathname === "/business-create")
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 3. Public landing page for unauthenticated visitors
  if (pathname === "/") {
    return NextResponse.next();
  }

  // 4. Unauthenticated user accessing protected route -> redirect to login with 'next' param
  if (!authed && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    const response = NextResponse.redirect(loginUrl);

    // If an invalid or expired cookie was present, clear it
    if (rawCookie) {
      response.cookies.delete(SESSION_COOKIE);
      response.cookies.delete(WORKSPACE_COOKIE);
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon/|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
