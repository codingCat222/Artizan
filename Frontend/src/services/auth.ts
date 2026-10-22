import { api, refreshAccessToken, setAccessToken } from "../lib/api";
import type { Session } from "../store/AuthContext";

export const authApi = {
  async login(identifier: string, password: string): Promise<Session> {
    const data = await api<{ accessToken: string; user: Session }>("/auth/login", {
      method: "POST",
      auth: false,
      body: { identifier, password },
    });
    setAccessToken(data.accessToken);
    return data.user;
  },

  /** Restores a session on page load from the httpOnly refresh cookie. */
  async restore(): Promise<Session | null> {
    const token = await refreshAccessToken();
    if (!token) return null;
    const data = await api<{ user: Session }>("/auth/me");
    return data.user;
  },

  async me(): Promise<Session> {
    return (await api<{ user: Session }>("/auth/me")).user;
  },

  async logout(): Promise<void> {
    try {
      await api("/auth/logout", { method: "POST", auth: false });
    } finally {
      setAccessToken(null);
    }
  },

  forgotPassword: (email: string) =>
    api<{ message: string }>("/auth/forgot-password", { method: "POST", auth: false, body: { email } }),

  resetPassword: (token: string, password: string) =>
    api<{ message: string }>("/auth/reset-password", { method: "POST", auth: false, body: { token, password } }),

  activate: (token: string, password: string) =>
    api<{ message: string }>("/auth/activate", { method: "POST", auth: false, body: { token, password } }),

  changePassword: (currentPassword: string, newPassword: string) =>
    api<{ message: string }>("/auth/change-password", { method: "POST", body: { currentPassword, newPassword } }),
};