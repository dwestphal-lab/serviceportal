import type { FastifyInstance } from "fastify";
import { requireAuth } from "../../core/auth-plugin.js";
import { buildApiBase } from "../auth/tanss.service.js";
import { prisma } from "@plenium/db";

// ── Typen für Ticket-Übersicht ─────────────────────────────────────────────────

interface TicketUebersichtRow {
  employeeId: string;
  tanssId: string;
  displayName: string | null;
  username: string;
  shortName: string | null;
  openTickets: number;
  overdueTickets: number;
  openCallbacks: number;
}

interface TicketUebersichtResponse {
  rows: TicketUebersichtRow[];
  totals: { openTickets: number; overdueTickets: number; openCallbacks: number };
}

interface SupportsQuery {
  from?: string;        // Unix-Timestamp (Sekunden), default: heute 00:00
  to?: string;          // Unix-Timestamp (Sekunden), default: heute 23:59
  employeeId?: string;  // TANSS-Employee-ID zum Filtern
}

export async function auswertungenRoutes(server: FastifyInstance) {

  // ── GET /api/v1/auswertungen/employees ────────────────────────────────────
  // Liefert alle importierten Mitarbeiter für den Filter-Dropdown.
  server.get(
    "/employees",
    { preHandler: requireAuth },
    async (request, reply) => {
      const users = await prisma.user.findMany({
        where: { isActive: true },
        select: {
          id: true,
          tanssId: true,
          username: true,
          displayName: true,
          shortName: true,
        },
        orderBy: { displayName: "asc" },
      });
      return reply.send(users);
    }
  );

  // ── GET /api/v1/auswertungen/supports ────────────────────────────────────
  // Holt alle Supports eines Tages aus TANSS (default: heute).
  // Query-Params: ?date=YYYY-MM-DD  &employeeId=<tanssId>
  server.get<{ Querystring: SupportsQuery }>(
    "/supports",
    {
      preHandler: requireAuth,
      schema: {
        querystring: {
          type: "object",
          properties: {
            from:       { type: "string" },
            to:         { type: "string" },
            employeeId: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      const { tanssToken, systemConfigId } = request.user;
      const { from: fromParam, to: toParam, employeeId } = request.query;

      const systemConfig = await prisma.systemConfig.findUnique({
        where: { id: systemConfigId },
        select: { baseUrl: true, useBackend: true },
      });
      if (!systemConfig) {
        return reply.status(400).send({ error: "SYSTEM_NOT_FOUND", message: "System-Config nicht gefunden." });
      }

      const apiBase = buildApiBase(systemConfig);

      // Zeitraum: direkte Unix-Timestamps oder Fallback auf heute
      let from: number;
      let to: number;
      if (fromParam && toParam) {
        from = Number(fromParam);
        to   = Number(toParam);
      } else {
        const now   = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(),  0,  0,  0);
        const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        from = Math.floor(start.getTime() / 1000);
        to   = Math.floor(end.getTime()   / 1000);
      }

      // TANSS erwartet PUT mit JSON-Body
      const tanssBody: Record<string, unknown> = {
        timeframe:    { from, to },
        planningTypes: ["SUPPORT"],
      };
      if (employeeId) {
        tanssBody.employees = [Number(employeeId)];
      }

      let supports: unknown[];
      let rawMeta: unknown = null;

      try {
        const res = await fetch(`${apiBase}/supports/list`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            apiToken: tanssToken,
          },
          body: JSON.stringify(tanssBody),
          signal: AbortSignal.timeout(20_000),
        });

        if (!res.ok) {
          const errorBody = await res.text().catch(() => "");
          return reply.status(502).send({
            error: "TANSS_ERROR",
            message: `TANSS /supports/list HTTP ${res.status}${errorBody ? `: ${errorBody.slice(0, 200)}` : ""}`,
          });
        }

        const data = (await res.json()) as Record<string, unknown>;
        rawMeta  = data?.meta   ?? null;
        const content  = data?.content ?? data;
        supports = Array.isArray(content) ? content : [];
      } catch (err) {
        const message = err instanceof Error ? err.message : "Verbindungsfehler";
        return reply.status(502).send({ error: "TANSS_UNREACHABLE", message });
      }

      return reply.send({
        from,
        to,
        count: supports.length,
        meta: rawMeta,
        supports,
      });
    }
  );

  // ── GET /api/v1/auswertungen/ticket-uebersicht ────────────────────────────
  // Zeigt pro Mitarbeiter: offene Tickets, überfällige Tickets, offene Rückrufe.
  server.get(
    "/ticket-uebersicht",
    { preHandler: requireAuth },
    async (request, reply) => {
      const { tanssToken, systemConfigId } = request.user;

      const systemConfig = await prisma.systemConfig.findUnique({
        where: { id: systemConfigId },
        select: { baseUrl: true, useBackend: true },
      });
      if (!systemConfig) {
        return reply.status(400).send({ error: "SYSTEM_NOT_FOUND", message: "System-Config nicht gefunden." });
      }

      const apiBase = buildApiBase(systemConfig);
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        apiToken: tanssToken,
      };

      // Mitarbeiter aus DB laden
      const employees = await prisma.user.findMany({
        where: { isActive: true },
        select: { id: true, tanssId: true, username: true, displayName: true, shortName: true },
        orderBy: { displayName: "asc" },
      });

      // Tickets (own + technician) und Rückrufe parallel laden —
      // dieselbe Methode wie tanssGetDashboardStats: nur offene Tickets, keine geschlossenen.
      const [ownRes, techRes, callbacksRes] = await Promise.allSettled([
        fetch(`${apiBase}/tickets/own?itemsPerPage=500&page=0`, {
          headers,
          signal: AbortSignal.timeout(20_000),
        }),
        fetch(`${apiBase}/tickets/technician?itemsPerPage=500&page=0`, {
          headers,
          signal: AbortSignal.timeout(20_000),
        }),
        fetch(`${apiBase}/callbacks`, {
          headers,
          signal: AbortSignal.timeout(10_000),
        }),
      ]);

      // Tickets aus beiden Endpoints zusammenführen (Duplikate via ID deduplizieren)
      const ticketsByEmployee = new Map<number, { open: number; overdue: number }>();
      const seenTicketIds = new Set<number>();
      const nowSec = Math.floor(Date.now() / 1000);

      async function processTicketResponse(res: PromiseSettledResult<Response>) {
        if (res.status !== "fulfilled" || !res.value.ok) return;
        try {
          const json = (await res.value.json()) as Record<string, unknown>;
          const tickets = (json?.content ?? []) as Array<Record<string, unknown>>;
          for (const t of tickets) {
            const ticketId = Number(t.id ?? 0);
            if (ticketId && seenTicketIds.has(ticketId)) continue;
            if (ticketId) seenTicketIds.add(ticketId);

            const empId = Number(t.assignedToEmployeeId ?? t.employeeId ?? 0);
            if (!empId) continue;

            const entry = ticketsByEmployee.get(empId) ?? { open: 0, overdue: 0 };
            entry.open++;
            // Überfällig: dueDate gesetzt und in der Vergangenheit (wie Dashboard)
            const due = t.dueDate as number | undefined;
            if (due && due > 0 && due < nowSec) entry.overdue++;
            ticketsByEmployee.set(empId, entry);
          }
        } catch { /* ignore parse errors */ }
      }

      await Promise.all([processTicketResponse(ownRes), processTicketResponse(techRes)]);

      // Rückrufe nach employeeId gruppieren
      const callbacksByEmployee = new Map<number, number>();
      if (callbacksRes.status === "fulfilled" && callbacksRes.value.ok) {
        try {
          const json = (await callbacksRes.value.json()) as Record<string, unknown>;
          const callbacks = (json?.content ?? []) as Array<Record<string, unknown>>;
          for (const cb of callbacks) {
            // TANSS-Feldnamen für zugewiesenen Techniker variieren
            const empId = Number(
              cb.assignedToEmployeeId ?? cb.employeeId ?? cb.technicianId ?? cb.responsibleEmployeeId ?? 0
            );
            if (!empId) continue;
            callbacksByEmployee.set(empId, (callbacksByEmployee.get(empId) ?? 0) + 1);
          }
        } catch { /* ignore */ }
      }

      // Zeilen aufbauen — nur Mitarbeiter mit mindestens 1 Eintrag oder alle
      const rows: TicketUebersichtRow[] = employees.map((emp) => {
        const tanssIdNum = Number(emp.tanssId);
        const tickets = ticketsByEmployee.get(tanssIdNum) ?? { open: 0, overdue: 0 };
        const callbacks = callbacksByEmployee.get(tanssIdNum) ?? 0;
        return {
          employeeId: emp.id,
          tanssId: emp.tanssId,
          displayName: emp.displayName,
          username: emp.username,
          shortName: emp.shortName,
          openTickets: tickets.open,
          overdueTickets: tickets.overdue,
          openCallbacks: callbacks,
        };
      });

      // Summenspalte
      const totals = rows.reduce(
        (acc, r) => ({
          openTickets:    acc.openTickets    + r.openTickets,
          overdueTickets: acc.overdueTickets + r.overdueTickets,
          openCallbacks:  acc.openCallbacks  + r.openCallbacks,
        }),
        { openTickets: 0, overdueTickets: 0, openCallbacks: 0 }
      );

      const result: TicketUebersichtResponse = { rows, totals };
      return reply.send(result);
    }
  );
}
