"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { RefreshCw, Loader2, AlertCircle, Hash, Users, ChevronDown } from "lucide-react";
import { auswertungen, type SupportsResponse, type AuswertungEmployee } from "@/lib/api";

// ── Zeitraum-Presets ──────────────────────────────────────────────────────────

type TimePreset = "today" | "yesterday" | "this-week" | "last-week" | "this-month" | "last-month" | "custom";

interface TimeRange { from: number; to: number }

const PRESETS: { id: TimePreset; label: string }[] = [
  { id: "today",      label: "Heute" },
  { id: "yesterday",  label: "Gestern" },
  { id: "this-week",  label: "Diese Woche" },
  { id: "last-week",  label: "Letzte Woche" },
  { id: "this-month", label: "Dieser Monat" },
  { id: "last-month", label: "Letzter Monat" },
  { id: "custom",     label: "Individuell" },
];

function toIsoDate(d: Date): string { return d.toISOString().slice(0, 10); }

function getTimeRange(preset: TimePreset, customFrom?: string, customTo?: string): TimeRange {
  const ts      = (d: Date) => Math.floor(d.getTime() / 1000);
  const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(),  0,  0,  0);
  const dayEnd   = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
  const now = new Date();

  if (preset === "custom") {
    const f = customFrom ? new Date(customFrom) : now;
    const t = customTo   ? new Date(customTo)   : now;
    return { from: ts(dayStart(f)), to: ts(dayEnd(t)) };
  }

  switch (preset) {
    case "today":
      return { from: ts(dayStart(now)), to: ts(dayEnd(now)) };
    case "yesterday": {
      const d = new Date(now); d.setDate(d.getDate() - 1);
      return { from: ts(dayStart(d)), to: ts(dayEnd(d)) };
    }
    case "this-week": {
      const dow = now.getDay(); const diff = dow === 0 ? -6 : 1 - dow;
      const mon = new Date(now); mon.setDate(now.getDate() + diff);
      const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
      return { from: ts(dayStart(mon)), to: ts(dayEnd(sun)) };
    }
    case "last-week": {
      const dow = now.getDay(); const diff = dow === 0 ? -6 : 1 - dow;
      const thisMon = new Date(now); thisMon.setDate(now.getDate() + diff);
      const lastMon = new Date(thisMon); lastMon.setDate(thisMon.getDate() - 7);
      const lastSun = new Date(lastMon); lastSun.setDate(lastMon.getDate() + 6);
      return { from: ts(dayStart(lastMon)), to: ts(dayEnd(lastSun)) };
    }
    case "this-month":
      return {
        from: ts(new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)),
        to:   ts(new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)),
      };
    case "last-month":
      return {
        from: ts(new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0)),
        to:   ts(new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)),
      };
  }
}

function formatPresetRange(preset: TimePreset, customFrom?: string, customTo?: string): string {
  if (preset === "custom") {
    if (!customFrom && !customTo) return "Zeitraum wählen";
    const fmt = (s: string) =>
      new Date(s).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
    const f = customFrom ? fmt(customFrom) : "?";
    const t = customTo   ? fmt(customTo)   : "?";
    return f === t ? f : `${f} – ${t}`;
  }
  const { from, to } = getTimeRange(preset);
  const fmt = (ts: number) =>
    new Date(ts * 1000).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
  const f = fmt(from); const t = fmt(to);
  return f === t ? f : `${f} – ${t}`;
}

// ── Zeitformatierung ──────────────────────────────────────────────────────────

/** Minuten → HH:MM */
function formatMinutes(min: number): string {
  if (!isFinite(min) || min < 0) min = 0;
  const h = Math.floor(min / 60);
  const m = Math.floor(min % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Unix-Timestamp / ISO-String → deutsches Datum + Uhrzeit */
function formatDateTime(value: unknown): string {
  if (value == null || value === "") return "–";
  let date: Date | null = null;
  if (typeof value === "number") {
    date = new Date(value > 1e10 ? value : value * 1000);
  } else if (typeof value === "string") {
    const asNum = Number(value);
    if (!isNaN(asNum) && value.trim() !== "") {
      date = new Date(asNum > 1e10 ? asNum : asNum * 1000);
    } else {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) date = parsed;
    }
  }
  if (!date || isNaN(date.getTime())) return String(value);
  return date.toLocaleString("de-DE", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

// ── Kategorisierung ───────────────────────────────────────────────────────────

type SupportCategory = "plenium-intern" | "kunden-intern" | "mit-berechnung" | "ohne-berechnung" | "fahrzeit";

interface SupportStats {
  netMinutes: number;          // duration - durationBreak
  billedMinutes: number;       // duration - durationNotCharged (nur bei internal=false)
  notBilledMinutes: number;    // durationNotCharged (nur bei internal=false)
  fahrtMinutes: number;        // durationApproach + durationDeparture
  isInternal: boolean;
  isPleniumIntern: boolean;
  companyId: number;
}

function getSupportStats(s: Record<string, unknown>): SupportStats {
  const duration           = Number(s.duration           ?? 0);
  const durationBreak      = Number(s.durationBreak      ?? 0);
  const durationNotCharged = Number(s.durationNotCharged ?? 0);
  const durationApproach   = Number(s.durationApproach   ?? 0);
  const durationDeparture  = Number(s.durationDeparture  ?? 0);
  const isInternal         = Boolean(s.internal);
  const companyId          = Number(
    s.companyId ??
    (s.company as Record<string, unknown> | undefined)?.id ??
    0
  );

  const netMinutes       = Math.max(0, duration - durationBreak);
  const billedMinutes    = Math.max(0, duration - durationNotCharged);
  const notBilledMinutes = Math.max(0, durationNotCharged);
  const fahrtMinutes     = Math.max(0, durationApproach + durationDeparture);
  const isPleniumIntern  = isInternal && companyId === 100000;

  return { netMinutes, billedMinutes, notBilledMinutes, fahrtMinutes, isInternal, isPleniumIntern, companyId };
}

const CAT: Record<SupportCategory, { label: string; textColor: string; badgeCls: string; cardCls: string }> = {
  "plenium-intern": {
    label:     "Plenium intern",
    textColor: "text-violet-700",
    badgeCls:  "bg-violet-50 text-violet-700 border-violet-200",
    cardCls:   "border-violet-200 bg-violet-50",
  },
  "kunden-intern": {
    label:     "Kunden intern",
    textColor: "text-blue-700",
    badgeCls:  "bg-blue-50 text-blue-700 border-blue-200",
    cardCls:   "border-blue-200 bg-blue-50",
  },
  "mit-berechnung": {
    label:     "Mit Berechnung",
    textColor: "text-emerald-700",
    badgeCls:  "bg-emerald-50 text-emerald-700 border-emerald-200",
    cardCls:   "border-emerald-200 bg-emerald-50",
  },
  "ohne-berechnung": {
    label:     "Ohne Berechnung",
    textColor: "text-amber-700",
    badgeCls:  "bg-amber-50 text-amber-700 border-amber-200",
    cardCls:   "border-amber-200 bg-amber-50",
  },
  "fahrzeit": {
    label:     "Fahrzeit",
    textColor: "text-cyan-700",
    badgeCls:  "bg-cyan-50 text-cyan-700 border-cyan-200",
    cardCls:   "border-cyan-200 bg-cyan-50",
  },
};

interface CategoryTotal { minutes: number; count: number }
type Totals = Record<SupportCategory, CategoryTotal>;

function calcTotals(supports: Record<string, unknown>[]): Totals {
  const t: Totals = {
    "plenium-intern":  { minutes: 0, count: 0 },
    "kunden-intern":   { minutes: 0, count: 0 },
    "mit-berechnung":  { minutes: 0, count: 0 },
    "ohne-berechnung": { minutes: 0, count: 0 },
    "fahrzeit":        { minutes: 0, count: 0 },
  };
  for (const s of supports) {
    const stats = getSupportStats(s);
    if (stats.isInternal) {
      const cat = stats.isPleniumIntern ? "plenium-intern" : "kunden-intern";
      t[cat].minutes += stats.netMinutes;
      t[cat].count++;
    } else {
      t["mit-berechnung"].minutes  += stats.billedMinutes;
      t["mit-berechnung"].count++;
      t["ohne-berechnung"].minutes += stats.notBilledMinutes;
      if (stats.notBilledMinutes > 0) t["ohne-berechnung"].count++;
    }
    if (stats.fahrtMinutes > 0) {
      t["fahrzeit"].minutes += stats.fahrtMinutes;
      t["fahrzeit"].count++;
    }
  }
  return t;
}

// ── Hauptkomponente ───────────────────────────────────────────────────────────

export function SupportsListe() {
  const todayStr = toIsoDate(new Date());

  const [preset, setPreset]                     = useState<TimePreset>("today");
  const [customFrom, setCustomFrom]             = useState<string>(todayStr);
  const [customTo,   setCustomTo]               = useState<string>(todayStr);
  const [data, setData]                         = useState<SupportsResponse | null>(null);
  const [employees, setEmployees]               = useState<AuswertungEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState<string | null>(null);

  useEffect(() => {
    auswertungen.getEmployees().then(setEmployees).catch(() => {});
  }, []);

  const load = useCallback(async (p: TimePreset, empId: string, cFrom: string, cTo: string) => {
    if (p === "custom" && (!cFrom || !cTo)) return;
    setLoading(true);
    setError(null);
    try {
      const range  = getTimeRange(p, cFrom, cTo);
      const result = await auswertungen.getSupports({
        from: range.from,
        to:   range.to,
        ...(empId ? { employeeId: empId } : {}),
      });
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Daten konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(preset, selectedEmployee, customFrom, customTo);
  }, [load, preset, selectedEmployee, customFrom, customTo]);

  const supports   = useMemo(() => (data?.supports ?? []) as Record<string, unknown>[], [data]);
  const totals     = useMemo(() => calcTotals(supports), [supports]);
  const selectedEmp = employees.find((e) => e.tanssId === selectedEmployee);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">

      {/* Zeitraum-Presets */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPreset(p.id)}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-lg border transition-all ${
                preset === p.id
                  ? "bg-[#0a322d] text-white border-[#0a322d]"
                  : "bg-white text-[#0a322d] border-[#d4d0c7] hover:border-[#1e7378]"
              }`}
            >
              {p.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => void load(preset, selectedEmployee, customFrom, customTo)}
            disabled={loading}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 text-sm border border-[#d4d0c7] rounded-lg bg-white text-[#737373] hover:text-[#0a322d] hover:border-[#1e7378] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {preset === "custom" ? (
          <div className="flex items-center gap-3 px-4 py-3 bg-white border border-[#e7e2d3] rounded-xl">
            <span className="text-sm text-[#737373] shrink-0">Von</span>
            <input
              type="date"
              value={customFrom}
              max={customTo || todayStr}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="px-3 py-1.5 text-sm border border-[#d4d0c7] rounded-lg bg-[#f9f8f5] text-[#0a322d] focus:outline-none focus:border-[#1e7378]"
            />
            <span className="text-sm text-[#737373] shrink-0">Bis</span>
            <input
              type="date"
              value={customTo}
              min={customFrom}
              max={todayStr}
              onChange={(e) => setCustomTo(e.target.value)}
              className="px-3 py-1.5 text-sm border border-[#d4d0c7] rounded-lg bg-[#f9f8f5] text-[#0a322d] focus:outline-none focus:border-[#1e7378]"
            />
          </div>
        ) : (
          <p className="text-xs text-[#a3a3a3] pl-1">{formatPresetRange(preset)}</p>
        )}
      </div>

      {/* Mitarbeiter-Filter */}
      <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[#e7e2d3]">
        <Users className="w-4 h-4 text-[#1e7378] shrink-0" />
        <span className="text-sm font-medium text-[#0a322d] shrink-0">Mitarbeiter:</span>
        <div className="relative">
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="appearance-none pl-3 pr-8 py-1.5 text-sm bg-[#f9f8f5] border border-[#d4d0c7] rounded-lg text-[#0a322d] focus:outline-none focus:border-[#1e7378] cursor-pointer min-w-[220px]"
          >
            <option value="">Alle Mitarbeiter</option>
            {employees.map((emp) => (
              <option key={emp.tanssId} value={emp.tanssId}>
                {emp.displayName ?? emp.username}{emp.shortName ? ` (${emp.shortName})` : ""}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#737373]" />
        </div>
        {selectedEmployee && (
          <button type="button" onClick={() => setSelectedEmployee("")}
            className="text-xs text-[#1e7378] hover:underline">
            Zurücksetzen
          </button>
        )}
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
          Lade Supports aus TANSS…
        </div>
      )}

      {/* Ergebnis */}
      {data && !loading && (
        <>
          {/* Kategorie-Kacheln */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {(Object.keys(CAT) as SupportCategory[]).map((cat) => (
              <div key={cat}
                className={`rounded-xl border p-4 space-y-1 ${CAT[cat].cardCls}`}>
                <p className={`text-xs font-semibold uppercase tracking-wider ${CAT[cat].textColor}`}>
                  {CAT[cat].label}
                </p>
                <p className={`text-2xl font-bold tabular-nums ${CAT[cat].textColor}`}>
                  {formatMinutes(totals[cat].minutes)}
                </p>
                <p className="text-xs text-[#737373]">
                  {totals[cat].count} {totals[cat].count === 1 ? "Eintrag" : "Einträge"}
                </p>
              </div>
            ))}
          </div>

          {/* Gesamt-Badge */}
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-[#e7e2d3]">
              <Hash className="w-4 h-4 text-[#1e7378]" />
              <span className="text-xl font-bold text-[#0a322d] tabular-nums">
                {formatMinutes(supports.reduce((sum, s) => sum + getSupportStats(s).netMinutes, 0))}
              </span>
              <span className="text-sm text-[#737373]">
                Gesamt · {data.count} {data.count === 1 ? "Support" : "Supports"}
                {selectedEmp && <span className="text-[#1e7378] ml-1">· {selectedEmp.displayName ?? selectedEmp.username}</span>}
              </span>
            </div>
          </div>

          {/* Tabelle */}
          {data.count === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-[#e7e2d3]">
              <p className="text-[#737373] text-sm">Keine Supports im gewählten Zeitraum gefunden.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#e7e2d3] overflow-hidden">
              <div className="px-5 py-3 border-b border-[#e7e2d3] bg-[#f9f8f5] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#737373] uppercase tracking-wider">
                  Einträge ({data.count})
                </span>
                <span className="text-xs text-[#a3a3a3]">Klick = Rohdaten</span>
              </div>
              <div className="overflow-auto max-h-[600px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-[#fafaf8] border-b border-[#f0ede6] z-10">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs text-[#a3a3a3] font-medium w-8">#</th>
                      <th className="px-2 py-2 text-left text-xs text-[#a3a3a3] font-medium w-20">ID</th>
                      <th className="px-2 py-2 text-left text-xs text-[#a3a3a3] font-medium">Betreff</th>
                      <th className="px-2 py-2 text-left text-xs text-[#a3a3a3] font-medium">Mitarbeiter</th>
                      <th className="px-2 py-2 text-left text-xs text-[#a3a3a3] font-medium">Kategorie</th>
                      <th className="px-2 py-2 text-right text-xs text-[#a3a3a3] font-medium w-20">Zeit</th>
                      <th className="px-4 py-2 text-right text-xs text-[#a3a3a3] font-medium w-40">Datum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0ede6]">
                    {supports.map((s, idx) => (
                      <SupportRow
                        key={String(s.id ?? idx)}
                        support={s}
                        index={idx + 1}
                        employees={employees}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Tabellenzeile ─────────────────────────────────────────────────────────────

function SupportRow({
  support, index, employees,
}: {
  support: Record<string, unknown>;
  index: number;
  employees: AuswertungEmployee[];
}) {
  const [expanded, setExpanded] = useState(false);
  const stats  = getSupportStats(support);

  const id    = support.id    ?? support.supportId ?? "–";
  const title = support.title ?? support.subject   ?? support.description ?? "–";
  const date  = support.date  ?? support.created   ?? support.timestamp   ?? support.createdAt ?? "";

  const empId    = support.employeeId ?? support.technicianId ?? support.assignedEmployeeId ?? null;
  const employee = empId ? employees.find((e) => e.tanssId === String(empId)) : null;
  const empLabel = employee?.displayName ?? employee?.shortName ?? (empId ? `#${String(empId)}` : "–");

  // Kategorie-Badge(s) für die Zeile
  const badges: SupportCategory[] = [
    ...(stats.isInternal
      ? [stats.isPleniumIntern ? "plenium-intern" : "kunden-intern"] as SupportCategory[]
      : [
          ...(stats.billedMinutes    > 0 ? ["mit-berechnung"  as SupportCategory] : []),
          ...(stats.notBilledMinutes > 0 ? ["ohne-berechnung" as SupportCategory] : []),
        ]),
    ...(stats.fahrtMinutes > 0 ? ["fahrzeit" as SupportCategory] : []),
  ];

  return (
    <>
      <tr
        className="hover:bg-[#fafaf8] cursor-pointer transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <td className="px-4 py-3 text-[#a3a3a3] text-xs">{index}</td>
        <td className="px-2 py-3 font-mono text-xs text-[#1e7378]">#{String(id)}</td>
        <td className="px-2 py-3 text-[#0a322d] max-w-[200px] truncate">{String(title)}</td>
        <td className="px-2 py-3 text-xs text-[#737373]">{empLabel}</td>
        <td className="px-2 py-3">
          <div className="flex flex-wrap gap-1">
            {badges.map((cat) => (
              <span key={cat}
                className={`text-xs px-2 py-0.5 rounded-full border font-medium ${CAT[cat].badgeCls}`}>
                {CAT[cat].label}
              </span>
            ))}
          </div>
        </td>
        <td className="px-2 py-3 text-right font-mono text-sm font-semibold text-[#0a322d] tabular-nums">
          {formatMinutes(stats.netMinutes)}
        </td>
        <td className="px-4 py-3 text-xs text-[#a3a3a3] text-right tabular-nums">
          {formatDateTime(date)}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} className="px-5 pb-3 pt-0">
            <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2 text-xs text-[#737373]">
              <span>duration: <strong className="text-[#0a322d]">{String(support.duration ?? "–")}</strong> min</span>
              <span>durationBreak: <strong className="text-[#0a322d]">{String(support.durationBreak ?? "0")}</strong> min</span>
              <span>durationNotCharged: <strong className="text-[#0a322d]">{String(support.durationNotCharged ?? "0")}</strong> min</span>
              <span>durationApproach: <strong className="text-[#0a322d]">{String(support.durationApproach ?? "0")}</strong> min</span>
              <span>durationDeparture: <strong className="text-[#0a322d]">{String(support.durationDeparture ?? "0")}</strong> min</span>
              <span>→ Fahrzeit: <strong className="text-cyan-700">{formatMinutes(stats.fahrtMinutes)}</strong></span>
              <span>internal: <strong className="text-[#0a322d]">{String(support.internal ?? "–")}</strong></span>
              <span>companyId: <strong className="text-[#0a322d]">{String(stats.companyId || "–")}</strong></span>
            </div>
            <pre className="text-xs font-mono bg-[#f9f8f5] rounded-lg p-3 overflow-auto max-h-64 text-[#0a322d] whitespace-pre-wrap break-words border border-[#e7e2d3]">
              {JSON.stringify(support, null, 2)}
            </pre>
          </td>
        </tr>
      )}
    </>
  );
}
