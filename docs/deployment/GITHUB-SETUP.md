# PLENIUM — GitHub Repository Setup

> Einmalige Einrichtung des GitHub-Repositories für CI/CD und Branch-Protection.

---

## 1. Repository erstellen

Auf GitHub (github.com):
1. **New Repository** → Name: `plenium-serviceportal`
2. Visibility: **Private** (empfohlen)
3. README: Nein (Projekt hat bereits eines)
4. .gitignore: Nein (Projekt hat bereits eines)

---

## 2. Lokales Projekt mit GitHub verbinden

Im lokalen Projektordner (`c:\serviceportal`):

```bash
git init
git add .
git commit -m "feat(core): Initial commit — PLENIUM Service Portal"
git branch -M main
git remote add origin https://github.com/DEIN-ORG/plenium-serviceportal.git
git push -u origin main
```

Dann die weiteren Branches anlegen:

```bash
# Shared DEV Branch
git checkout -b dev
git push origin dev

# Persönliche DEV Branches
git checkout -b dev-westphal
git push origin dev-westphal

git checkout -b dev-asmussen
git push origin dev-asmussen

# Zurück zum Hauptbranch
git checkout main
```

---

## 3. GitHub Secrets einrichten

Unter `Settings → Secrets and variables → Actions` folgende Secrets anlegen:

| Secret Name | Wert | Beschreibung |
|---|---|---|
| `SERVER_HOST` | `123.456.78.90` | IP-Adresse des Linux-Servers |
| `SERVER_USER` | `plenium` | SSH-Benutzername (der deploy-User) |
| `SERVER_SSH_KEY` | `-----BEGIN OPENSSH PRIVATE KEY-----...` | **Kompletter** privater SSH-Key aus `/home/plenium/.ssh/deploy_key` |
| `SERVER_PORT` | `22` | SSH-Port (Standard: 22) |

**So liest du den privaten SSH-Key auf dem Server aus:**
```bash
cat /home/plenium/.ssh/deploy_key
# Den kompletten Output (inkl. BEGIN/END Zeilen) als Secret eintragen
```

---

## 4. Branch Protection Rules

Unter `Settings → Branches`:

### Branch: `main` (Produktion)

1. **Add branch protection rule** → Pattern: `main`
2. Aktivieren:
   - ✅ **Require a pull request before merging**
   - ✅ **Require approvals** → Anzahl: **1**
   - ✅ **Require status checks to pass before merging**
     - Status-Check hinzufügen: `deploy-prod` (erscheint nach dem ersten Workflow-Run)
   - ✅ **Do not allow bypassing the above settings**
3. Speichern

### Branch: `dev` (Shared DEV)

1. **Add branch protection rule** → Pattern: `dev`
2. Aktivieren:
   - ✅ **Require a pull request before merging**
   - ✅ **Require approvals** → Anzahl: **0** (kein Approval nötig für DEV)
   - ✅ **Require status checks to pass before merging**
     - Status-Check: `deploy-dev`
3. Speichern

### Branches: `dev-westphal`, `dev-asmussen`

Keine Restrictions — direkter Push erlaubt.

---

## 5. GitHub Actions Workflows

Die Workflows liegen im Repository unter `.github/workflows/`:

| Datei | Trigger | Deployment |
|---|---|---|
| `deploy-dev-westphal.yml` | Push auf `dev-westphal` | Server Port 8081 |
| `deploy-dev-asmussen.yml` | Push auf `dev-asmussen` | Server Port 8082 |
| `deploy-dev.yml` | Push/Merge auf `dev` | Server Port 8083 |
| `deploy-prod.yml` | Push/Merge auf `main` | Server Port 80/443 |

---

## 6. Deployment-Benachrichtigungen (optional)

Unter `Settings → Notifications` können E-Mail-Benachrichtigungen für fehlgeschlagene Deployments eingerichtet werden.

Alternativ: GitHub Actions können Slack/Teams-Nachrichten senden (erfordert zusätzliche Konfiguration).

---

## 7. Collaborator einladen

Unter `Settings → Collaborators → Add people`:
- GitHub-Username des zweiten Entwicklers eingeben
- Rolle: **Write** (kann pushen, Pull Requests erstellen)

---

## 8. Empfohlene Arbeitsweise für beide Entwickler

Jeder Entwickler klont das Repository einmalig auf seinem lokalen Rechner:

```bash
# Windows (PowerShell / Git Bash)
git clone https://github.com/DEIN-ORG/plenium-serviceportal.git c:\serviceportal
cd c:\serviceportal

# Eigenen Branch auschecken
git checkout dev-westphal   # oder dev-asmussen
```

Täglicher Workflow (vibe-coding freundlich):

```bash
# Morgens: auf Stand bringen
git fetch origin
git merge origin/dev        # Neueste gemeinsame Änderungen einspielen

# Arbeiten und pushen
git push origin dev-westphal
# → GitHub Actions deployt automatisch
# → In ~2 Minuten testen auf http://server-ip:8081
```

---

## Schnell-Referenz: GitHub Actions Status prüfen

1. GitHub Repository öffnen
2. **Actions** Tab → laufende / abgeschlossene Deployments sehen
3. Bei Fehler: auf den fehlgeschlagenen Run klicken → Logs lesen

Oder direkt per URL:
```
https://github.com/DEIN-ORG/plenium-serviceportal/actions
```
