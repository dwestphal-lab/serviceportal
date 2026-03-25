# TANSS API — Projekt-Integrationen & Abhängigkeiten

> Diese Datei wird automatisch erweitert wenn TANSS-Integrationen gebaut werden.
> Enthält: Welche Apps nutzen welche TANSS-Routen, und welche Routen hängen voneinander ab.

## Route-Abhängigkeiten (Dependency Chains)

Viele TANSS-Operationen erfordern IDs die zuerst aus anderen Routen geholt werden müssen:

### Ticket erstellen (vollständig)
```
1. POST /api/v1/login                    → apiToken
2. POST /api/v1/search                   → companyId
3. GET  /api/v1/employees                → assignedToEmployeeId
4. GET  /api/v1/admin/ticketStates       → statusId
5. POST /api/v1/tickets                  → ticketId
6. POST /api/v1/tickets/{id}/upload      → Anhänge hochladen
7. POST /api/v1/tickets/{id}/comments    → Kommentar hinzufügen
```

### Support erfassen
```
1. POST /api/v1/login                    → apiToken
2. GET  /api/v1/tickets/own              → ticketId
3. GET  /api/v1/supportTypes/active      → planningType
4. POST /api/v1/supports                 → supportId
```

### Gerät anlegen (Device Management)
```
1. POST /api/v1/login                    → apiToken
2. POST /api/v1/search                   → companyId
3. GET  /api/v1/os                       → osId
4. GET  /api/v1/manufacturers            → manufacturerId
5. GET  /api/v1/cpus                     → cpuId
6. POST /api/v1/pcs                      → pcId
7. POST /api/v1/ips                      → IP zuweisen
8. POST /api/v1/components               → Komponenten hinzufügen
```

### Fernwartung importieren
```
1. (Externer REMOTE_SUPPORT Token)
2. POST /api/remoteSupports/v1/assignDevice    → Geräte-Mapping
3. POST /api/remoteSupports/v1/assignEmployee  → Techniker-Mapping
4. POST /api/remoteSupports/v1                 → Fernwartung importieren
```

---

## Projekt-Integrationen

Format für neue Einträge:

```markdown
### [App-Name] — [Kurzbeschreibung]
- **Datum:** YYYY-MM-DD
- **Auth-Methode:** Employee Login / ERP Token / etc.
- **Genutzte Routen:**
  - `METHOD /path` — Zweck
- **Feld-Mapping:**
  - App-Feld → TANSS-Feld
- **Notizen:** ...
```

### PLENIUM Service Portal — Auswertungen (Tagesberichte)
- **Datum:** 2026-03-23
- **App:** `apps/backend/src/modules/auswertungen/routes.ts`
- **Auth-Methode:** Employee Login (TANSS-Token aus JWT-Cookie des eingeloggten Users)
- **Genutzte Routen:**
  - `PUT /api/v1/supports/list` — Alle Leistungen eines Zeitraums abrufen
  - `GET /api/v1/employees/technicians` — Alle Techniker für Filter-Dropdown (via import.service.ts)
- **Request-Body für supports/list:**
  ```json
  {
    "timeframe": { "from": <unix>, "to": <unix> },
    "planningTypes": ["SUPPORT"],
    "employees": [<tanssId>]
  }
  ```
- **Feld-Mapping (Support → Auswertungskategorien):**
  - `internal=true, companyId=100000` → Plenium intern
  - `internal=true, companyId≠100000` → Kunden intern
  - `internal=false, durationNotCharged>0` → Ohne Berechnung (durationNotCharged Minuten)
  - `internal=false` → Mit Berechnung (`duration - durationNotCharged` Minuten)
  - Fahrzeit immer: `durationApproach + durationDeparture` Minuten
- **Zeiteinheit:** Minuten (nicht Sekunden wie API-Doku sagt!)
- **Notizen:**
  - `PUT /api/v1/supports/list` — POST gibt HTTP 405, GET gibt HTTP 405; nur PUT funktioniert
  - `companyId=100000` ist die interne Plenium-Firma in dieser TANSS-Instanz
  - Zeitpresets (heute/gestern/diese Woche/etc.) werden Frontend-seitig berechnet und als Unix-Timestamps gesendet

### PLENIUM Service Portal — Benutzerimport
- **Datum:** 2026-03-23
- **App:** `apps/backend/src/modules/settings/import.service.ts`
- **Auth-Methode:** Employee Login (Admin-Token)
- **Genutzte Routen:**
  - `GET /api/v1/employees/technicians` — Alle Techniker importieren
- **Feld-Mapping:**
  - `item.id` → `User.tanssId`
  - `item.loginName ?? item.username ?? item.userName` → `User.username`
  - `item.name` oder `firstName + lastName` → `User.displayName`
  - `item.shortName ?? item.kuerzel ?? item.initials` → `User.shortName`
- **Trigger:** Automatisch beim Admin-Login (fire-and-forget), und manuell via POST /api/v1/settings/users/import-from-tanss
