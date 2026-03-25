import { request } from "./_base";

export interface SystemPublic {
  id: string;
  name: string;
  type: string;
  isDefault: boolean;
}

export interface LoginResult {
  success: boolean;
  user: {
    id: string;
    username: string;
    displayName: string | null;
    isAdmin: boolean;
  };
}

export interface MeResult {
  id: string;
  username: string;
  displayName: string | null;
  isAdmin: boolean;
  systemConfigId: string | null;
  modules: string[];
}

export const auth = {
  getSystems: () => request<SystemPublic[]>("/api/v1/settings/systems/public"),
  login: (body: { systemConfigId: string; username: string; password: string; otp: string }) =>
    request<LoginResult>("/api/v1/auth/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => request<{ success: boolean }>("/api/v1/auth/logout", { method: "POST" }),
  me: () => request<MeResult>("/api/v1/auth/me"),
};
