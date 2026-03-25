/**
 * Auth-Utilities für Server Components und Middleware.
 * Liest den plenium_session Cookie und gibt den Payload zurück.
 */

import { cookies } from "next/headers";

export interface SessionUser {
  userId: string;
  username: string;
  displayName: string;
  isAdmin: boolean;
  tanssToken: string;
  systemConfigId: string;
  /** Unix-Timestamp (Sekunden) des JWT-Ablaufs */
  exp?: number;
}

/**
 * Gibt den dekodierten JWT-Payload zurück oder null wenn kein/ungültiger Token.
 * Kein Signature-Check hier — Verifikation erfolgt serverseitig im Backend.
 * Nur für UI-Entscheidungen (Redirect, Anzeige) genutzt.
 */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("plenium_session")?.value;
  if (!token) return null;

  try {
    // JWT payload ist Base64URL-encoded im mittleren Teil
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1]!, "base64url").toString("utf-8")
    ) as SessionUser & { exp?: number };

    // Ablauf prüfen
    if (payload.exp && payload.exp * 1000 < Date.now()) return null;

    return { ...payload, exp: payload.exp };
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }
  return session!;
}
