/**
 * PLENIUM Module Registry
 * Zentrales Verzeichnis aller verfügbaren Module im System.
 * Hier eintragen wenn ein neues Modul hinzukommt.
 */

export interface ModuleDefinition {
  id: string;
  name: string;
}

export const MODULE_REGISTRY: readonly ModuleDefinition[] = [
  { id: "tanss-dashboard", name: "TANSS Übersicht" },
  { id: "auswertungen",    name: "Auswertungen" },
] as const;
