// context/WorkspaceContext.tsx
"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { getOrganizations } from "@/services/organizationService";
import { getBusinesses } from "@/services/businessService";

type Status =
  | "loading"
  | "unauthenticated"
  | "error"
  | "no_org"
  | "no_business"
  | "ready";

interface WorkspaceContextType {
  status: Status;
  orgId: string | null;
  businessId: string | null;
  refresh: () => Promise<{ orgId: string | null; businessId: string | null }>;
}

const WORKSPACE_COOKIE = "__workspace";

function getInitialWorkspace(): {
  orgId: string | null;
  businessId: string | null;
} {
  if (typeof document === "undefined") {
    return { orgId: null, businessId: null };
  }
  try {
    const match = document.cookie.match(
      new RegExp(`(?:^|;\\s*)${WORKSPACE_COOKIE}=([^;]*)`)
    );
    if (match?.[1]) {
      const decoded = decodeURIComponent(match[1]);
      const data = JSON.parse(decoded);
      if (data?.orgId) {
        return {
          orgId: data.orgId,
          businessId: data.businessId ?? null,
        };
      }
    }
  } catch {
    // Ignore JSON parse errors and fallback to null
  }
  return { orgId: null, businessId: null };
}

function saveWorkspaceCookie(data: {
  orgId: string | null;
  businessId: string | null;
}) {
  if (typeof document === "undefined") return;
  if (!data.orgId) {
    document.cookie = `${WORKSPACE_COOKIE}=; Max-Age=0; Path=/; SameSite=Strict`;
    return;
  }
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const maxAge = 60 * 60 * 24 * 30; // 30 days
  document.cookie = `${WORKSPACE_COOKIE}=${encodeURIComponent(
    JSON.stringify(data)
  )}; Max-Age=${maxAge}; Path=/; SameSite=Strict${secure}`;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [ids, setIds] = useState<{
    orgId: string | null;
    businessId: string | null;
  }>(getInitialWorkspace);
  const [fetching, setFetching] = useState(false);
  const [fetchedUid, setFetchedUid] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const fetchWorkspace = useCallback(async () => {
    if (!user) {
      setIds({ orgId: null, businessId: null });
      setFetchedUid(null);
      setError(null);
      setFetching(false);
      saveWorkspaceCookie({ orgId: null, businessId: null });
      return { orgId: null, businessId: null };
    }

    setFetching(true);
    setError(null);

    try {
      const orgs = await getOrganizations();
      const org = Array.isArray(orgs) && orgs.length > 0 ? orgs[0] : null;
      let biz = null;
      if (org?.id) {
        const businesses = await getBusinesses(org.id);
        biz =
          Array.isArray(businesses) && businesses.length > 0
            ? businesses[0]
            : null;
      }
      const newIds = { orgId: org?.id ?? null, businessId: biz?.id ?? null };
      setIds(newIds);
      setFetchedUid(user.uid);
      saveWorkspaceCookie(newIds);
      return newIds;
    } catch (e) {
      setError(e as Error);
      return { orgId: null, businessId: null };
    } finally {
      setFetching(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIds({ orgId: null, businessId: null });
      setFetchedUid(null);
      saveWorkspaceCookie({ orgId: null, businessId: null });
      return;
    }
    fetchWorkspace();
  }, [authLoading, user, fetchWorkspace]);

  const refresh = useCallback(async () => {
    return await fetchWorkspace();
  }, [fetchWorkspace]);

  // If we already have a cached workspace with orgId and businessId, DO NOT block on "loading"
  const hasCached = !!ids.orgId && !!ids.businessId;
  const isResolving =
    !hasCached &&
    (authLoading || (!!user && (fetching || fetchedUid !== user.uid)));

  const status: Status = isResolving
    ? "loading"
    : !user
      ? "unauthenticated"
      : error && !hasCached
        ? "error"
        : !ids.orgId
          ? "no_org"
          : !ids.businessId
            ? "no_business"
            : "ready";

  return (
    <WorkspaceContext.Provider value={{ status, ...ids, refresh }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => {
  const ctx = useContext(WorkspaceContext);
  if (!ctx)
    throw new Error("useWorkspace must be used inside WorkspaceProvider");
  return ctx;
};
