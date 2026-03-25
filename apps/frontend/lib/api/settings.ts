import { request } from "./_base";

export interface SystemConfig {
  id: string;
  name: string;
  type: string;
  baseUrl: string;
  useBackend: boolean;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserWithPermissions {
  id: string;
  username: string;
  displayName: string | null;
  isAdmin: boolean;
  modulePermissions: { moduleId: string; allowed: boolean }[];
}

export interface SystemConfigSetup {
  id: string;
  name: string;
  type: string;
  baseUrl: string;
  useBackend: boolean;
  isDefault: boolean;
}

export interface ModuleDefinition {
  id: string;
  name: string;
}

export interface TanssImportResult {
  imported: number;
  skipped: number;
  total: number;
}

export const setup = {
  getSystems: () => request<SystemConfigSetup[]>("/api/v1/settings/systems/setup"),
  createSystem: (body: { name: string; baseUrl: string; useBackend: boolean; isDefault?: boolean }) =>
    request<SystemConfigSetup>("/api/v1/settings/systems/setup", { method: "POST", body: JSON.stringify(body) }),
  updateSystem: (id: string, body: { name: string; baseUrl: string; useBackend: boolean; isDefault?: boolean }) =>
    request<SystemConfigSetup>(`/api/v1/settings/systems/setup/${id}`, { method: "PUT", body: JSON.stringify(body) }),
};

export const settings = {
  getSystems: () => request<SystemConfig[]>("/api/v1/settings/systems"),
  createSystem: (body: { name: string; baseUrl: string; useBackend: boolean; isDefault?: boolean }) =>
    request<SystemConfig>("/api/v1/settings/systems", { method: "POST", body: JSON.stringify(body) }),
  updateSystem: (id: string, body: { name: string; baseUrl: string; useBackend: boolean; isDefault?: boolean }) =>
    request<SystemConfig>(`/api/v1/settings/systems/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteSystem: (id: string) =>
    request<void>(`/api/v1/settings/systems/${id}`, { method: "DELETE" }),
  getModules: () => request<ModuleDefinition[]>("/api/v1/settings/modules"),
  getPermissions: () => request<UserWithPermissions[]>("/api/v1/settings/permissions"),
  setPermission: (body: { userId: string; moduleId: string; allowed: boolean }) =>
    request<unknown>("/api/v1/settings/permissions", { method: "POST", body: JSON.stringify(body) }),
  importFromTanss: () =>
    request<TanssImportResult>("/api/v1/settings/users/import-from-tanss", { method: "POST" }),
  setAdmin: (userId: string, isAdmin: boolean) =>
    request<{ id: string; username: string; isAdmin: boolean }>(
      `/api/v1/settings/users/${userId}/admin`,
      { method: "PUT", body: JSON.stringify({ isAdmin }) }
    ),
};
