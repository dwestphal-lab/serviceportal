/**
 * Datenbank-Seed — nur für Entwicklung.
 * Führe aus mit: pnpm db:seed
 *
 * Seed-Daten sind GETRENNT von Migrations — niemals Seed-Daten in
 * Migration-Files einfügen.
 */

import { prisma } from "./client.js";

async function main() {
  console.log("🌱 Seed wird ausgeführt...");

  // ── Standard TANSS-System ──────────────────────────────────────────────────
  const system = await prisma.systemConfig.upsert({
    where: { id: "default-tanss" },
    update: {},
    create: {
      id: "default-tanss",
      name: "TANSS",
      type: "tanss",
      baseUrl: "https://tanss.beispiel.de",
      useBackend: true,
      isDefault: true,
      isActive: true,
    },
  });

  console.log(`✅ System konfiguriert: ${system.name} (${system.baseUrl})`);
  console.log("   → Bitte die Base URL in den Einstellungen anpassen.");
  console.log("✅ Seed abgeschlossen.");
}

main()
  .catch((err) => {
    console.error("❌ Seed fehlgeschlagen:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
