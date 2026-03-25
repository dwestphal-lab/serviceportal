# PLENIUM Service Portal — Dokumentation

Zentrale Dokumentation für alle Module und Kernfunktionen des PLENIUM Service Portals.

## Inhalt

- [Erste Schritte / Setup](./setup.md)
- [Module](./modules/)
  - [TANSS Dashboard](./modules/tanss-dashboard/README.md)
- [Deployment & CI/CD](./deployment/)
  - [Entwickler-Workflow & KI-Anweisungen](./deployment/ENTWICKLER-WORKFLOW.md)
  - [CI/CD Anleitung & Git-Workflow](./deployment/CI-CD-ANLEITUNG.md)
  - [Linux Server Setup](./deployment/SERVER-SETUP.md)
  - [GitHub Repository Setup](./deployment/GITHUB-SETUP.md)

## Modulübersicht

| Modul | ID | Beschreibung | Sichtbar für |
|---|---|---|---|
| TANSS Dashboard | `tanss-dashboard` | Ticket-Statistiken aus TANSS | Alle Benutzer |

## Benutzerrollen

| Rolle | Beschreibung |
|---|---|
| Benutzer | Kann alle für ihn freigeschalteten Module verwenden |
| Administrator | Kann Systemkonfigurationen und Berechtigungen verwalten |

Der erste Benutzer mit dem TANSS-Benutzernamen `westphal` erhält automatisch Administratorrechte.

## Systemkonfiguration

Externe Systeme (TANSS-Instanzen) werden unter **Einstellungen → Systeme** verwaltet (nur für Admins sichtbar).

Jede System-Konfiguration hat:
- **Name** — Anzeigename auf der Login-Seite
- **Base URL** — z.B. `https://tanss.firma.de`
- **API-Pfad** — Toggle: mit `/backend`-Suffix oder ohne
- **Standard** — Vorausgewähltes System auf der Login-Seite
