"use client";

import { useEffect, useState } from "react";
import { Ticket, AlertTriangle, Phone, RefreshCw } from "lucide-react";
import { dashboard, type DashboardStats, ApiError } from "@/lib/api";

function StatCard({
  label,
  value,
  icon: Icon,
  variant = "default",
  description,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  variant?: "default" | "warning" | "success";
  description?: string;
}) {
  const colors = {
    default: {
      bg: "bg-[#e7e2d3]",
      icon: "text-[#1e7378]",
      value: "text-[#0a322d]",
    },
    warning: {
      bg: "bg-red-50",
      icon: "text-red-500",
      value: "text-red-700",
    },
    success: {
      bg: "bg-[#befcfb]",
      icon: "text-[#0a322d]",
      value: "text-[#0a322d]",
    },
  }[variant];

  return (
    <div className="bg-white rounded-xl p-5 border border-[#e7e2d3] shadow-[0_1px_3px_0_rgb(10_50_45/0.06)]">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2 ${colors.bg} rounded-lg`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
      </div>
      <p className="text-sm text-[#737373]">{label}</p>
      <p className={`text-3xl font-bold ${colors.value} mt-1`}>{value}</p>
      {description && (
        <p className="text-xs text-[#a3a3a3] mt-1">{description}</p>
      )}
    </div>
  );
}

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboard.getStats();
      setStats(data);
      setLastUpdated(new Date());
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Statistiken konnten nicht geladen werden.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 5 * 60 * 1000); // alle 5 min
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-red-700">TANSS nicht erreichbar</p>
          <p className="text-sm text-red-600 mt-0.5">{error}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-2 text-xs text-red-600 underline hover:text-red-800"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#0a322d]">TANSS Übersicht</h3>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-[#737373] hover:text-[#1e7378] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {lastUpdated
            ? `Stand: ${lastUpdated.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}`
            : "Wird geladen…"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Offene Tickets"
          value={loading ? "–" : (stats?.openTickets ?? 0)}
          icon={Ticket}
          description="Aktuell offen"
        />
        <StatCard
          label="Überfällige Tickets"
          value={loading ? "–" : (stats?.overdueTickets ?? 0)}
          icon={AlertTriangle}
          variant={(stats?.overdueTickets ?? 0) > 0 ? "warning" : "default"}
          description="Fälligkeit überschritten"
        />
        <StatCard
          label="Rückrufgesuche"
          value={loading ? "–" : (stats?.openCallbacks ?? 0)}
          icon={Phone}
          description="Offene Rückrufe"
        />
      </div>
    </div>
  );
}
