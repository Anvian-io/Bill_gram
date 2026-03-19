export type AdminAuthSession = {
  email: string;
  sessionToken: string;
  expiresAt: string;
};

const ADMIN_AUTH_STORAGE_KEY = "nebula_admin_auth";

export const getStoredAdminAuth = (): AdminAuthSession | null => {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(ADMIN_AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as AdminAuthSession;
    if (!parsed?.email || !parsed?.sessionToken || !parsed?.expiresAt) {
      window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
      return null;
    }

    if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
      window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
    return null;
  }
};

export const setStoredAdminAuth = (session: AdminAuthSession) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, JSON.stringify(session));
};

export const clearStoredAdminAuth = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
};

export const isAdminAuthenticated = () => Boolean(getStoredAdminAuth());
