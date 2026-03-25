import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SystemsManager } from "./systems-manager";

export const metadata: Metadata = { title: "System-Einstellungen" };

export default async function SystemsSettingsPage() {
  const session = await getSession();
  if (!session?.isAdmin) redirect("/dashboard");

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[#0a322d]">System-Einstellungen</h2>
        <p className="text-[#737373] mt-1 text-sm">
          Verwalten Sie externe Systeme (z.B. TANSS-Instanzen) für die Anmeldung.
        </p>
      </div>

      <SystemsManager />
    </div>
  );
}
