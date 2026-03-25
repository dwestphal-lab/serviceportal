# Changelog — PLENIUM Frontend

## [Unreleased]

## [0.4.1] - 2026-03-25

### Added
- `modules/admin/UserPermissionMatrix.tsx`: Krone-Icon ist jetzt klickbar — Admin-Status pro User togglebar
- `lib/api/settings.ts`: `settings.setAdmin(userId, isAdmin)` API-Funktion

## [0.4.0] - 2026-03-23

### Added
- `modules/auswertungen/TicketUebersicht.tsx`: Neue Seite mit Tabelle — offene Tickets, überfällige Tickets und offene Rückrufe pro Mitarbeiter, inkl. Summenzeile
- `app/auswertungen/ticket-uebersicht/page.tsx`: Route `/auswertungen/ticket-uebersicht`
- `modules/auswertungen/manifest.ts`: Sub-Navigation mit „Supports" und „Ticket-Übersicht" — Sidebar zeigt Untermenü automatisch

## [0.3.0] - 2026-03-23

### Added
- `SessionWatcher.tsx`: Client-Komponente zeigt Ablauf-Warnung 5 Minuten vor Session-Ende und führt automatischen Logout 30 Sekunden vor Ablauf durch
- Login-Seite zeigt Hinweis „Sitzung abgelaufen" bei Redirect mit `?reason=session_expired`
- `lib/api/_base.ts`: Globaler 401-Handler — automatischer Logout und Redirect zu `/login?reason=session_expired` bei abgelaufener Session
- `lib/auth.ts`: `SessionUser` enthält jetzt `exp`-Claim für Session-Timer

## [0.2.0] - 2026-03-20

### Added
- Login-Seite (`/login`): System-Dropdown, Benutzername, Passwort (toggle Sichtbarkeit), OTP
- Auth-Layout-Gruppe `(auth)`: Zentriertes Layout ohne Sidebar für Login
- Middleware (`middleware.ts`): Route-Schutz, Redirect zu /login bei fehlender Session
- `lib/auth.ts`: JWT-Payload aus Cookie lesen (serverseitig, für Server Components)
- `lib/api.ts`: Typsicherer API-Client mit Fehlerklasse `ApiError`
- Dashboard überarbeitet: TANSS-Statistiken statt Platzhalter-Cards
- `modules/tanss-dashboard/DashboardStats.tsx`: Client Component, Auto-Refresh alle 5min
- System-Settings-Seite (`/dashboard/settings/systems`): Systeme hinzufügen/bearbeiten/löschen
- Sidebar: Logout-Button, Admin-Bereich mit Einstellungen-Link, Modul-Sichtbarkeit per Berechtigungsmatrix
- Header: Benutzer-Initialen und Anzeigename

## [0.1.0] - 2026-03-20

### Added
- Next.js 15 Setup mit App Router und TypeScript (strict mode)
- Tailwind CSS v4 mit PLENIUM Brand Design System (CSS-first, @theme)
- Dashboard Layout: Sidebar (dunkel, #0a322d) + Header (weiß)
- Dashboard Page: Stats-Cards, Modul-Grid (Empty State), Aktivitätsliste, System-Status
- Sidebar: Core-Navigation + Modul-Navigation (dynamisch erweiterbar)
- Header: Suche, Benachrichtigungen, User-Avatar (Auth-Platzhalter)
- Logo-Komponente: dark/light Variante als SVG
- `cn()` Utility (clsx + tailwind-merge)
- Font: Inter (Google Fonts, next/font)
- `app/page.tsx` → Redirect zu /dashboard
- PLENIUM Brand-Farben als CSS Custom Properties
- Accessibility: Focus-Ring, ARIA-Labels, semantisches HTML
