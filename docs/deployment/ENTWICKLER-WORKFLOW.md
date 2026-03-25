# PLENIUM — Entwickler-Workflow & KI-Anweisungen

> Anleitung für Westphal und Asmussen — was ihr täglich tun müsst
> und welche Anweisungen ihr Claude (oder Cursor) geben könnt.

---

## Eure Umgebungen

| Entwickler | Branch | Test-URL |
|---|---|---|
| Westphal | `dev-westphal` | `http://192.168.1.100:8081` |
| Asmussen | `dev-asmussen` | `http://192.168.1.100:8082` |
| Gemeinsam (DEV) | `dev` | `http://192.168.1.100:8083` |
| Produktion | `main` | `http://192.168.1.100` |

*(Server-IP durch eure tatsächliche interne IP ersetzen)*

---

## Phase 1 — Persönliches Testen auf der eigenen DEV-Umgebung

### Was passiert automatisch

1. Ihr pusht euren Branch → Server erkennt den Push innerhalb von 60 Sekunden
2. Docker baut neu und startet (~2-3 Minuten)
3. Eure Test-URL ist aktuell

### Anweisungen an Claude / Cursor

Wenn ihr ein Feature fertig habt und testen wollt:

```
"Bitte committe und pushe alle Änderungen auf meinen Branch dev-westphal
mit der Message: feat(auswertungen): [kurze Beschreibung]"
```

```
"Committe alles auf dev-asmussen mit der Message: fix(admin): [Beschreibung]"
```

```
"Pushe den aktuellen Stand auf meinen Branch dev-westphal —
ich möchte die Änderungen auf http://192.168.1.100:8081 testen"
```

### Was Claude dann tut

```bash
git add .
git commit -m "feat(modul): Beschreibung"
git push origin dev-westphal
# → Ihr könnt nach ~3 Minuten auf eurer URL testen
```

### Testen auf der eigenen URL

Öffnet einfach den Browser:
- Westphal: `http://192.168.1.100:8081`
- Asmussen: `http://192.168.1.100:8082`

Falls etwas nicht stimmt, schreibt Claude:
```
"Das Feature auf http://192.168.1.100:8081 funktioniert nicht richtig.
[Fehlerbeschreibung]. Bitte fix und pushe erneut auf dev-westphal."
```

---

## Phase 2 — Zusammenführen in DEV (gemeinsames Testen)

### Wann macht ihr das?

- Wenn ihr ein Feature fertig und auf eurer persönlichen URL getestet habt
- Mindestens einmal täglich (am Ende des Arbeitstages)
- Wenn ihr möchtet, dass der andere eure Änderungen sieht

### Anweisungen an Claude / Cursor

```
"Erstelle auf GitHub einen Pull Request von dev-westphal nach dev
mit dem Titel: [Kurzbeschreibung was ihr gemacht habt]"
```

```
"Merge meinen Branch dev-asmussen in dev — ich habe alles auf
http://192.168.1.100:8082 getestet und es funktioniert."
```

```
"Führe dev-westphal und dev-asmussen in den dev-Branch zusammen
und löse eventuelle Konflikte."
```

### Was Claude dann tut

```bash
# Option A: Direkter Merge (wenn kein Konflikt erwartet)
git checkout dev
git fetch origin
git merge origin/dev-westphal
git merge origin/dev-asmussen
git push origin dev

# Option B: Pull Request auf GitHub erstellen
gh pr create --base dev --head dev-westphal --title "..."
```

### Nach dem Merge

→ Server deployt `dev` automatisch innerhalb von ~3-4 Minuten
→ Beide testen gemeinsam auf `http://192.168.1.100:8083`

Wenn Probleme auf der gemeinsamen DEV auftauchen:
```
"Auf http://192.168.1.100:8083 gibt es einen Fehler: [Beschreibung].
Bitte fix auf dev-westphal und merge erneut in dev."
```

---

## Phase 3 — Release in die Produktion

### Wann macht ihr das?

- Wenn beide auf `http://192.168.1.100:8083` getestet haben
- Wenn alle geplanten Features für diesen Release fertig sind
- Empfehlung: einmal pro Woche oder nach abgeschlossenem Feature-Set

### Voraussetzungen

- Beide haben ihre Änderungen in `dev` gemergt
- Auf `http://192.168.1.100:8083` wurde gemeinsam getestet
- Einer der Entwickler "approved" den Release (GitHub Branch Protection)

### Anweisungen an Claude / Cursor

**Westphal (oder Asmussen) gibt Claude folgendes:**

```
"Erstelle einen Pull Request von dev nach main für den Produktions-Release.
Titel: Release [Datum] — [kurze Zusammenfassung der Änderungen]"
```

```
"Bereite den Produktions-Release vor: merge dev in main und
pushe — wir haben alles auf http://192.168.1.100:8083 getestet."
```

### Was dann passiert

1. Claude erstellt den PR auf GitHub
2. Der andere Entwickler öffnet GitHub und klickt **Approve + Merge**
   - Westphal: gibt Asmussen Bescheid
   - Asmussen: gibt Westphal Bescheid
3. Nach dem Merge: Server deployt Produktion automatisch in ~3-4 Minuten
4. Testen auf `http://192.168.1.100`

**Oder Claude erledigt alles wenn beide einverstanden sind:**
```
"Wir haben dev auf http://192.168.1.100:8083 gemeinsam getestet,
alles ok. Erstelle den PR von dev nach main, ich approves ihn gleich."
```

---

## Morgens starten (tägliche Routine)

### Anweisung an Claude am Morgen

```
"Bring meinen Branch dev-westphal auf den neuesten Stand von dev —
hole dir die Änderungen des anderen Entwicklers."
```

```
"Sync dev-asmussen mit dem aktuellen dev-Branch bevor wir anfangen."
```

Was Claude dann tut:
```bash
git checkout dev-westphal
git fetch origin
git merge origin/dev
# Eventuelle Konflikte lösen
git push origin dev-westphal
```

---

## Konflikte (wenn beide an der gleichen Datei gearbeitet haben)

### Anweisung an Claude

```
"Es gibt Merge-Konflikte beim Zusammenführen von dev-westphal in dev.
Bitte löse die Konflikte — im Zweifel behalte beide Änderungen."
```

```
"Löse den Merge-Konflikt in [Dateiname] — meine Änderung soll
Vorrang haben / Asmussens Änderung soll Vorrang haben."
```

---

## Schnell-Referenz: Alle Anweisungen auf einen Blick

### Feature fertig → eigene URL testen
```
"Committe und pushe auf dev-westphal: [commit message]"
```

### Eigene URL testen → DEV zusammenführen
```
"Merge dev-westphal in dev — auf http://192.168.1.100:8081 getestet."
```

### DEV getestet → Produktion
```
"Erstelle PR von dev nach main für Produktions-Release."
```

### Morgens synchronisieren
```
"Sync dev-westphal mit aktuellem dev-Stand."
```

### Deployment-Status prüfen
```
"Ist mein letzter Push auf dev-westphal schon deployed?
Wie lange dauert das noch?"
```

*(Claude kann nicht direkt auf den Server zugreifen —
schaut selbst auf http://192.168.1.100:8081 ob die Änderung zu sehen ist.)*

---

## Commit-Message Konvention

Damit das Changelog automatisch sauber bleibt, bitte folgendes Format:

```
feat(module/name):    Neues Feature in einem Modul
fix(module/name):     Bugfix in einem Modul
feat(core):           Neue Funktion im Kern
fix(core):            Bugfix im Kern
docs:                 Dokumentation
config:               Konfiguration
```

**Beispiele:**
```
feat(auswertungen): PDF-Export hinzugefügt
fix(admin): Berechtigungsmatrix lädt jetzt korrekt
feat(core): JWT-Timeout auf 12h erhöht
```

Anweisung an Claude:
```
"Committe mit einer passenden Commit-Message nach der Projektkonvention."
```

---

## Neues Modul hinzufügen

Das Projekt nutzt ein Registry-Muster — `Sidebar.tsx` und `backend/index.ts` werden **nie** angefasst.
Jedes neue Modul besteht nur aus neuen Dateien + je 1–2 Zeilen in Registry-Dateien.

### Anweisung an Claude

```
"Erstelle ein neues Modul '[Name]' mit folgender Funktion: [Beschreibung].
Lege alle nötigen Dateien an und registriere das Modul in den Registry-Dateien."
```

### Was Claude dann anlegt

| Datei | Aktion |
|---|---|
| `apps/frontend/modules/[name]/manifest.ts` | NEU — id, name, href, icon |
| `apps/frontend/lib/api/[name].ts` | NEU — API-Client-Funktionen |
| `apps/backend/src/modules/[name]/routes.ts` | NEU — Fastify-Routen |
| `modules/[name]/CHANGELOG.md` | NEU |
| `apps/frontend/lib/api/index.ts` | +1 Zeile `export * from "./[name]"` |
| `apps/frontend/lib/module-registry.ts` | +2 Zeilen (import + Array-Eintrag) |
| `apps/backend/src/core/route-registry.ts` | +2 Zeilen (import + Array-Eintrag) |
| `Sidebar.tsx` | NICHT ANGEFASST |
| `backend/src/index.ts` | NICHT ANGEFASST |

### Konfliktrisiko

Da nur neue Dateien + minimale Registry-Änderungen anfallen, können beide Entwickler
unabhängig an verschiedenen Modulen arbeiten — Merge-Konflikte sind quasi ausgeschlossen.

---

## Falls etwas schiefläuft

### Deployment hängt / URL nicht erreichbar

```
"Die URL http://192.168.1.100:8081 ist nicht erreichbar nach dem Push.
Was könnte das Problem sein?"
```

Claude kann den Server-Zustand nicht direkt prüfen — dann müsst ihr:
1. Auf dem Server einloggen: `ssh plenium@192.168.1.100`
2. Logs prüfen: `tail -50 /opt/plenium/logs/dev-westphal.log`
3. Docker-Status: `docker ps | grep westphal`

### Datenbank zurücksetzen (DEV-Umgebung)

```
"Setze die Datenbank meiner DEV-Umgebung (dev-westphal, Port 8081) zurück —
ich möchte mit einem frischen Stand anfangen."
```

*(Das macht Claude NICHT automatisch — es löscht alle Daten.
Nur auf explizite Anweisung und nur in DEV-Umgebungen!)*
