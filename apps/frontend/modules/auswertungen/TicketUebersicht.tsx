"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Loader2, AlertCircle, Ticket, Clock, PhoneCall, Users } from "lucide-react";
import { auswertungen, type TicketUebersichtRow, type TicketUebersichtResponse } from "@/lib/api";

// ── Hilfsfunktionen ────────────────────────────────────────────────────────────

function displayName(row: TicketUebersichtRow): string {
  if (row.displayName) return row.displayName;
  return row.username;
}

// ── Hauptkomponente ────────────────────────────────────────────────────────────

export function TicketUebersicht() {
  const [data, setData]       = useState<TicketUebersichtResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await auswertungen.getTicketUebersicht();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Daten konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Zeilen sortieren: erst überfällige, dann offene Tickets (absteigende Gesamtlast)
  const sortedRows = data
    ? [...data.rows].sort(
        (a, b) =>
          (b.overdueTickets * 3 + b.openTickets + b.openCallbacks) -
          (a.overdueTickets * 3 + a.openTickets + a.openCallbacks)
      )
    : [];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">

      {/* Header-Leiste */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#737373]">
          Echtzeit-Übersicht aller Mitarbeiter — Tickets und Rückrufe aus TANSS
        </p>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-[#d4d0c7] rounded-lg bg-white text-[#737373] hover:text-[#0a322d] hover:border-[#1e7378] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Aktualisieren
        </button>
      </div>

      {/* Fehler */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Fehler beim Laden</p>
            <p className="text-xs mt-0.5 font-mono">{error}</p>
          </div>
        </div>
      )}

      {/* Laden */}
      {loading && !data && (
        <div className="flex items-center justify-center py-20 text-[#737373]">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Lade Ticket-Übersicht aus TANSS…
        </div>
      )}

      {/* Inhalt */}
      {data && (
        <>
          {/* Summen-Kacheln */}
          <div className="grid grid-cols-3 gap-3">
            <SumCard
              icon={<Ticket className="w-5 h-5" />}
              label="Offene Tickets"
              value={data.totals.openTickets}
              color="teal"
            />
            <SumCard
              icon={<Clock className="w-5 h-5" />}
              label="Überfällige Tickets"
              value={data.totals.overdueTickets}
              color="red"
            />
            <SumCard
              icon={<PhoneCall className="w-5 h-5" />}
              label="Offene Rückrufe"
              value={data.totals.openCallbacks}
              color="amber"
            />
          </div>

          {/* Tabelle */}
          <div className="bg-white rounded-xl border border-[#e7e2d3] overflow-hidden">
            <div className="px-5 py-3 border-b border-[#e7e2d3] bg-[#f9f8f5] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#1e7378]" />
              <span className="text-xs font-semibold text-[#737373] uppercase tracking-wider">
                Mitarbeiter ({data.rows.length})
              </span>
            </div>

            {sortedRows.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-[#737373] text-sm">Keine Mitarbeiter gefunden.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-[#fafaf8] border-b border-[#f0ede6]">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-[#737373]">Mitarbeiter</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-[#1e7378]">
                      <span className="flex items-center justify-center gap-1">
                        <Ticket className="w-3.5 h-3.5" /> Offen
                      </span>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-red-600">
                      <span className="flex items-center justify-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Überfällig
                      </span>
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-amber-600">
                      <span className="flex items-center justify-center gap-1">
                        <PhoneCall className="w-3.5 h-3.5" /> Rückrufe
                      </span>
                    </th>
                    <th className="px-5 py-3 text-center text-xs font-semibold text-[#737373]">Gesamt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0ede6]">
                  {sortedRows.map((row) => (
                    <EmployeeRow key={row.employeeId} row={row} />
                  ))}
                </tbody>
                {/* Summenzeile */}
                <tfoot className="border-t-2 border-[#e7e2d3] bg-[#f9f8f5]">
                  <tr>
                    <td className="px-5 py-3 text-xs font-bold text-[#0a322d]">Gesamt</td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-[#1e7378] tabular-nums">{data.totals.openTickets}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-red-600 tabular-nums">{data.totals.overdueTickets}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-bold text-amber-600 tabular-nums">{data.totals.openCallbacks}</span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="font-bold text-[#0a322d] tabular-nums">
                        {data.totals.openTickets + data.totals.overdueTickets + data.totals.openCallbacks}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Summen-Kachel ──────────────────────────────────────────────────────────────

function SumCard({
  icon, label, value, color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "teal" | "red" | "amber";
}) {
  const styles = {
    teal:  { card: "border-[#befcfb] bg-[#f0fffe]", icon: "text-[#1e7378]", value: "text-[#0a322d]", label: "text-[#1e7378]" },
    red:   { card: "border-red-200 bg-red-50",       icon: "text-red-500",   value: "text-red-700",   label: "text-red-500"   },
    amber: { card: "border-amber-200 bg-amber-50",   icon: "text-amber-500", value: "text-amber-700", label: "text-amber-500" },
  }[color];

  return (
    <div className={`rounded-xl border p-4 space-y-2 ${styles.card}`}>
      <div className={`flex items-center gap-2 ${styles.label}`}>
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-3xl font-bold tabular-nums ${styles.value}`}>{value}</p>
    </div>
  );
}

// ── Tabellenzeile pro Mitarbeiter ──────────────────────────────────────────────

function EmployeeRow({ row }: { row: TicketUebersichtRow }) {
  const total = row.openTickets + row.overdueTickets + row.openCallbacks;
  const hasOverdue   = row.overdueTickets > 0;
  const hasCallbacks = row.openCallbacks > 0;
  const isEmpty      = total === 0;

  return (
    <tr className={`transition-colors ${isEmpty ? "opacity-40" : "hover:bg-[#fafaf8]"}`}>
      <td className="px-5 py-3">
        <div>
          <p className="font-medium text-[#0a322d]">{displayName(row)}</p>
          {row.shortName && (
            <p className="text-xs text-[#a3a3a3]">{row.shortName}</p>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <CountBadge value={row.openTickets} color="teal" />
      </td>
      <td className="px-4 py-3 text-center">
        <CountBadge value={row.overdueTickets} color={hasOverdue ? "red" : "neutral"} />
      </td>
      <td className="px-4 py-3 text-center">
        <CountBadge value={row.openCallbacks} color={hasCallbacks ? "amber" : "neutral"} />
      </td>
      <td className="px-5 py-3 text-center">
        <span className={`font-semibold tabular-nums text-sm ${isEmpty ? "text-[#d4d0c7]" : "text-[#0a322d]"}`}>
          {total}
        </span>
      </td>
    </tr>
  );
}

function CountBadge({ value, color }: { value: number; color: "teal" | "red" | "amber" | "neutral" }) {
  if (value === 0) {
    return <span className="text-[#d4d0c7] text-sm tabular-nums font-medium">–</span>;
  }
  const cls = {
    teal:    "bg-[#befcfb] text-[#0a322d]",
    red:     "bg-red-100 text-red-700",
    amber:   "bg-amber-100 text-amber-700",
    neutral: "bg-[#f0ede6] text-[#737373]",
  }[color];

  return (
    <span className={`inline-block min-w-[2rem] px-2 py-0.5 rounded-full text-sm font-bold tabular-nums ${cls}`}>
      {value}
    </span>
  );
}
