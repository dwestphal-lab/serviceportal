/**
 * TANSS Techniker-Import
 * Importiert alle eingerichteten Techniker aus TANSS und legt sie in der DB an.
 * Wird beim Admin-Login automatisch ausgeführt und kann manuell per Button ausgelöst werden.
 */

import { prisma } from "@plenium/db";
import { MODULE_REGISTRY } from "../../core/modules.js";

export interface ImportResult {
  imported: number;
  skipped: number;
  total: number;
}

export async function importTanssEmployees(
  apiBase: string,
  tanssToken: string,
  systemConfigId: string
): Promise<ImportResult> {
  const res = await fetch(`${apiBase}/employees/technicians`, {
    headers: { apiToken: tanssToken },
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    throw new Error(`TANSS /employees/technicians antwortete mit HTTP ${res.status}`);
  }

  const data = (await res.json()) as Record<string, unknown>;
  const content = data?.content ?? data;
  const technicians = Array.isArray(content) ? (content as Record<string, unknown>[]) : [];

  let imported = 0;
  let skipped  = 0;

  for (const tech of technicians) {
    const tanssId = String(tech.id ?? tech.employeeId ?? "").trim();
    if (!tanssId) { skipped++; continue; }

    // Login-Name: verschiedene Feld-Varianten probieren
    const loginName = (
      (tech.loginName ?? tech.username ?? tech.userName ?? "") as string
    ).toLowerCase().trim();

    // Display-Name: firstName+lastName oder aus dem "Nachname, Vorname"-Format
    const firstName = (tech.firstName as string | undefined)?.trim();
    const lastName  = (tech.lastName  as string | undefined)?.trim();
    let displayName: string | undefined;

    if (firstName && lastName) {
      displayName = `${firstName} ${lastName}`;
    } else if (tech.name) {
      const raw   = (tech.name as string).trim();
      const parts = raw.split(", ");
      displayName = parts.length === 2 ? `${parts[1].trim()} ${parts[0].trim()}` : raw;
    }

    // Kürzel (shortName / abbreviation) — für spätere Anzeige
    const shortName = (
      (tech.shortName ?? tech.kuerzel ?? tech.abbreviation ?? "") as string
    ).trim() || undefined;

    const username   = loginName || `tanss-user-${tanssId}`;
    const isAdminUser = ["westphal", "asmussen"].includes(loginName);

    const user = await prisma.user.upsert({
      where: { tanssId },
      update: {
        username,
        ...(displayName  ? { displayName }  : {}),
        ...(shortName    ? { shortName }     : {}),
        systemConfigId,
      },
      create: {
        tanssId,
        username,
        displayName,
        shortName,
        isAdmin: isAdminUser,
        systemConfigId,
      },
    });

    // Admin bekommt alle Module erlaubt
    if (user.isAdmin || isAdminUser) {
      for (const mod of MODULE_REGISTRY) {
        await prisma.modulePermission.upsert({
          where: { userId_moduleId: { userId: user.id, moduleId: mod.id } },
          update: { allowed: true },
          create: { userId: user.id, moduleId: mod.id, allowed: true },
        });
      }
    }

    imported++;
  }

  return { imported, skipped, total: technicians.length };
}
