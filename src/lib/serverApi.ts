import { cookies } from "next/headers";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const SESSION_COOKIE = "__session";
const WORKSPACE_COOKIE = "__workspace";

/**
 * Retrieves the session token from server-side cookies.
 */
export async function getServerToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value;
}

/**
 * Retrieves the workspace IDs (orgId, businessId) from server-side cookies.
 */
export async function getServerWorkspace(): Promise<{
  orgId: string | null;
  businessId: string | null;
}> {
  const cookieStore = await cookies();
  const val = cookieStore.get(WORKSPACE_COOKIE)?.value;
  if (!val) return { orgId: null, businessId: null };
  try {
    const data = JSON.parse(decodeURIComponent(val));
    return {
      orgId: data?.orgId ?? null,
      businessId: data?.businessId ?? null,
    };
  } catch {
    return { orgId: null, businessId: null };
  }
}

/**
 * Server-side HTTP fetcher for Next.js Server Components, Server Actions, and Route Handlers.
 * Automatically injects the Authorization Bearer token from the HttpOnly session cookie.
 */
export async function serverFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = await getServerToken();

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const headers = new Headers(options?.headers);

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (
    !headers.has("Content-Type") &&
    options?.body &&
    typeof options.body === "string"
  ) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `API request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData?.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // Fallback to response statusText if JSON parsing fails
      if (response.statusText) {
        errorMessage = response.statusText;
      }
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json() as Promise<T>;
}

export const serverApi = {
  get: <T>(endpoint: string, init?: RequestInit) =>
    serverFetch<T>(endpoint, { ...init, method: "GET" }),

  post: <T>(endpoint: string, data?: unknown, init?: RequestInit) =>
    serverFetch<T>(endpoint, {
      ...init,
      method: "POST",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: unknown, init?: RequestInit) =>
    serverFetch<T>(endpoint, {
      ...init,
      method: "PUT",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: unknown, init?: RequestInit) =>
    serverFetch<T>(endpoint, {
      ...init,
      method: "PATCH",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, init?: RequestInit) =>
    serverFetch<T>(endpoint, { ...init, method: "DELETE" }),
};
