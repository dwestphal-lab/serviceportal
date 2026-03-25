import { request } from "./_base";

export interface AuswertungEmployee {
  id: string;
  tanssId: string;
  username: string;
  displayName: string | null;
  shortName: string | null;
}

export interface SupportsResponse {
  from: number;
  to: number;
  count: number;
  meta: unknown;
  supports: unknown[];
}

export interface TicketUebersichtRow {
  employeeId: string;
  tanssId: string;
  displayName: string | null;
  username: string;
  shortName: string | null;
  openTickets: number;
  overdueTickets: number;
  openCallbacks: number;
}

export interface TicketUebersichtResponse {
  rows: TicketUebersichtRow[];
  totals: { openTickets: number; overdueTickets: number; openCallbacks: number };
}

export const auswertungen = {
  getEmployees: () =>
    request<AuswertungEmployee[]>("/api/v1/auswertungen/employees"),
  getSupports: (params?: { from?: number; to?: number; employeeId?: string }) => {
    const qs = new URLSearchParams();
    if (params?.from != null) qs.set("from", String(params.from));
    if (params?.to   != null) qs.set("to",   String(params.to));
    if (params?.employeeId)   qs.set("employeeId", params.employeeId);
    const query = qs.toString() ? `?${qs.toString()}` : "";
    return request<SupportsResponse>(`/api/v1/auswertungen/supports${query}`);
  },
  getTicketUebersicht: () =>
    request<TicketUebersichtResponse>("/api/v1/auswertungen/ticket-uebersicht"),
};
