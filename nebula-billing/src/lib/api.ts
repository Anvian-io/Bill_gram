import type { AdminAuthSession } from "@/lib/auth";

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/$/, "");

type ApiErrorPayload = {
  message?: string;
};

export type RequestOtpResponse = {
  message: string;
  otp?: string;
};

export type VerifyOtpResponse = {
  message: string;
  email: string;
  sessionToken: string;
  expiresAt: string;
  redirectUrl: string;
};

export type GeneratedTokenResponse = {
  message: string;
  token: {
    token: string;
    expiresAt: string;
    used: boolean;
    createdAt: string;
  };
};

export type RegisteredUser = {
  id: string;
  email: string;
  name: string;
  phoneNumber: string;
  createdAt: string;
  registeredBy: string;
  inviteToken: string;
};

type ListUsersResponse = {
  users: RegisteredUser[];
};

type RegisterUserPayload = {
  email: string;
  name: string;
  phoneNumber: string;
  token: string;
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  const data = (await response.json().catch(() => null)) as T & ApiErrorPayload | null;

  if (!response.ok) {
    throw new Error(data?.message ?? "Request failed");
  }

  return data as T;
};

const authHeaders = (auth: AdminAuthSession) => ({
  "x-admin-session-token": auth.sessionToken,
});

export const requestOtp = async (email: string) =>
  parseResponse<RequestOtpResponse>(
    await fetch(`${API_BASE}/auth/request-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    }),
  );

export const verifyOtp = async (email: string, otp: string) =>
  parseResponse<VerifyOtpResponse>(
    await fetch(`${API_BASE}/auth/verify-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, otp }),
    }),
  );

export const generateAdminToken = async (auth: AdminAuthSession, expiresInDays?: number) =>
  parseResponse<GeneratedTokenResponse>(
    await fetch(`${API_BASE}/admin/tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(auth),
      },
      body: JSON.stringify({ expiresInDays }),
    }),
  );

export const registerUser = async (auth: AdminAuthSession, payload: RegisterUserPayload) =>
  parseResponse<{ message: string; user: RegisteredUser }>(
    await fetch(`${API_BASE}/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(auth),
      },
      body: JSON.stringify(payload),
    }),
  );

export const getAllUsers = async (auth: AdminAuthSession) =>
  parseResponse<ListUsersResponse>(
    await fetch(`${API_BASE}/admin/users`, {
      headers: {
        ...authHeaders(auth),
      },
    }),
  );
