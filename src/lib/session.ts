"use server";

import {
  setSessionCookie as setAction,
  clearSessionCookie as clearAction,
  setSessionToken as setTokenAction,
  clearSessionToken as clearTokenAction,
  setWorkspaceCookie as setWorkspaceAction,
  clearWorkspaceCookie as clearWorkspaceAction,
} from "@/actions/auth";

export async function setSessionCookie(token: string): Promise<void> {
  return setAction(token);
}

export async function clearSessionCookie(): Promise<void> {
  return clearAction();
}

export async function setSessionToken(token: string): Promise<void> {
  return setTokenAction(token);
}

export async function clearSessionToken(): Promise<void> {
  return clearTokenAction();
}

export async function setWorkspaceCookie(data: {
  orgId: string;
  businessId: string | null;
}): Promise<void> {
  return setWorkspaceAction(data);
}

export async function clearWorkspaceCookie(): Promise<void> {
  return clearWorkspaceAction();
}
