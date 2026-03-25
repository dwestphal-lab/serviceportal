# Changelog — PLENIUM Backend

## [Unreleased]

## [0.3.0] - 2026-03-23

### Added
- `modules/auswertungen/routes.ts`: Neuer Endpoint `GET /api/v1/auswertungen/ticket-uebersicht` — aggregiert offene/überfällige Tickets und Rückrufe pro Mitarbeiter via TANSS-API (2 parallele Calls: `PUT /tickets` + `GET /callbacks`)

## [0.2.0] - 2026-03-20

### Added
- `@fastify/jwt` + `@fastify/cookie`: JWT-Session mit httpOnly-Cookie
- `core/auth-plugin.ts`: JWT-Plugin, `requireAuth` + `requireAdmin` Guards
- `modules/auth/`: Login (`POST /api/v1/auth/login`), Logout, `/me`
- `modules/auth/tanss.service.ts`: TANSS API-Client (Login, Dashboard-Stats), API-URL-Builder mit Backend-Toggle
- `modules/settings/`: SystemConfig CRUD, Berechtigungsmatrix, User-Verwaltung
- `modules/tanss-dashboard/`: Stats-Proxy `GET /api/v1/tanss-dashboard/stats`
- `core/config.ts`: JWT-Secret und Ablaufzeit (8h)

## [0.1.0] - 2026-03-20

### Added
- Fastify v5 Server-Setup mit TypeScript (ESM)
- Zentraler Config-Service mit Umgebungsvariablen-Validierung
- CORS-Konfiguration (@fastify/cors)
- Security-Header (@fastify/helmet)
- Health-Check Endpoint `GET /health`
- Status Endpoint `GET /api/v1/status`
- Globaler Error-Handler und 404-Handler
- Graceful Shutdown (SIGTERM/SIGINT)
- Modul-Registrierungs-Pattern vorbereitet (in src/index.ts)
