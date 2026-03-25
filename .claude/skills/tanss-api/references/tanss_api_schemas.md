# TANSS API Datenmodelle

> api_version: 10.12.0
> Stand: 2026-03-19
> Quelle: https://api-doc.tanss.de/combined.yaml

## Response-Wrapper (alle Endpoints)

```
{
  "meta": {
    "linkedEntities": {
      "ticketStates": { "1": { "id": 1, "name": "Offen", "image": "..." } },
      "companies": { "123": { "id": 123, "name": "Firma GmbH" } },
      "employees": { "5": { "id": 5, "name": "Max Mustermann" } }
    },
    "properties": {}
  },
  "content": { ... }  // Eigentliche Daten (Objekt oder Array)
}
```

**linkedEntities** werden referenziert über IDs in den Content-Objekten (z.B. `companyId: 123` → `meta.linkedEntities.companies["123"]`).

---

## Ticket

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | int (readonly) | Ticket-ID |
| `companyId` | int | Firmen-ID |
| `remitterId` | int | Ersteller (Mitarbeiter-ID) |
| `title` | string | Betreff |
| `content` | string | Beschreibung |
| `internalContent` | string (readonly) | Interne Notizen (permission-abhängig) |
| `extTicketId` | string | Externe Ticket-ID |
| `creationDate` | timestamp (readonly) | Erstelldatum |
| `assignedToEmployeeId` | int | Zugewiesener Techniker |
| `assignedToDepartmentId` | int | Zugewiesene Abteilung |
| `assignmentName` | string (readonly) | Gerät/Mitarbeiter-Name |
| `statusId` | int | Status (→ linkedEntities.ticketStates) |
| `typeId` | int | Ticket-Typ |
| `linkTypeId` | int | Zuordnungstyp (Gerät/Mitarbeiter) |
| `linkId` | int | Zuordnungs-ID |
| `deadlineDate` | timestamp | Deadline |
| `dueDate` | timestamp | Fälligkeitsdatum |
| `project` | boolean | Ist Projekt |
| `projectId` | int | Übergeordnetes Projekt |
| `phaseId` | int | Projekt-Phase |
| `repair` | boolean | Reparatur-Ticket |
| `estimatedMinutes` | int | Geschätzte Minuten |
| `attention` | enum | NO \| YES \| RESUBMISSION \| MAIL |
| `installationFee` | enum | NO \| YES \| NO_PROJECT_INSTALLATION_FEE |
| `installationFeeDriveMode` | enum | NONE \| DRIVE_INCLUDED \| DRIVE_EXCLUDED |
| `installationFeeAmount` | double | Pauschal-Betrag |
| `separateBilling` | boolean | Separate Abrechnung |
| `serviceCapAmount` | double | Service-Cap |
| `orderById` | int | Auftragsart |
| `orderNumber` | string | Bestellnummer |
| `reminder` | timestamp | Erinnerung |
| `resubmissionDate` | timestamp | Wiedervorlage-Datum |
| `resubmissionText` | string | Wiedervorlage-Text |
| `localTicketAdminFlag` | enum | NONE \| LOCAL_ADMIN \| TECHNICIAN |
| `localTicketAdminEmployeeId` | int | Local Admin |
| `clearanceMode` | enum | DEFAULT \| DONT_CLEAR_SUPPORTS \| MAY_CLEAR_SUPPORTS |
| `relationshipLinkTypeId` | int | Verknüpftes Ticket (Typ) |
| `relationshipLinkId` | int | Verknüpftes Ticket (ID) |
| `modifiedBy` | int (readonly) | Letzter Bearbeiter |
| `modifiedTime` | timestamp (readonly) | Letzte Änderung |
| `modifiedText` | string (readonly) | Änderungsdetails |
| `numberOfDocuments` | int (readonly) | Anzahl Anhänge |
| `chats` | array (readonly) | Chat-IDs |
| `remitterDepartmentId` | int | Ersteller-Abteilung |
| `tags` | array | Tag-Zuordnungen |
| `subTickets` | array | Kind-Tickets (bei Projekten) |
| `nextSupport` | object (readonly) | Nächster geplanter Support |

---

## Comment

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | int | Kommentar-ID |
| `date` | timestamp (auto) | Datum (automatisch aktuell) |
| `employeeId` | int (auto) | Ersteller (automatisch eingeloggt) |
| `title` | string | Betreff |
| `content` | string | Inhalt |
| `internal` | boolean | Intern (nicht für Kunden sichtbar) |
| `commentOfId` | int | Ticket-ID |
| `pinned` | boolean | Angepinnt |

---

## Support (Leistungseintrag)

> ⚠ **Zeiteinheit: MINUTEN** — Trotz API-Dokumentation (die "Sekunden" sagt) sind alle Zeitfelder in **Minuten**. Bestätigt 2026-03-23 durch echte TANSS-Daten.

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | int | Support-ID |
| `ticketId` | int | Zugehöriges Ticket |
| `date` | timestamp | Datum (Unix-Timestamp, Sekunden) |
| `employeeId` | int | Techniker-ID |
| `companyId` | int | Firmen-ID — **100000 = interne Plenium-Firma** |
| `internal` | boolean | Intern (true) oder externer Kunde (false) |
| `location` | enum | OFFICE \| CUSTOMER \| REMOTE |
| `duration` | int | **Gesamtarbeitszeit (Minuten)** |
| `durationBreak` | int | **Pause (Minuten)** |
| `durationNotCharged` | int | **Nicht berechenbare Zeit (Minuten)** |
| `durationApproach` | int | **Anfahrt (Minuten)** |
| `durationDeparture` | int | **Abfahrt (Minuten)** |
| `text` | string | Beschreibung |
| `planningType` | object | Leistungsart (`{ id, name }`) |

### Zeitberechnungsformeln (PLENIUM Auswertungen)

```typescript
// Netto-Arbeitszeit
const netMinutes = duration - durationBreak;

// Kategorisierung
if (internal && companyId === 100000) → "Plenium intern"
if (internal && companyId !== 100000) → "Kunden intern"
if (!internal) {
  billedMinutes    = duration - durationNotCharged;  // "Mit Berechnung"
  notBilledMinutes = durationNotCharged;             // "Ohne Berechnung"
}

// Fahrzeit (unabhängig von Kategorie)
fahrtMinutes = durationApproach + durationDeparture;
```

### planningTypes Filter (für supports/list)
- `"SUPPORT"` — erbrachte Leistungen (empfohlen für Auswertungen)
- Andere Typen werden vom TANSS-System verwaltet

---

## Employee (Mitarbeiter)

> Vollständige Felder via `GET /api/v1/employees/{id}` bestätigt (Stand: 2026-03-20)

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | int | Mitarbeiter-ID |
| `name` | string | Anzeigename im Format **"Nachname, Vorname"** (z.B. "Westphal, Dirk") |
| `firstName` | string | Vorname |
| `lastName` | string | Nachname |
| `initials` | string | Kürzel (z.B. "DW") |
| `salutationId` | int | Anrede-ID (→ linkedEntities.salutations) |
| `departmentId` | int | Abteilungs-ID (→ linkedEntities.departments) |
| `room` | string | Raum |
| `telephoneNumber` | string | Telefon |
| `telephoneNumberTwo` | string | Telefon 2 |
| `mobilePhone` | string | Mobil |
| `mobileNumberTwo` | string | Mobil 2 |
| `emailAddress` | string | E-Mail |
| `personalFaxNumber` | string | Fax |
| `carId` | int | Fahrzeug-ID |
| `workingHourModelId` | int | Arbeitszeitmodell-ID |
| `accountingTypeId` | int | Abrechnungstyp-ID |
| `role` | string | Freitext-Rolle (z.B. "Senior IT-Consultant") |
| `titleId` | int | Titel-ID |
| `language` | string | Sprache (z.B. "de") |
| `birthday` | string | Geburtstag (ISO-Datum "YYYY-MM-DD") |
| `active` | boolean | Aktiv |
| `restrictedUserLicense` | boolean | Eingeschränkte Lizenz |
| `remark` | string | Bemerkung |
| `companyAccess` | string | Firmenzugriff (z.B. "ACCESS_TO_ALL_COMPANIES") |
| `companyAssignments` | array | Firmenzuordnungen (employeeId, companyId, Flags) |

### Wichtiger Hinweis: name-Format
`name` ist **"Nachname, Vorname"** — für die Anzeige umwandeln: `"Westphal, Dirk"` → `"Dirk Westphal"`.
Bevorzugt `firstName + " " + lastName` verwenden.

### linkedEntities im Employee-Response
```json
{
  "companies":    { "100000": { "name": "Firma GmbH" } },
  "departments":  { "78":     { "name": "30 3rd Level - Support" } },
  "salutations":  { "1":      { "gender": "MALE", "short": "Herr", "long": "Sehr geehrter Herr" } }
}
```

---

## Company (Firma)

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | int | Firmen-ID |
| `name` | string | Firmenname |
| `active` | boolean | Aktiv |

---

## PhoneCall (Telefonanruf)

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | int | DB-ID |
| `callId` | string | Externe Anruf-ID |
| `telephoneSystemId` | int | Telefonanlage-ID |
| `date` | timestamp | Zeitpunkt |
| `fromPhoneNumber` | string | Anrufer |
| `fromPhoneNrInfos` | PhoneNumberInfo | Anrufer-Auflösung |
| `toPhoneNumber` | string | Angerufener |
| `toPhoneNrInfos` | PhoneNumberInfo | Angerufener-Auflösung |
| `direction` | enum | INTERNAL \| INCOMING \| OUTGOING |
| `connectionEstablished` | boolean | Verbindung aufgebaut |
| `durationTotal` | int | Gesamtdauer (Sek.) |
| `durationCall` | int | Gesprächsdauer (Sek.) |
| `group` | string | Gruppierung |
| `phoneParticipants` | array | Techniker-Zuordnungen |

### PhoneParticipant

| Feld | Typ | Beschreibung |
|---|---|---|
| `phoneCallId` | int | Anruf-ID |
| `idString` | string | Identifier der Telefonanlage |
| `employeeId` | int | TANSS Mitarbeiter-ID |

### PhoneNumberInfo

| Feld | Typ | Beschreibung |
|---|---|---|
| `foundType` | enum | NONE \| TOO_SHORT \| COMPANY \| EMPLOYEE \| EMPLOYEE_INACTIVE |
| `items` | array | Mögliche Treffer |
| `result` | object | Ausgewählter Treffer (type, id, name, active) |

---

## Document (Ticket-Dokument)

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | int | Dokument-ID |
| `ticketId` | int | Ticket-ID |
| `fileName` | string | Dateiname |
| `mimeType` | string | MIME-Typ |
| `employeeId` | int | Uploader |
| `date` | timestamp | Upload-Datum |
| `internal` | boolean | Intern |
| `description` | string | Beschreibung |

---

## Screenshot/Image (Ticket-Bild)

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | int | Bild-ID |
| `ticketId` | int | Ticket-ID |
| `fileName` | string | Dateiname |
| `employeeId` | int | Uploader |
| `date` | timestamp | Upload-Datum |
| `internal` | boolean | Intern |
| `description` | string | Beschreibung |
| `image` | string | Base64-kodierte Bilddaten |
| `type` | string | Dateiendung (png, jpg) |

---

## RemoteSupport (Fernwartung)

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | int | ID |
| `remoteMaintenanceId` | string | Externe ID der Fernwartungssoftware |
| `typeId` | int | Typ (fix im API-Token) |
| `userId` | string | Techniker-Identifier (extern) |
| `userName` | string | Techniker-Anzeigename |
| `employeeId` | int | TANSS Mitarbeiter-ID |
| `deviceId` | string | Geräte-Identifier (extern) |
| `deviceName` | string | Geräte-Anzeigename |
| `companyId` | int | Firmen-ID |
| `linkTypeId` | int | Zuordnungstyp |
| `linkId` | int | Zuordnungs-ID |
| `startTime` | timestamp | Start |
| `endTime` | timestamp | Ende |
| `comment` | string | Kommentar |

---

## Timestamp (Zeitstempel)

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | int | ID |
| `employeeId` | int | Mitarbeiter-ID |
| `date` | timestamp | Zeitpunkt |
| `state` | enum | ON \| OFF \| PAUSE_START \| PAUSE_END |

---

## Timer

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | int | Timer-ID |
| `ticketId` | int | Zugehöriges Ticket |
| `employeeId` | int | Mitarbeiter |
| `startTime` | timestamp | Startzeit |
| `pauseTime` | timestamp | Pause seit |
| `running` | boolean | Läuft |

---

## TicketBoard Panel

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | int | Panel-ID |
| `name` | string | Panel-Name |
| `projectId` | int | Projekt-ID |
| `employeeId` | int | Mitarbeiter-ID |
| `panelType` | enum | DEFAULT \| PROJECT |
| `registerType` | enum | NONE \| COMPANY \| EMPLOYEE \| DEPARTMENT \| TAG \| TICKET_TYPE \| TICKET_STATUS \| PROJECT_PHASE |
| `includeProjects` | boolean | Projekt-Tickets einschließen |

---

## Callback (Rückruf)

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | int | ID |
| `employeeId` | int | Zuständiger Mitarbeiter |
| `companyId` | int | Firma |
| `contactId` | int | Kontaktperson |
| `phoneNumber` | string | Rückrufnummer |
| `text` | string | Notiz |
| `date` | timestamp | Erstellt |
| `done` | boolean | Erledigt |

---

## VacationRequest (Urlaubsantrag)

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | int | ID |
| `employeeId` | int | Mitarbeiter |
| `from` | timestamp | Von |
| `till` | timestamp | Bis |
| `days` | double | Anzahl Tage |
| `status` | enum | REQUESTED \| APPROVED \| DENIED |
| `planningType` | object | Art (Urlaub, Sonderurlaub, etc.) |

---

## WebHook Rule (TANSS Event Rule)

| Feld | Typ | Beschreibung |
|---|---|---|
| `id` | int | Regel-ID |
| `name` | string | Regelname |
| `active` | boolean | Aktiv |
| `linkType` | string | Auslöser-Typ |
| `event` | string | Event-Typ |
| `actions` | array | Aktionen (WebHook-URL, etc.) |

---

## Enums Übersicht

| Enum | Werte |
|---|---|
| Ticket.attention | NO, YES, RESUBMISSION, MAIL |
| Ticket.installationFee | NO, YES, NO_PROJECT_INSTALLATION_FEE |
| Ticket.installationFeeDriveMode | NONE, DRIVE_INCLUDED, DRIVE_EXCLUDED |
| Ticket.localTicketAdminFlag | NONE, LOCAL_ADMIN, TECHNICIAN |
| Ticket.clearanceMode | DEFAULT, DONT_CLEAR_SUPPORTS, MAY_CLEAR_SUPPORTS |
| Support.location | OFFICE, CUSTOMER, REMOTE |
| PhoneCall.direction | INTERNAL, INCOMING, OUTGOING |
| PhoneNumberInfo.foundType | NONE, TOO_SHORT, COMPANY, EMPLOYEE, EMPLOYEE_INACTIVE |
| Chat.status | OPEN, CLOSED |
| Chat.loadMessages | NONE, ALL, LAST |
| Timestamp.state | ON, OFF, PAUSE_START, PAUSE_END |
| Panel.panelType | DEFAULT, PROJECT |
| Panel.registerType | NONE, COMPANY, EMPLOYEE, DEPARTMENT, TAG, TICKET_TYPE, TICKET_STATUS, PROJECT_PHASE |
| IP.assignmentType | PC, PERIPHERY |
| Availability.timeType | TIME, TODAY, TOMORROW |
