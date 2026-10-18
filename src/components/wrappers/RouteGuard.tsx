import { ReactNode } from "react";

/**
 * RouteGuard (Deprecated)
 * Routing and onboarding authorization is now handled directly by proxy.ts and WorkspaceContext cookies.
 * This component is maintained as a simple passthrough.
 */
export function RouteGuard({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
