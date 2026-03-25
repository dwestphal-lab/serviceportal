# CLAUDE.md — PLENIUM Service Portal

This file defines the **mandatory development workflow** and project conventions.
Every session **must** follow this workflow — **no exceptions**.

---

## Projekt: PLENIUM Service Portal

**Working Directory:** `c:\serviceportal`
**Stack:** Next.js 15 · Fastify v5 · PostgreSQL 17 · Prisma 6 · pnpm Workspaces · Turborepo · Docker + NGINX

---

## Pflicht-Workflow (6 Schritte)

### 1. `[PLAN]` — Planung vor dem Coding
- Aufgabe analysieren und **Rückfragen stellen** falls unklar
- **Lösungsvorschlag** mit Alternativen und Verbesserungsvorschlägen präsentieren
- **Warten auf explizite Freigabe** durch den User — erst dann darf Code geschrieben werden
- Format: Klare Auflistung der geplanten Änderungen, betroffene Dateien, Risiken

### 2. `[CODE]` — Implementierung
- Umsetzung **exakt nach genehmigtem Plan**
- TypeScript strict mode immer einhalten
- Keine ungefragten Refactorings oder Feature-Erweiterungen
- Modul-Grenzen respektieren (Frontend-Modul nur in `apps/frontend/modules/[name]/`)

### 3. `[REVIEW]` — Automatischer Code Review (nach jedem Coding)
Folgendes **immer** prüfen und gefundene Probleme **direkt fixen**:
- Code-Qualität: Typsicherheit, Patterns, Best Practices
- Security: Injection-Vektoren (SQL, XSS, Command), OWASP Top 10
- Input-Validierung an System-Grenzen (API-Endpoints, Formulare)
- Keine hartkodierten Secrets oder Credentials
- Dependency-Sicherheit bei neuen Paketen

### 4. `[LOG]` — Changelog aktualisieren
- **Haupt-CHANGELOG.md** für Core-Änderungen
- **`apps/frontend/CHANGELOG.md`** für Frontend-Änderungen
- **`apps/backend/CHANGELOG.md`** für Backend-Änderungen
- **`modules/[name]/CHANGELOG.md`** für Modul-spezifische Änderungen
- Format: `## [Version] - YYYY-MM-DD` mit Sections `Added`, `Changed`, `Fixed`, `Security`

### 5. `[TEST]` — Lokaler Start zur Verifikation
- Anwendung lokal starten und Fehler verifizieren
- Bei Fehlern: fixen, dann erneut prüfen
- Erst wenn fehlerfrei: weiter zu Schritt 6

### 6. `[COMMIT]` — Git Commit & Push
- **Nur nach expliziter Freigabe durch den User**
- Commit-Message nach Convention (siehe unten)
- Push **nur** wenn der User explizit "push" oder "pushen" sagt

---

## Commit-Tag-Konvention

```
feat(core):         Neue Feature im Kern-System
feat(module/name):  Neue Feature in einem Modul
fix(core):          Bugfix im Kern
fix(module/name):   Bugfix in einem Modul
db(migration):      Neue Datenbank-Migration
docker:             Docker/Deployment Änderung
review:             Code-Review Fixes
docs:               Dokumentation / Changelog
config:             Konfigurationsänderung
```

**Beispiel:**
```
feat(module/ticketing): Add ticket status workflow with state machine

- Adds status transitions: open → in_progress → resolved → closed
- Migration: adds status enum column to tickets table
- Reviewed: security check passed, no injection vectors

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

---

## Projektstruktur

```
serviceportal/
├── apps/
│   ├── frontend/                    # Next.js 15 (Port 3000)
│   │   ├── app/                     # App Router
│   │   ├── components/              # Shared UI
│   │   ├── lib/                     # Utilities
│   │   ├── modules/                 # Frontend-Module (je Modul ein Unterordner)
│   │   └── public/                  # Statische Assets (Logos etc.)
│   └── backend/                     # Fastify v5 (Port 3001)
│       └── src/
│           ├── core/                # Auth, Middleware, Plugins
│           └── modules/             # Backend-Module (je Modul ein Unterordner)
├── packages/
│   ├── db/                          # Prisma Schema + Migrations (shared)
│   └── shared-types/                # Gemeinsame TypeScript-Typen
├── modules/                         # Modul-Dokumentation & CHANGELOG je Modul
│   └── [module-name]/
│       └── CHANGELOG.md
├── docker/
│   ├── nginx/nginx.conf             # NGINX Reverse Proxy
│   ├── Dockerfile.frontend          # Multi-Stage Frontend
│   └── Dockerfile.backend           # Multi-Stage Backend
├── docker-compose.yml               # Lokale Entwicklung (DB only)
├── docker-compose.prod.yml          # Produktion (alles)
├── CHANGELOG.md                     # Haupt-Changelog
└── CLAUDE.md                        # Dieser File
```

---

## Brand & Design

### Farben
| Token | Hex | Verwendung |
|---|---|---|
| `primary-dark` | `#0a322d` | Sidebar BG, Überschriften, Primär-CTAs |
| `primary-mid` | `#1e7378` | Buttons, Links, Icons |
| `primary-light` | `#5afff5` | Aktiv-States, Highlights, Badges |
| `primary-pale` | `#befcfb` | Badge-Backgrounds, Hover-States |
| `bg-warm` | `#e7e2d3` | Haupt-Hintergrund |
| `bg-cool` | `#ebebf0` | Sekundärer Hintergrund, Input-BG |

### Logos
- **Dark Logo:** `/apps/frontend/public/logo-dark.svg` — Für helle Hintergründe
- **Light Logo:** `/apps/frontend/public/logo-light.svg` — Für dunkle Hintergründe (Sidebar)
- Logos immer proportional skalieren, nie strecken

---

## Datenbank-Migrations-Regeln

1. **Migrations sind immer additiv** — niemals `DROP TABLE` oder `DROP COLUMN` ohne explizite User-Freigabe
2. `prisma migrate dev` — nur für lokale Entwicklung
3. `prisma migrate deploy` — für Produktion (führt ausstehende Migrations aus, nie destruktiv)
4. Der Docker-Entrypoint führt `prisma migrate deploy` automatisch vor dem Start aus
5. Seed-Daten sind **immer** vom Migrations-Prozess getrennt
6. Rollbacks nur manuell mit separatem Down-Script und nach expliziter User-Freigabe

---

## Modul-Erstellung (Checkliste)

Wenn ein neues Modul hinzugefügt wird:

**Neue Dateien anlegen (kein Konfliktrisiko):**
- [ ] `apps/frontend/modules/[name]/` — Frontend-Komponenten anlegen
- [ ] `apps/frontend/modules/[name]/manifest.ts` — Manifest mit `id`, `name`, `href`, `icon` (optional `children`)
- [ ] `apps/frontend/lib/api/[name].ts` — API-Client-Funktionen für das Modul
- [ ] `apps/backend/src/modules/[name]/` — Backend-Routes/Services anlegen
- [ ] `modules/[name]/CHANGELOG.md` anlegen

**Registry-Einträge (je 1–2 Zeilen, trivial zu mergen):**
- [ ] `apps/frontend/lib/api/index.ts` — `export * from "./[name]";` hinzufügen
- [ ] `apps/frontend/lib/module-registry.ts` — Import + Eintrag in `MODULE_NAVIGATION[]`
- [ ] `apps/backend/src/core/route-registry.ts` — Import + Eintrag in `ROUTE_REGISTRY[]`
- [ ] `packages/db/prisma/schema.prisma` — Neue Models ergänzen, dann `pnpm db:migrate`

**Nicht anfassen (werden automatisch befüllt):**
- `apps/frontend/components/layout/Sidebar.tsx` — liest MODULE_NAVIGATION automatisch
- `apps/backend/src/index.ts` — iteriert ROUTE_REGISTRY automatisch

**Abschluss:**
- [ ] Haupt-CHANGELOG.md aktualisieren

---

## Git-Repository

Das Repository wird beim ersten Commit-Request abgefragt.

---

## Wichtige Befehle

```bash
# Entwicklung starten (alle Services)
pnpm dev

# Nur Datenbank starten (Docker)
docker compose up -d

# Datenbank Migration (Entwicklung)
pnpm db:migrate

# Datenbank Schema generieren
pnpm db:generate

# Prisma Studio
pnpm db:studio

# Build (alle Apps)
pnpm build

# Produktion (Docker)
docker compose -f docker-compose.prod.yml up -d --build
```
