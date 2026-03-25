/**
 * TANSS API Client
 * Baut die API-URL aus SystemConfig und führt Requests mit dem gespeicherten Token aus.
 */

export interface TanssSystemConfig {
  baseUrl: string;
  useBackend: boolean;
}

export interface TanssLoginResponse {
  success: boolean;
  token?: string;
  userId?: string;
  username?: string;
  displayName?: string;
  error?: string;
}

export interface TanssTicketStats {
  openTickets: number;
  overdueTickets: number;
  openCallbacks: number;
}

/** Baut die API-Base-URL: {baseUrl}/backend/api/v1 oder {baseUrl}/api/v1 */
export function buildApiBase(config: TanssSystemConfig): string {
  const base = config.baseUrl.replace(/\/$/, "");
  return config.useBackend ? `${base}/backend/api/v1` : `${base}/api/v1`;
}

/** Login via TANSS Standard-API */
export async function tanssLogin(
  config: TanssSystemConfig,
  username: string,
  password: string,
  otp: string
): Promise<TanssLoginResponse> {
  const apiBase = buildApiBase(config);

  let response: Response;
  try {
    response = await fetch(`${apiBase}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, token: otp }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verbindungsfehler";
    return { success: false, error: `TANSS nicht erreichbar: ${message}` };
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      return { success: false, error: "Benutzername, Passwort oder OTP ungültig." };
    }
    return { success: false, error: `TANSS Fehler: HTTP ${response.status}` };
  }

  let data: Record<string, unknown>;
  try {
    data = (await response.json()) as Record<string, unknown>;
  } catch {
    return { success: false, error: "Ungültige TANSS-Antwort." };
  }

  // TANSS Response-Format: { meta: {...}, content: { apiKey, employeeId, ... } }
  const inner = (data?.content ?? data?.response ?? data) as Record<string, unknown>;
  const token = (inner?.apiKey ?? inner?.token ?? inner?.access_token) as string | undefined;
  const employeeId = inner?.employeeId ?? inner?.userId ?? inner?.id;
  const userId = employeeId != null ? String(employeeId) : username;

  if (!token) {
    console.error("[TANSS] Unbekannte Login-Response:", JSON.stringify(data));
    return { success: false, error: "Kein Token in TANSS-Antwort." };
  }

  // Vollständigen Namen über GET /api/v1/employees/{id} laden
  let displayName = username;
  if (employeeId) {
    displayName = await tanssGetEmployeeName(apiBase, token, Number(employeeId), username);
  }

  return { success: true, token, userId, username, displayName };
}

/** Lädt den Vollnamen eines Mitarbeiters via GET /api/v1/employees/{id} */
async function tanssGetEmployeeName(
  apiBase: string,
  token: string,
  employeeId: number,
  fallback: string
): Promise<string> {
  try {
    const res = await fetch(`${apiBase}/employees/${employeeId}`, {
      headers: { apiToken: token },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) return fallback;

    const data = (await res.json()) as Record<string, unknown>;
    const inner = (data?.content ?? data) as Record<string, unknown>;

    // Bevorzuge firstName + lastName, Fallback auf name-Feld ("Nachname, Vorname")
    const firstName = inner?.firstName as string | undefined;
    const lastName = inner?.lastName as string | undefined;
    if (firstName && lastName) return `${firstName} ${lastName}`;

    const name = inner?.name as string | undefined;
    if (name) {
      // TANSS liefert "Nachname, Vorname" — in "Vorname Nachname" umwandeln
      const parts = name.split(", ");
      if (parts.length === 2) return `${parts[1]} ${parts[0]}`;
      return name;
    }

    return fallback;
  } catch {
    return fallback;
  }
}

/** Holt Ticket-Statistiken für das Dashboard */
export async function tanssGetDashboardStats(
  config: TanssSystemConfig,
  tanssToken: string
): Promise<TanssTicketStats> {
  const apiBase = buildApiBase(config);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apiToken: tanssToken, // TANSS: "apiToken: Bearer ..."
  };

  // Eigene Tickets + Rückrufe parallel laden
  const [ownTicketsRes, callbacksRes] = await Promise.allSettled([
    fetch(`${apiBase}/tickets/own?itemsPerPage=500&page=0`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    }),
    fetch(`${apiBase}/callbacks`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    }),
  ]);

  // Tickets auswerten
  let openTickets = 0;
  let overdueTickets = 0;
  if (ownTicketsRes.status === "fulfilled" && ownTicketsRes.value.ok) {
    try {
      const json = (await ownTicketsRes.value.json()) as Record<string, unknown>;
      const tickets = (json?.content ?? []) as Array<Record<string, unknown>>;
      openTickets = tickets.length;

      // Überfällig = dueDate gesetzt und in der Vergangenheit (Unix-Timestamp in Sekunden)
      const nowSec = Math.floor(Date.now() / 1000);
      overdueTickets = tickets.filter((t) => {
        const due = t.dueDate as number | undefined;
        return due && due > 0 && due < nowSec;
      }).length;
    } catch {
      // ignore parse errors
    }
  }

  // Rückrufe auswerten
  let openCallbacks = 0;
  if (callbacksRes.status === "fulfilled" && callbacksRes.value.ok) {
    try {
      const json = (await callbacksRes.value.json()) as Record<string, unknown>;
      const callbacks = (json?.content ?? []) as unknown[];
      openCallbacks = callbacks.length;
    } catch {
      // ignore parse errors
    }
  }

  return { openTickets, overdueTickets, openCallbacks };
}
