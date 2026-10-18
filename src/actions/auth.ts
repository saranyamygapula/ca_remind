"use server";

import { cookies } from "next/headers";

const COOKIE_NAME = "__session";
const WORKSPACE_COOKIE = "__workspace";
const MAX_AGE_SECONDS = 60 * 60; // 1 hour – mirrors Firebase ID token lifetime
const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30; // 30 days for workspace persistence

/**
 * Server action to set the session token in an HttpOnly server cookie.
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

/**
 * Server action to set the workspace cookie (accessible for initial hydration and proxy).
 */
export async function setWorkspaceCookie(data: {
  orgId: string;
  businessId: string | null;
}): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(WORKSPACE_COOKIE, JSON.stringify(data), {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: THIRTY_DAYS_SECONDS,
  });
}

/**
 * Server action to clear the workspace cookie.
 */
export async function clearWorkspaceCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(WORKSPACE_COOKIE);
}

/**
 * Server action to clear the session and workspace cookies on logout.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  cookieStore.delete(WORKSPACE_COOKIE);
}

/**
 * Explicit aliases for setSessionToken / clearSessionToken
 */
export async function setSessionToken(token: string): Promise<void> {
  return setSessionCookie(token);
}

export async function clearSessionToken(): Promise<void> {
  return clearSessionCookie();
}
