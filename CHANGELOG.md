# Changelog — PLENIUM Service Portal

Alle wichtigen Änderungen am Haupt-System werden hier dokumentiert.

Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/).
Versionierung nach [Semantic Versioning](https://semver.org/lang/de/).

---

## [Unreleased]

## [0.3.2] - 2026-03-25

### Changed
- Git-Branch-Strategie auf GitHub Flow umgestellt: `main` → `develop` → `feature/*` / `fix/*`
- CLAUDE.md: Branch-Strategie, PR-Format, Merge-Regeln und Konflikt-Lösung dokumentiert
- Pflicht-Workflow auf 7 Schritte erweitert (neuer Schritt `[MERGE]`)
- `.github/workflows/deploy-dev.yml`: Auf Branch `develop` umgestellt, Backend-TS-Check ergänzt

### Added
- `.github/workflows/ci-feature.yml`: CI-Check (TS Frontend + Backend) für alle PRs auf `develop`/`main`

### Removed
- `.github/workflows/deploy-dev-asmussen.yml`: Persönlicher Branch-Workflow entfernt
- `.github/workflows/deploy-dev-westphal.yml`: Persönlicher Branch-Workflow entfernt

## [0.3.1] - 2026-03-25

### Added
- Administrator-Rolle für User "asmussen" (neben "westphal") beim Login und TANSS-Import
- Admin-Toggle in der Berechtigungsmatrix: Krone-Icon per Klick zum Setzen/Entziehen der Admin-Rechte
- Admins erhalten beim `/me`-Endpoint automatisch alle registrierten Module — auch zukünftige — ohne erneuten Import

## [0.3.0] - 2026-03-23

### Added
- Modul-Registry (`core/modules.ts`) als zentrale Quelle aller verfügbaren Module
- TANSS-Techniker-Import: Admin kann alle eingerichteten TANSS-User via `/employees/technicians` importieren
- Berechtigungsmatrix-UI: Admin-Seite `/admin/berechtigungen` mit User × Modul-Toggles
- Modul `auswertungen` (Phase 1): Heutige Supports aus TANSS mit expandierbaren Rohdaten
- Server-Side API-Helper (`lib/server-api.ts`) für Modul-Berechtigungen in Layouts
- Alle Layouts laden Modul-Berechtigungen dynamisch aus der DB (kein Hardcoding mehr)

### Changed
- Nicht-Admin-User erhalten bei Login keine Module mehr automatisch (Default: gesperrt)
- Admin-User (isAdmin=true) erhalten beim Login/Import automatisch alle Module

## [0.2.0] - 2026-03-20

### Added
- TANSS-Authentifizierung: Login mit System-Auswahl, Benutzername, Passwort und OTP
- JWT-Session (8h, httpOnly-Cookie) mit TANSS-Token im Payload
- Route-Guard Middleware: unauthentifizierte Requests werden zu /login weitergeleitet
- System-Konfiguration: TANSS-Instanzen mit Base URL und Backend-Toggle verwalten
- Berechtigungsmatrix: Modul-Berechtigungen pro User (userId × moduleId → allowed)
- Modul `tanss-dashboard`: Offene Tickets, überfällige Tickets, Rückrufgesuche
- Erster Admin-User: `westphal` erhält automatisch Administratorrechte
- Docs-Struktur unter `/docs/` mit Modul-Anleitungen
- DB-Migration: `SystemConfig`, `ModulePermission`, User-Erweiterung (tanssId, isAdmin)

## [0.1.0] - 2026-03-20

### Added
- Projekt-Grundgerüst mit pnpm Workspaces + Turborepo
- Next.js 15 Frontend mit App Router, Tailwind CSS v4, PLENIUM Brand-Design
- Fastify v5 Backend mit Core-Konfiguration und Health-Check-Endpoint
- PostgreSQL 17 + Prisma 6 Datenbankintegration mit Migrations-Support
- Docker Multi-Stage Setup mit NGINX Reverse Proxy
- CLAUDE.md mit Entwicklungs-Workflow und Konventionen
- Modul-Architektur (Frontend/Backend getrennt, einfach erweiterbar)
- Dashboard mit Statistik-Karten und Modul-Übersicht (Empty State)
- PLENIUM Brand-Farben und Logos integriert
- SVG-Logos (dark + light Variante)
