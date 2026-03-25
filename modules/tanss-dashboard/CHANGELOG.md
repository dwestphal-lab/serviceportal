# Changelog — TANSS Dashboard

Alle Änderungen am Modul `tanss-dashboard` werden hier dokumentiert.

---

## [0.1.0] — 2026-03-20

### Added
- Dashboard-Karte: Offene Tickets (via `GET /api/v1/tickets?state=open`)
- Dashboard-Karte: Überfällige Tickets (via `GET /api/v1/tickets?state=overdue`, rote Hervorhebung)
- Dashboard-Karte: Offene Rückrufgesuche (via `GET /api/v1/reminders?open=true`)
- Automatische Aktualisierung alle 5 Minuten
- Manueller Refresh-Button mit Zeitstempel
- Fehleranzeige bei nicht erreichbarem TANSS
- Backend-Proxy-Route: `GET /api/v1/tanss-dashboard/stats`
