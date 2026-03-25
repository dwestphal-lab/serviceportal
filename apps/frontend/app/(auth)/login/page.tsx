import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Settings2 } from "lucide-react";
import { LoginForm } from "./login-form";
import { auth } from "@/lib/api";

export const metadata: Metadata = { title: "Anmelden" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const sessionExpired = reason === "session_expired";

  let systems: Awaited<ReturnType<typeof auth.getSystems>> = [];
  try {
    systems = await auth.getSystems();
  } catch {
    // Backend nicht erreichbar
  }

  return (
    <div className="w-full max-w-md">
      {sessionExpired && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm text-center">
          Ihre Sitzung ist abgelaufen. Bitte erneut anmelden.
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-[0_4px_24px_0_rgb(10_50_45/0.12)] overflow-hidden">
        {/* Logo-Header */}
        <div className="bg-[#0a322d] px-8 pt-8 pb-7 flex flex-col items-center">
          <Image
            src="/logo-light.svg"
            alt="PLENIUM"
            width={220}
            height={66}
            priority
          />
          <p className="text-white/50 text-xs mt-3 tracking-wide uppercase">
            Service Portal
          </p>
        </div>

        {/* Formular */}
        <div className="p-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-[#0a322d]">Anmelden</h1>
            <p className="text-sm text-[#737373] mt-1">
              Melden Sie sich mit Ihren TANSS-Zugangsdaten an.
            </p>
          </div>

          <Suspense>
            <LoginForm systems={systems} />
          </Suspense>
        </div>
      </div>

      {/* Setup-Link */}
      <div className="flex items-center justify-center mt-4 gap-4">
        <Link
          href="/setup"
          className="flex items-center gap-1.5 text-xs text-[#737373] hover:text-[#1e7378] transition-colors"
        >
          <Settings2 className="w-3.5 h-3.5" />
          Systemkonfiguration
        </Link>
        <span className="text-[#d4d0c7] text-xs">·</span>
        <p className="text-xs text-[#a3a3a3]">PLENIUM Service Portal</p>
      </div>
    </div>
  );
}
