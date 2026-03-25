/**
 * Server-Side API-Helper für Server Components und Layouts.
 * Leitet das Session-Cookie an das Backend weiter.
 */

import { cookies } from "next/headers";
import type { MeResult } from "./api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function serverFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("plenium_session")?.value;

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(session ? { Cookie: `plenium_session=${session}` } : {}),
        ...options.headers,
      },
      cache: "no-store",
    });

    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

/** Holt die aktuellen Modul-Berechtigungen des eingeloggten Users. */
export async function getUserModules(): Promise<string[]> {
  const me = await serverFetch<MeResult>("/api/v1/auth/me");
  return me?.modules ?? [];
}
