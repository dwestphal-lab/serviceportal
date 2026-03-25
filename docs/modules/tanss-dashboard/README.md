# Modul: TANSS Dashboard

**Modul-ID:** `tanss-dashboard`
**Sichtbar für:** Alle authentifizierten Benutzer (automatisch freigeschaltet)

---

## Wofür ist dieses Modul?

Das TANSS Dashboard zeigt eine persönliche Echtzeit-Übersicht Ihrer TANSS-Tickets direkt im PLENIUM Service Portal. Nach der Anmeldung sehen Sie auf einen Blick:

- **Offene Tickets** — Wie viele Ihrer Tickets aktuell offen sind
- **Überfällige Tickets** — Tickets deren Fälligkeitsdatum überschritten ist (rot hervorgehoben)
- **Rückrufgesuche** — Offene Rückrufanfragen

Die Daten werden automatisch alle **5 Minuten** aktualisiert.

---

## Bedienung

### Ansicht öffnen

Nach der Anmeldung landen Sie automatisch auf dem Dashboard. Die TANSS-Statistiken werden oben auf der Seite angezeigt.

### Manuell aktualisieren

Klicken Sie auf den **Aktualisieren**-Button (Pfeilsymbol) rechts neben "TANSS Übersicht", um die Daten sofort neu zu laden.

### Fehlermeldung "TANSS nicht erreichbar"

Wenn die Verbindung zu TANSS unterbrochen ist, erscheint eine rote Fehlermeldung. Mögliche Ursachen:
- TANSS-Server nicht erreichbar
- Session abgelaufen (bitte neu anmelden)
- Falsche System-Konfiguration (Admin kontaktieren)

---

## Technische Details

Die Daten werden über das PLENIUM Backend als Proxy von TANSS abgerufen. Der TANSS-Token aus der aktuellen Session wird dabei serverseitig für die API-Anfragen verwendet — Zugangsdaten werden nicht im Browser gespeichert.

**TANSS-Endpunkte:**
- `GET /api/v1/tickets?state=open` — Offene Tickets
- `GET /api/v1/tickets?state=overdue` — Überfällige Tickets
- `GET /api/v1/reminders?open=true` — Rückrufgesuche

---

## Changelog

Siehe [CHANGELOG.md](../../../modules/tanss-dashboard/CHANGELOG.md)
