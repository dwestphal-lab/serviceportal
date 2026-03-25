// ============================================================
// PLENIUM — Shared TypeScript Types
// Wird von Frontend und Backend gemeinsam genutzt.
// ============================================================

// ── API Response Wrapper ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  meta?: ApiMeta;
}

export interface ApiMeta {
  total?: number;
  page?: number;
  pageSize?: number;
  hasNextPage?: boolean;
}

export interface ApiError {
  error: string;   // Fehlercode, z.B. "NOT_FOUND"
  message: string; // Menschenlesbare Nachricht
  details?: unknown;
}

// ── Health / Status ───────────────────────────────────────────────────────────

export interface HealthStatus {
  status: "ok" | "degraded" | "down";
  timestamp: string;
  version: string;
  uptime?: number;
}

// ── User ──────────────────────────────────────────────────────────────────────

export interface UserDto {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  createdAt: string;
}

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

// ── Module Registry ───────────────────────────────────────────────────────────
// Wird erweitert wenn Module hinzukommen.

export interface ModuleInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
}
