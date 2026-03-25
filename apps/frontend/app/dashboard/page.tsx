import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { DashboardStats } from "@/modules/tanss-dashboard/DashboardStats";
import { WelcomeGreeting } from "./WelcomeGreeting";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await getSession();

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div>
        <WelcomeGreeting displayName={session?.displayName} />
        <p className="text-[#737373] mt-1 text-sm">
          Ihre persönliche Übersicht im PLENIUM Service Portal.
        </p>
      </div>

      {/* TANSS Stats */}
      <DashboardStats />

      {/* System Info */}
      <div className="bg-[#0a322d] rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-[#5afff5] text-xs font-semibold uppercase tracking-wider mb-1">
            System
          </p>
          <p className="text-white font-semibold">PLENIUM v0.1.0</p>
          <p className="text-white/50 text-sm mt-0.5">
            Alle Services laufen fehlerfrei.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#5afff5] animate-pulse" />
          <span className="text-[#5afff5] text-sm font-medium">Online</span>
        </div>
      </div>
    </div>
  );
}
