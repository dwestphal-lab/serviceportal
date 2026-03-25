# PLENIUM — CI/CD & Multi-Developer Workflow

> Pull-basiertes Deployment — **kein eingehender Port** nötig.
> Der Server holt sich selbst alle 60 Sekunden den neuesten Stand von GitHub.

---

## Architektur

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│  Entwickler-PC          GitHub                    Linux-Server (intern)     │
│                                                                              │
│  git push     ──────►  Repository    ◄── git fetch (jede Minute, Cron)     │
│                          │                          │                        │
│                          │                    neuer Commit?                 │
│                          │                     ja → deploy.sh               │
│                          │                          │                        │
│                          └── CI (TypeScript-Check)  │                       │
│                                                      ▼                      │
│                                              Docker Container               │
│                                              ┌──────────────────┐           │
│                                              │ Port 8081 (W-DEV)│           │
│                                              │ Port 8082 (M-DEV)│           │
│                                              │ Port 8083 (DEV)  │           │
│                                              │ Port 80   (PROD) │           │
│                                              └──────────────────┘           │
│                                                      │                      │
│  Browser    ──────────────────────────────────────── ┘ (internes Netz)     │
│  http://server-ip:8081                                                      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Der Server braucht nur:**
- Ausgehende Verbindung zu GitHub (HTTPS Port 443, haben alle Server)
- Keine eingehenden Ports außer 80/8081-8083 (intern, kein Internet)
- Kein SSH von außen

---

## Umgebungen & Ports

| Umgebung | Branch | Port | Browser-URL |
|---|---|---|---|
| Dev-Westphal | `dev-westphal` | `8081` | `http://192.168.1.100:8081` |
| Dev-Asmussen | `dev-asmussen` | `8082` | `http://192.168.1.100:8082` |
| DEV (shared) | `dev` | `8083` | `http://192.168.1.100:8083` |
| Produktion | `main` | `80` | `http://192.168.1.100` |

*(Server-IP anpassen)*

---

## Wie der automatische Ablauf funktioniert

### 1. Entwickler pusht

```bash
git add .
git commit -m "feat(auswertungen): Neues Feature"
git push origin dev-westphal
```

### 2. Server-Cron prüft (jede Minute)

```
cron: poll-and-deploy.sh dev-westphal
  → git fetch origin dev-westphal
  → Lokaler Hash ≠ Remote Hash?
     Ja → deploy.sh dev-westphal
       → git pull
       → docker compose up --build
  → In ~2 Minuten: http://server-ip:8081 ist aktuell
```

### 3. GitHub Actions (parallel, optional)

GitHub prüft zeitgleich den TypeScript-Code und zeigt bei Fehlern ein rotes X.
Das Deployment läuft aber unabhängig davon auf dem Server.

---

## Täglicher Workflow

### Morgens

```bash
git checkout dev-westphal
git fetch origin
git merge origin/dev    # Neueste gemeinsame Änderungen einspielen
```

### Arbeiten & testen

```bash
# Änderungen machen (Cursor, Claude, etc.)
git add .
git commit -m "feat(module/x): Beschreibung"
git push origin dev-westphal

# → Server erkennt Push innerhalb von 60 Sekunden
# → Build dauert ~2-3 Minuten
# → http://server-ip:8081 testen
```

### Zusammenführen (z.B. täglich oder nach Feature-Abschluss)

Auf GitHub Pull Request öffnen:
- `dev-westphal` → `dev`
- `dev-asmussen` → `dev`

Nach Merge: Server deployt `dev` auf Port 8083. Beide testen gemeinsam.

### Release in Produktion

Pull Request `dev` → `main`, einer approved → merge → auto-deploy Port 80.

---

## Deployment-Log auf dem Server prüfen

```bash
# Live-Log einer Umgebung anschauen
tail -f /opt/plenium/logs/dev-westphal.log

# Letzten Deploy-Status prüfen
tail -20 /opt/plenium/logs/dev-westphal.log
```

Beispiel-Output:
```
2026-03-23 14:22:01 Neuer Commit auf dev-westphal (a3f8c1d2) — starte Deployment...
2026-03-23 14:22:01 ▶ Deploy: dev-westphal (Branch: dev-westphal)
2026-03-23 14:24:12 ✓ dev-westphal bereit auf Port 8081
2026-03-23 14:24:12 ✓ Deployment dev-westphal abgeschlossen (a3f8c1d2)
```

---

## Weiterführende Anleitungen

| Schritt | Dokument |
|---|---|
| **Täglich: Entwickler-Workflow & KI-Anweisungen** | [ENTWICKLER-WORKFLOW.md](./ENTWICKLER-WORKFLOW.md) |
| **Einmalig: Linux-Server einrichten** | [SERVER-SETUP.md](./SERVER-SETUP.md) |
| **Einmalig: GitHub Repository einrichten** | [GITHUB-SETUP.md](./GITHUB-SETUP.md) |
