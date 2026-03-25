# Entwicklungs-Guide — PLENIUM Service Portal

Schritt-für-Schritt-Anleitung für alle vier Arbeitsumgebungen.
**Kein Vorwissen nötig** — alles wird hier erklärt.

---

## Übersicht: Welche Umgebung für was?

| Umgebung | Ideal für | Git / Build lokal? |
|---|---|---|
| **Web** (claude.ai/code) | Schnelle Änderungen, unterwegs, überall | Nein — Claude nutzt GitHub direkt |
| **iOS App** | Unterwegs, kleine Aufgaben | Nein — wie Web |
| **Windows Desktop App** | Hauptarbeit am PC, voller Komfort | Ja — alles lokal |
| **CLI** (Terminal) | Fortgeschrittene, volle Kontrolle | Ja — alles lokal |
| **VS Code Extension** | Entwickler die Code sehen wollen | Ja — alles lokal |

---

## Was macht Claude automatisch — was muss ich selbst tun?

### Claude macht immer automatisch:
- Dateien lesen, schreiben, bearbeiten
- Code schreiben und reviewen
- Changelogs aktualisieren
- Commits erstellen (nach deiner Freigabe)
- PRs erstellen und beschreiben (nach deiner Freigabe)
- CI-Fehler analysieren und fixen

### Du musst immer selbst entscheiden:
- Plan freigeben ("Ja, mach das so")
- Commit erlauben ("Ja, committe das")
- Push erlauben ("Ja, pushe das")
- PR mergen (du klickst in GitHub auf "Merge")
- Release freigeben (`develop` → `main`)

---

## Szenario 1: Web (claude.ai/code) oder iOS App

### Einmalige Einrichtung

1. Öffne [claude.ai/code](https://claude.ai/code) im Browser (oder die Claude iOS App)
2. Melde dich mit deinem Anthropic-Konto an
3. Klicke auf **"Connect to GitHub"** (einmalig)
4. Erlaube Claude Zugriff auf das Repository `dwestphal-lab/serviceportal`
5. Wähle das Repository aus — fertig

### Neue Session starten

1. Öffne claude.ai/code
2. Wähle oben das Repository **`dwestphal-lab/serviceportal`**
3. Wähle den richtigen Branch (z.B. `feature/mein-feature` oder `develop`)
4. Schreibe deine Aufgabe in das Textfeld

### Wie du Aufgaben stellst (Vibe Coding)

Schreibe einfach auf Deutsch was du möchtest. Claude versteht natürliche Sprache.

**Beispiele für gute Aufgaben-Beschreibungen:**

```
Ich möchte ein neues Modul "Zeiterfassung" erstellen.
Es soll in der Sidebar erscheinen und eine einfache
Tabelle mit Start/Ende-Zeit und Mitarbeiter-Name zeigen.
```

```
Der Login-Button auf der Login-Seite ist zu klein auf
dem Handy. Bitte größer machen und besser sichtbar.
```

```
Bitte erstelle einen PR für das was wir gerade
entwickelt haben. Merge-Ziel ist develop.
```

### Typischer Ablauf (Web/iOS)

```
Du schreibst:   "Ich möchte Feature X"
                       ↓
Claude antwortet: [PLAN] mit Beschreibung was geändert wird
                       ↓
Du sagst:       "Ja, mach das so" oder "Ändere lieber..."
                       ↓
Claude:         [CODE] — schreibt alle Dateien
Claude:         [REVIEW] — prüft den Code selbst
Claude:         [LOG] — aktualisiert Changelogs
                       ↓
Du sagst:       "Sieht gut aus, committe das"
                       ↓
Claude:         Erstellt Commit auf dem Feature-Branch
                       ↓
Du sagst:       "Erstelle einen PR auf develop"
                       ↓
Claude:         Erstellt PR mit Titel, Beschreibung, Checkliste
                       ↓
Du:             Öffnest GitHub, schaust den PR an, klickst Merge
```

### Was im Web NICHT geht

- `pnpm dev` starten (kein lokaler Server)
- Den Build lokal testen
- Datenbankmigrationen ausführen

> **Tipp:** Für Datenbankmigrationen (`pnpm db:migrate`) immer die
> Windows-App, CLI oder VS Code verwenden.

---

## Szenario 2: Windows Desktop App

### Einmalige Einrichtung

1. Lade die **Claude Code Desktop App für Windows** herunter:
   [claude.ai/download](https://claude.ai/download)
2. Installiere die App (Setup-Assistent, einfach "Weiter" klicken)
3. Melde dich mit deinem Anthropic-Konto an
4. Die App öffnet sich mit einem leeren Fenster

### Repository einrichten (einmalig pro PC)

Öffne die **Windows PowerShell** (Win+R → `powershell` → Enter):

```powershell
# Git installieren falls noch nicht vorhanden
# https://git-scm.com/download/win — einfach installieren

# Ins gewünschte Verzeichnis wechseln
cd C:\

# Repository klonen (einmalig)
git clone https://github.com/dwestphal-lab/serviceportal.git

# In den Ordner wechseln
cd serviceportal

# pnpm installieren (falls nicht vorhanden)
npm install -g pnpm

# Abhängigkeiten installieren
pnpm install
```

### Neue Session starten (Windows App)

1. Öffne die **Claude Code Desktop App**
2. Klicke auf **"Open Folder"** (Ordner öffnen)
3. Wähle `C:\serviceportal`
4. Der Chat öffnet sich mit Zugriff auf alle Dateien
5. Schreibe deine Aufgabe

### Auf dem richtigen Branch arbeiten

Sage Claude zu Beginn der Session:

```
Wir arbeiten heute an Feature X.
Bitte erstelle einen neuen Branch feature/x
und arbeite auf diesem Branch.
```

Claude führt dann automatisch aus:
```bash
git checkout develop
git pull origin develop
git checkout -b feature/x
```

### Typischer Ablauf (Windows App)

```
Du sagst:   "Erstelle Branch feature/auswertungen-export
             und entwickle einen Export-Button"
                    ↓
Claude:     Erstellt Branch, entwickelt Feature
            (du siehst die Dateien sich verändern)
                    ↓
Du sagst:   "Starte die App lokal damit ich es teste"
                    ↓
Claude:     Führt aus: docker compose up -d && pnpm dev
                    ↓
Du:         Öffnest http://localhost:3000 und testest
                    ↓
Du sagst:   "Sieht gut aus, committe und push"
                    ↓
Claude:     Commit + Push auf feature/auswertungen-export
                    ↓
Du sagst:   "PR auf develop erstellen"
                    ↓
Claude:     Erstellt PR über GitHub
                    ↓
Du:         Öffnest GitHub → PR ansehen → Merge klicken
```

### Datenbank-Migration (nur lokal möglich)

Wenn Claude eine neue Datenbank-Tabelle erstellt hat:

```
Du sagst: "Führe die Datenbank-Migration durch"
```

Claude führt aus:
```bash
docker compose up -d   # Datenbank starten
pnpm db:migrate        # Migration anwenden
pnpm db:generate       # Prisma-Client neu generieren
```

### Nützliche Befehle die du Claude geben kannst

```
"Starte die lokale Entwicklungsumgebung"
"Zeige mir alle TypeScript-Fehler"
"Führe die Datenbank-Migration durch"
"Zeige mir den aktuellen Git-Status"
"Pull die neuesten Änderungen von develop"
"Löse den Merge-Konflikt in dieser Datei"
```

---

## Szenario 3: CLI (Terminal / Kommandozeile)

### Einmalige Einrichtung

Öffne PowerShell als Administrator:

```powershell
# Node.js installieren (falls nicht vorhanden)
# https://nodejs.org → LTS-Version herunterladen und installieren

# Claude Code CLI installieren
npm install -g @anthropic-ai/claude-code

# API-Key einrichten (einmalig)
claude config set api-key DEIN_API_KEY
# Den API-Key findest du unter: https://console.anthropic.com
```

### Neue Session starten (CLI)

```powershell
# In den Projektordner wechseln
cd C:\serviceportal

# Neueste Änderungen holen
git pull origin develop

# Claude starten
claude
```

Du siehst jetzt das Claude-Prompt `>` — hier kannst du Aufgaben eingeben.

### Wichtige CLI-Shortcuts

| Shortcut | Funktion |
|---|---|
| `Strg + C` | Aktuelle Aktion abbrechen |
| `Strg + L` | Chat leeren (neues Thema) |
| `/clear` | Kontext zurücksetzen |
| `/help` | Alle Befehle anzeigen |
| Pfeiltaste ↑ | Vorherige Eingabe wiederholen |

### Typischer Ablauf (CLI)

```powershell
cd C:\serviceportal
claude

> Ich möchte einen Bugfix für das Login-Problem machen.
  Der Redirect nach dem Logout zeigt einen Fehler.

# Claude analysiert, plant, wartet auf Freigabe

> Ja, mach das so

# Claude fixt den Bug, reviewed, updated Changelog

> Committe das als fix/logout-redirect und push

# Claude committed und pushed

> Erstelle einen PR auf develop

# Claude erstellt den PR
```

### CLI vs. Desktop App — wann was?

| Situation | Empfehlung |
|---|---|
| Schnelle Fixes | CLI — startet sofort |
| Längere Feature-Arbeit | Desktop App — komfortabler |
| Skripte / Automatisierung | CLI — besser steuerbar |
| Erstes Mal / Einsteiger | Desktop App — visueller |

---

## Szenario 4: VS Code Extension

### Einmalige Einrichtung

1. Öffne **VS Code**
2. Klicke auf das Extensions-Symbol (linke Seitenleiste, Puzzle-Symbol)
3. Suche nach **"Claude Code"**
4. Klicke auf **Installieren**
5. Nach Installation: VS Code neu starten
6. Links in der Seitenleiste erscheint das **Claude-Symbol**
7. Klicke drauf → API-Key eingeben (von console.anthropic.com)

### Projekt öffnen

1. VS Code öffnen
2. **Datei → Ordner öffnen** → `C:\serviceportal` wählen
3. Claude-Symbol in der Seitenleiste klicken
4. Chat-Fenster öffnet sich rechts

### Besonderheit: Code siehst du live

Der große Vorteil von VS Code: Du siehst **live wie Claude die Dateien verändert**.
Links der Code-Editor, rechts der Claude-Chat.

### Tastenkürzel (VS Code)

| Shortcut | Funktion |
|---|---|
| `Strg + Shift + P` → "Claude" | Claude-Befehle suchen |
| `Strg + Shift + C` | Claude Chat öffnen |
| Code markieren → Rechtsklick → "Ask Claude" | Ausgewählten Code erklären/verbessern |

### Aufgabe aus dem Code heraus stellen

Du kannst Code direkt markieren und Claude fragen:

1. Markiere eine Funktion im Code
2. Rechtsklick → **"Ask Claude about this"**
3. Stelle deine Frage: "Was macht dieser Code?" oder "Verbessere das"

### Typischer Ablauf (VS Code)

```
1. VS Code öffnen mit C:\serviceportal
2. Claude-Chat öffnen (Strg+Shift+C)
3. Im Chat: "Wir arbeiten an Feature X, erstelle Branch feature/x"
4. Claude erstellt Branch, du siehst Dateien sich ändern
5. Im Terminal (Strg+ö): pnpm dev → lokal testen
6. Im Chat: "Sieht gut aus, committe und PR auf develop"
```

### Terminal in VS Code öffnen

```
Strg + ö   (oder: Ansicht → Terminal)
```

Dann kannst du direkt im integrierten Terminal tippen:
```bash
pnpm dev          # Entwicklungsserver starten
pnpm db:migrate   # Migration ausführen
git status        # Status anzeigen
```

---

## Branch-Workflow — Schritt für Schritt

Dies gilt für **alle Umgebungen** (Web, App, CLI, VS Code).

### Neues Feature entwickeln

**Schritt 1 — Branch erstellen:**
```
Sage Claude: "Erstelle einen neuen Branch feature/mein-feature
              und arbeite auf diesem Branch"
```

**Schritt 2 — Aufgabe beschreiben:**
```
Sage Claude: "Ich möchte [genaue Beschreibung was das Feature tun soll]"
```

**Schritt 3 — Plan prüfen:**
```
Claude zeigt: [PLAN] Was wird geändert, welche Dateien, welche Risiken
Du sagst:    "Ja, so machen" oder "Ändere lieber X"
```

**Schritt 4 — Code & Review:**
```
Claude entwickelt automatisch und reviewed den Code selbst.
Du kannst zusehen oder kurz warten.
```

**Schritt 5 — Lokal testen (nur Windows App, CLI, VS Code):**
```
Sage Claude: "Starte die App lokal"
Öffne:       http://localhost:3000
Teste:       Das neue Feature manuell durchklicken
Sage Claude: "Funktioniert, mach weiter" oder "Da ist ein Fehler: ..."
```

**Schritt 6 — Commit & Push:**
```
Sage Claude: "Sieht gut aus, committe das und pushe den Branch"
```

**Schritt 7 — PR erstellen:**
```
Sage Claude: "Erstelle einen PR auf develop mit einer
              guten Beschreibung was wir gemacht haben"
```

**Schritt 8 — PR in GitHub mergen:**
```
1. Öffne github.com/dwestphal-lab/serviceportal/pulls
2. Öffne den neuen PR
3. Warte bis der grüne Haken (CI) erscheint
4. Klicke "Squash and merge"
5. Klicke "Confirm squash and merge"
6. Klicke "Delete branch" (Branch aufräumen)
```

---

### Bugfix durchführen

Gleicher Ablauf wie Feature, aber:
```
Branch-Name:  fix/kurzer-name  (statt feature/)
Commit-Tag:   fix(core): oder fix(module/name):
```

---

### Release: develop → main (Produktion)

**Nur nach expliziter Entscheidung!**

```
Sage Claude: "Wir sind bereit für einen Release.
              Erstelle einen PR von develop auf main."
```

Claude prüft dann:
- Gibt es offene PRs die noch rein sollen?
- Ist develop grün (CI)?
- Changelog aktuell?

Dann in GitHub:
1. PR `develop → main` öffnen
2. CI-Check abwarten (grüner Haken)
3. **"Merge pull request"** klicken (kein Squash hier — normaler Merge)
4. Produktion deployed sich automatisch (Polling alle 60s)

---

### Merge-Konflikt lösen

Wenn GitHub "This branch has conflicts" anzeigt:

```
Sage Claude: "Es gibt einen Merge-Konflikt auf meinem Branch.
              Bitte löse ihn auf."
```

Claude führt dann aus:
```bash
git fetch origin develop
git rebase origin/develop
# Konflikte auflösen
git rebase --continue
git push --force-with-lease
```

---

## Häufige Situationen — Was sage ich Claude?

### Session beginnen
```
"Wir arbeiten heute an [Thema].
 Ich bin auf Branch [Name] / Erstelle Branch feature/[name].
 Aktueller Stand: [was schon existiert oder was das Problem ist]"
```

### Mitten in der Arbeit
```
"Zeige mir was bisher geändert wurde"
"Was ist der aktuelle Git-Status?"
"Gibt es TypeScript-Fehler?"
"Erkläre mir was du gerade gemacht hast"
```

### Fehler auftauchen
```
"Im Terminal sehe ich diesen Fehler: [Fehlertext einfügen]"
"Die App startet nicht, hier ist die Ausgabe: [Ausgabe einfügen]"
"Der CI-Check ist fehlgeschlagen, hier das Log: [Log einfügen]"
```

### Review-Kommentar im PR beantworten
```
"Im PR hat jemand kommentiert: [Kommentar einfügen]
 Bitte bearbeite das."
```

### Nicht sicher was zu tun ist
```
"Ich weiß nicht wie ich anfangen soll.
 Erkläre mir kurz was der beste erste Schritt ist."
```

---

## Checkliste: Vor dem ersten Start

### Einmalig für jeden PC

- [ ] Git installiert ([git-scm.com](https://git-scm.com/download/win))
- [ ] Node.js installiert ([nodejs.org](https://nodejs.org) → LTS)
- [ ] pnpm installiert (`npm install -g pnpm`)
- [ ] Repository geklont (`git clone https://github.com/dwestphal-lab/serviceportal.git C:\serviceportal`)
- [ ] Abhängigkeiten installiert (`cd C:\serviceportal && pnpm install`)
- [ ] Docker Desktop installiert ([docker.com](https://www.docker.com/products/docker-desktop/)) — für die Datenbank
- [ ] Claude Code installiert (App oder CLI oder VS Code Extension)
- [ ] API-Key konfiguriert

### Vor jeder Session

- [ ] Docker Desktop läuft (Taskleiste unten rechts)
- [ ] `git pull origin develop` — neueste Änderungen holen
- [ ] Auf dem richtigen Branch oder neuen Branch erstellen lassen

---

## Schnell-Referenz: Alle Umgebungen im Vergleich

| | Web / iOS | Windows App | CLI | VS Code |
|---|---|---|---|---|
| Setup-Aufwand | Minimal | Mittel | Mittel | Mittel |
| Lokaler Buildtest | ❌ | ✅ | ✅ | ✅ |
| DB-Migration | ❌ | ✅ | ✅ | ✅ |
| Code live sehen | ❌ | ❌ | ❌ | ✅ |
| Unterwegs nutzbar | ✅ | ❌ | ❌ | ❌ |
| Für Einsteiger | ✅✅ | ✅✅ | ✅ | ✅ |
| Git automatisch | ✅ | ✅ | ✅ | ✅ |
| PR automatisch | ✅ | ✅ | ✅ | ✅ |
