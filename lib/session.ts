import type { UserSessionData } from "@/types/auth";

const STORAGE_KEY = "nexora_auth_session";
const SESSION_COOKIE_NAME = "nexora_ui_session";
const PROFILE_COMPLETED_COOKIE = "nexora_profile_completed";
const LAST_LOGIN_AT_KEY = "nexora_last_login_at";

export function saveSession(session: UserSessionData, rememberMe: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  localStorage.setItem(LAST_LOGIN_AT_KEY, new Date().toISOString());

  const profileCompleted = session.profileCompleted === true ? "true" : "false";
  document.cookie = `${PROFILE_COMPLETED_COOKIE}=${profileCompleted}; Path=/; SameSite=Lax`;

  const expiresAt = new Date(session.accessTokenExpiresAt);
  if (Number.isNaN(expiresAt.getTime())) {
    document.cookie = `${SESSION_COOKIE_NAME}=1; Path=/; SameSite=Lax`;
    return;
  }

  if (!rememberMe) {
    document.cookie = `${SESSION_COOKIE_NAME}=1; Path=/; SameSite=Lax`;
    return;
  }

  const maxAgeSeconds = Math.max(60, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  document.cookie = `${SESSION_COOKIE_NAME}=1; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Lax`;
}

export function clearSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
  document.cookie = `${SESSION_COOKIE_NAME}=; Max-Age=0; Path=/; SameSite=Lax`;
  document.cookie = `${PROFILE_COMPLETED_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
}

export function getLastLoginAt(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(LAST_LOGIN_AT_KEY);
}

export function getSession(): UserSessionData | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as UserSessionData;
  } catch {
    return null;
  }
}
