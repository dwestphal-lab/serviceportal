import type { Metadata } from "next";
import Image from "next/image";
import { SetupForm } from "./setup-form";
import { setup } from "@/lib/api";

export const metadata: Metadata = { title: "System einrichten" };

export default async function SetupPage() {
  let systems: Awaited<ReturnType<typeof setup.getSystems>> = [];
  try {
    systems = await setup.getSystems();
  } catch {
    // Backend nicht erreichbar
  }

  return (
    <div className="w-full max-w-lg">
      <div className="bg-white rounded-2xl shadow-[0_4px_24px_0_rgb(10_50_45/0.12)] overflow-hidden">
        {/* Header */}
        <div className="bg-[#0a322d] px-8 pt-8 pb-6 flex flex-col items-center">
          <Image src="/logo-light.svg" alt="PLENIUM" width={180} height={54} priority />
          <h1 className="text-white font-bold text-lg mt-4">Systemkonfiguration</h1>
          <p className="text-white/60 text-sm mt-1 text-center">
            TANSS-Systeme anlegen und verwalten
          </p>
        </div>

        <div className="p-8">
          <SetupForm systems={systems} />
        </div>
      </div>

      <p className="text-center text-xs text-[#a3a3a3] mt-6">
        PLENIUM Service Portal · Alle Rechte vorbehalten
      </p>
    </div>
  );
}
