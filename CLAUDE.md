# CLAUDE.md — PLENIUM Service Portal

This file defines the **mandatory development workflow** and project conventions.
Every session **must** follow this workflow — **no exceptions**.

---

## Projekt: PLENIUM Service Portal

**Working Directory:** `c:\serviceportal`
**Stack:** Next.js 15 · Fastify v5 · PostgreSQL 17 · Prisma 6 · pnpm Workspaces · Turborepo · Docker + NGINX

> **Entwicklungs-Guide (Schritt-für-Schritt für alle Umgebungen):**
> Siehe [`ENTWICKLUNG.md`](./ENTWICKLUNG.md) — Web, iOS, Windows App, CLI, VS Code

---

## Git-Branch-Strategie

```
main          →  Produktion  — nur geprüfter, freigegebener Code
develop       →  Staging     —  gemeinsamer Integrations-Branch (Dev-Server)
  │
  ├── feature/kurzer-name   →  Neue Features
  └── fix/kurzer-name       →  Bugfixes
```

### Regeln
- **Niemand pusht direkt auf `main` oder `develop`** — immer über Feature/Fix-Branch
- Jede Aufgabe = eigener Branch: `feature/name` oder `fix/name`
- Feature/Fix fertig → Push → CI prüft → **automatischer Merge in `develop`** → Dev-Server aktualisiert sich
- `develop` stabil → PR auf `main` → Produktion (einzige manuelle Aktion)
- Feature/Fix-Branches nach Merge löschen
- Branch-Namen: Kleinbuchstaben, Bindestriche, kein Sonderzeichen
  Beispiele: `feature/ticketing-modul`, `fix/login-redirect`, `feature/auswertungen-export`

### Vollautomatischer Flow (Feature → Dev-Server)

```
Push auf feature/* oder fix/*
        ↓
auto-merge-develop.yml: TypeScript-Check (Frontend + Backend)
        ↓ bei Erfolg
Squash-Merge in develop (automatisch, kein GitHub-Klick nötig)
        ↓
poll-and-deploy.sh erkennt neuen Commit auf develop (alle 60s)
        ↓
docker compose up -d --build
        ↓
Dev-Server ist aktualisiert ✓
```

### Release-Flow (develop → Produktion)

```
Manueller PR: develop → main
        ↓
ci-feature.yml: TypeScript-Check (blockierend)
        ↓ bei Erfolg + expliziter Freigabe
Merge in main
        ↓
poll-and-deploy.sh erkennt neuen Commit auf main (alle 60s)
        ↓
docker compose up -d --build (Prod)
        ↓
Produktions-Server ist aktualisiert ✓
```

### CI/CD-Pipelines

| Workflow | Auslöser | Aufgabe |
|---|---|---|
| `auto-merge-develop.yml` | Push auf `feature/**` oder `fix/**` | TS-Check → **Auto-Merge in develop** |
| `deploy-dev.yml` | Push auf `develop` (nach Auto-Merge) | TS-Check (Logging) — Deploy per Polling |
| `ci-feature.yml` | PR auf `main` | TS-Check — **blockiert Release-Merge bei Fehler** |
| `deploy-prod.yml` | Push auf `main` (nach PR-Merge) | TS-Check (Logging) — Deploy per Polling |

### Server-Crontab (einmalig auf dem Server einrichten)

```bash
# crontab -e (als plenium-User)
* * * * * /opt/plenium/scripts/poll-and-deploy.sh develop >> /opt/plenium/logs/develop.log 2>&1
* * * * * /opt/plenium/scripts/poll-and-deploy.sh prod    >> /opt/plenium/logs/prod.log    2>&1
```

---

## Pflicht-Workflow (7 Schritte)

### 1. `[PLAN]` — Planung vor dem Coding
- Aufgabe analysieren und **Rückfragen stellen** falls unklar
- **Branch-Typ bestimmen:** `feature/` für neue Funktionen, `fix/` für Bugfixes
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

### 6. `[COMMIT]` — Branch, Commit & Push
- **Nur nach expliziter Freigabe durch den User**
- Auf dem richtigen Feature/Fix-Branch arbeiten (niemals direkt auf `develop` oder `main`)
- Commit-Message nach Convention (siehe unten)
- Push auf den Feature/Fix-Branch
- **GitHub Actions übernimmt automatisch:** CI-Check → Merge in `develop` → Deploy

### 7. `[MERGE]` — Nur für Releases (develop → main)
- Release-Merge **nur nach expliziter Freigabe** durch den User
- PR von `develop` auf `main` erstellen
- CI-Ergebnis abwarten, bei Fehlern sofort fixen
- Nach grünem CI: User mergt in GitHub (einziger manueller Schritt)
- Produktion updated sich automatisch per Polling

---

## Commit-Tag-Konvention

```
feat(core):         Neue Feature im Kern-System
feat(module/name):  Neue Feature in einem Modul
fix(core):          Bugfix im Kern
fix(module/name):   Bugfix in einem Modul
db(migration):      Neue Datenbank-Migration
docker:             Docker/Deployment Änderung
ci:                 GitHub Actions / Workflow Änderung
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

## PR-Format

Beim Erstellen eines PRs immer dieses Format verwenden:

```
Titel:  feat(module/name): Kurze Beschreibung (max. 72 Zeichen)

## Was wurde geändert?
- Bullet-Point 1
- Bullet-Point 2

## Warum?
Kurze Begründung der Änderung.

## Test-Plan
- [ ] Lokal getestet: [was genau]
- [ ] CI grün
- [ ] Keine neuen TypeScript-Fehler
- [ ] Kein Sicherheitsproblem eingeführt

## Merge-Ziel
- [ ] → develop  (Feature/Fix fertig)
- [ ] → main     (Release, nur nach Freigabe)
```

### Merge-Regeln
- PRs auf `develop`: 1 Review ausreichend (oder CI grün bei Solo-Arbeit)
- PRs auf `main`: **immer** explizite Freigabe durch den User
- Squash-Merge bevorzugt — ein sauberer Commit pro Feature/Fix
- Branch nach Merge löschen

### Konflikte lösen
Wenn beim Merge Konflikte entstehen:
1. `git fetch origin develop`
2. `git rebase origin/develop` auf dem Feature-Branch
3. Konflikte manuell auflösen, `git rebase --continue`
4. Force-Push auf den Feature-Branch: `git push --force-with-lease`
5. **Niemals** auf `develop` oder `main` rebasen/force-pushen

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

**Remote:** `github.com/dwestphal-lab/serviceportal`

### Branches im Remote
| Branch | Zweck | Deploy |
|---|---|---|
| `main` | Produktion | Polling → Prod-Server |
| `develop` | Staging / Integration | Polling → Dev-Server |
| `feature/*` | Neue Features | nur lokal / PR |
| `fix/*` | Bugfixes | nur lokal / PR |

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
