# PLENIUM — Linux Server Setup

> Einmalige Einrichtung. Der Server benötigt **keinen eingehenden Port** außer
> den internen Ports 80 / 8081-8083 (nur im internen Netz zugänglich).
>
> Voraussetzung: Ubuntu 22.04 / Debian 12, Root-Zugriff.

---

## 1. Basis-Software installieren

```bash
apt update && apt upgrade -y

# Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
docker compose version

# Git
apt install -y git nano curl
```

---

## 2. Firewall konfigurieren

```bash
ufw allow 22/tcp      # SSH (nur internes Netz)
ufw allow 80/tcp      # Produktion
ufw allow 8081/tcp    # DEV Westphal
ufw allow 8082/tcp    # DEV Asmussen
ufw allow 8083/tcp    # DEV Shared
ufw --force enable
```

> Alle Ports sind nur im internen Netz erreichbar — kein Internet-Routing nötig.

---

## 3. Deploy-User anlegen

```bash
useradd -m -s /bin/bash plenium
usermod -aG docker plenium
```

---

## 4. SSH-Zugang für Entwickler einrichten (optional)

Falls Entwickler sich direkt per SSH verbinden sollen (z.B. für Logs):

```bash
mkdir -p /home/plenium/.ssh
# Public Keys der Entwickler eintragen:
nano /home/plenium/.ssh/authorized_keys
chmod 700 /home/plenium/.ssh
chmod 600 /home/plenium/.ssh/authorized_keys
chown -R plenium:plenium /home/plenium/.ssh
```

*(Kein Deploy-Key für GitHub Actions nötig — der Server pullt selbst.)*

---

## 5. Verzeichnisstruktur anlegen

```bash
mkdir -p /opt/plenium/{repo,envs,logs}
chown -R plenium:plenium /opt/plenium
```

---

## 6. Repository clonen

```bash
su - plenium

# HTTPS-Clone (kein SSH-Key nötig für öffentliches Repo)
git clone https://github.com/DEIN-ORG/plenium-serviceportal.git /opt/plenium/repo

# Für privates Repo: Personal Access Token verwenden
# git clone https://TOKEN@github.com/DEIN-ORG/plenium-serviceportal.git /opt/plenium/repo

cd /opt/plenium/repo
git fetch --all
```

---

## 7. Umgebungsvariablen anlegen

```bash
nano /opt/plenium/envs/.env.dev-westphal
```

**`.env.dev-westphal`**
```env
PROJECT_NAME=plenium-westphal
NGINX_PORT=8081

POSTGRES_USER=plenium
POSTGRES_PASSWORD=dev_westphal_PASSWORT_AENDERN
POSTGRES_DB=plenium_westphal

NODE_ENV=production
DATABASE_URL=postgresql://plenium:dev_westphal_PASSWORT_AENDERN@postgres:5432/plenium_westphal
CORS_ORIGIN=http://192.168.1.100:8081
NEXT_PUBLIC_API_URL=http://192.168.1.100:8081
```

```bash
nano /opt/plenium/envs/.env.dev-asmussen
```

**`.env.dev-asmussen`**
```env
PROJECT_NAME=plenium-asmussen
NGINX_PORT=8082

POSTGRES_USER=plenium
POSTGRES_PASSWORD=dev_asmussen_PASSWORT_AENDERN
POSTGRES_DB=plenium_asmussen

NODE_ENV=production
DATABASE_URL=postgresql://plenium:dev_asmussen_PASSWORT_AENDERN@postgres:5432/plenium_asmussen
CORS_ORIGIN=http://192.168.1.100:8082
NEXT_PUBLIC_API_URL=http://192.168.1.100:8082
```

```bash
nano /opt/plenium/envs/.env.dev
```

**`.env.dev`**
```env
PROJECT_NAME=plenium-dev
NGINX_PORT=8083

POSTGRES_USER=plenium
POSTGRES_PASSWORD=dev_shared_PASSWORT_AENDERN
POSTGRES_DB=plenium_dev

NODE_ENV=production
DATABASE_URL=postgresql://plenium:dev_shared_PASSWORT_AENDERN@postgres:5432/plenium_dev
CORS_ORIGIN=http://192.168.1.100:8083
NEXT_PUBLIC_API_URL=http://192.168.1.100:8083
```

```bash
nano /opt/plenium/envs/.env.prod
```

**`.env.prod`**
```env
PROJECT_NAME=plenium-prod
NGINX_PORT=80

POSTGRES_USER=plenium_prod
POSTGRES_PASSWORD=SEHR_SICHERES_PASSWORT_HIER
POSTGRES_DB=plenium_prod

NODE_ENV=production
DATABASE_URL=postgresql://plenium_prod:SEHR_SICHERES_PASSWORT_HIER@postgres:5432/plenium_prod
CORS_ORIGIN=http://192.168.1.100
NEXT_PUBLIC_API_URL=http://192.168.1.100
```

```bash
chmod 600 /opt/plenium/envs/.env.*
```

---

## 8. Scripts ausführbar machen

```bash
chmod +x /opt/plenium/repo/scripts/deploy.sh
chmod +x /opt/plenium/repo/scripts/poll-and-deploy.sh
```

---

## 9. Cron-Jobs einrichten (als plenium-User)

```bash
su - plenium
crontab -e
```

Folgenden Inhalt eintragen:

```cron
# PLENIUM — Automatisches Deployment (jede Minute prüfen)
* * * * * /opt/plenium/repo/scripts/poll-and-deploy.sh dev-westphal >> /opt/plenium/logs/dev-westphal.log 2>&1
* * * * * /opt/plenium/repo/scripts/poll-and-deploy.sh dev-asmussen  >> /opt/plenium/logs/dev-asmussen.log  2>&1
* * * * * /opt/plenium/repo/scripts/poll-and-deploy.sh dev          >> /opt/plenium/logs/dev.log          2>&1
* * * * * /opt/plenium/repo/scripts/poll-and-deploy.sh prod         >> /opt/plenium/logs/prod.log         2>&1
```

Speichern und prüfen:

```bash
crontab -l    # Einträge anzeigen
```

---

## 10. GitHub-Zugriff testen

```bash
su - plenium
cd /opt/plenium/repo
git fetch origin --dry-run
# → Kein Fehler = Server kann GitHub erreichen
```

Falls ein **privates Repository** verwendet wird, muss ein Personal Access Token hinterlegt werden:

```bash
# Token einmalig in der Git-Konfiguration speichern
git config --global credential.helper store
git fetch origin
# → GitHub fragt nach Benutzername und Token (einmalig)
# → Token wird dauerhaft gespeichert
```

---

## 11. Erstes manuelles Deployment testen

```bash
su - plenium
/opt/plenium/repo/scripts/deploy.sh dev-westphal

# Status prüfen
docker ps | grep westphal

# Im Browser testen (von Entwickler-PC):
# http://192.168.1.100:8081
```

---

## Nützliche Wartungsbefehle

```bash
# Live-Logs einer Umgebung anzeigen
tail -f /opt/plenium/logs/dev-westphal.log

# Alle laufenden Container
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Logs eines Containers
docker logs plenium-westphal-backend --tail 50 -f

# Umgebung manuell deployen (ohne auf Cron zu warten)
/opt/plenium/repo/scripts/deploy.sh dev-westphal

# Umgebung stoppen
docker compose -f /opt/plenium/repo/docker-compose.dev.yml \
  --project-name plenium-westphal down

# Datenbank zurücksetzen (Achtung: löscht alle Daten!)
docker compose -f /opt/plenium/repo/docker-compose.dev.yml \
  --project-name plenium-westphal down -v

# Logs rotieren (verhindert volle Festplatte)
# In /etc/logrotate.d/plenium:
# /opt/plenium/logs/*.log {
#   daily
#   rotate 14
#   compress
#   missingok
#   notifempty
# }
```

---

## Logrotation einrichten (empfohlen)

```bash
nano /etc/logrotate.d/plenium
```

```
/opt/plenium/logs/*.log {
    daily
    rotate 14
    compress
    missingok
    notifempty
    create 0644 plenium plenium
}
```
