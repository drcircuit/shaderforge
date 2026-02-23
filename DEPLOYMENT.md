# ShaderForge — Deployment Guide

## Architecture overview

```
shaderforge.net  (Cloudflare Pages — Vue 3 SPA, free)
        │
        │ HTTPS REST
        ▼
api.shaderforge.net  (Cloudflare Tunnel → Raspberry Pi, .NET 9 API)
        │
        │ local Unix socket / 127.0.0.1
        ▼
PostgreSQL  (Docker container on the same Pi — shaderforge DB)
        │
        │ azcopy (daily systemd timer)
        ▼
Azure Blob Storage  (shaderforge-backups container, 7-day retention)
```

### Why this stack?

| Component | What it provides |
|-----------|-----------------|
| **Raspberry Pi (self-hosted)** | Zero hosting cost, full control, runs API + DB together |
| **Docker Compose** | Repeatable, isolated services; easy restart/upgrade |
| **Cloudflare Tunnel** | Secure HTTPS on `api.shaderforge.net` — no port-forwarding needed |
| **Cloudflare Pages** | Global CDN, custom domain, unlimited requests, SPA routing |
| **Azure Blob Storage** | Durable off-site backup target; pay only for storage used |

---

## CI/CD pipeline

```
Pull Request → ci.yml
  ├── test-api   (dotnet test)
  └── test-ui    (lint + jest)

Push to main
  ├── ci.yml (same gates)
  ├── deploy-api.yml   (if ShaderForge.API/** changed)
  │     ├── job: test   → dotnet test  (ubuntu-latest)
  │     └── job: deploy → self-hosted Pi runner
  │           ├── checkout
  │           ├── docker compose build api
  │           └── docker compose up -d api
  └── deploy-ui.yml    (if shaderforge.ui/** changed)
        ├── job: test   → lint + jest
        └── job: deploy → cloudflare/pages-action
```

Database migrations run automatically via `Database.Migrate()` in `Program.cs` on every API startup.

---

## One-time setup

### 1. Raspberry Pi — prerequisites

```bash
# Install Docker + Compose plugin
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # log out and back in after this

# Confirm
docker compose version
```

---

### 2. Docker Compose — API + PostgreSQL

Create `/home/pi/shaderforge/docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_USER: shaderforge
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: shaderforge
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"   # bind to loopback only

  api:
    build:
      context: .
      dockerfile: ShaderForge.API/Dockerfile
    restart: unless-stopped
    depends_on:
      - postgres
    ports:
      - "127.0.0.1:8080:8080"   # bind to loopback only
    env_file:
      - .env
    environment:
      ASPNETCORE_ENVIRONMENT: Production

volumes:
  pgdata:
```

> Both services bind only to `127.0.0.1` — the Pi is not directly reachable from the internet; Cloudflare Tunnel handles inbound HTTPS.

---

### 3. Environment / secrets (`.env`)

Create `/home/pi/shaderforge/.env` (not committed to VCS — add `.env` to `.gitignore`):

```dotenv
# PostgreSQL password (must match POSTGRES_PASSWORD in docker-compose.yml)
POSTGRES_PASSWORD=<strong-random-password>

# .NET API connection string
ConnectionStrings__DefaultConnection=Host=postgres;Port=5432;Database=shaderforge;Username=shaderforge;Password=<strong-random-password>

# JWT secret — minimum 32 characters
Jwt__Secret=<openssl rand -hex 32>

# CORS — allow the Cloudflare Pages frontend
Cors__AllowedOrigins__0=https://shaderforge.net
Cors__AllowedOrigins__1=https://www.shaderforge.net
```

> **Security:** `.env` must be readable only by the service account running Docker (`chmod 600 .env`). Never commit this file to version control.

---

### 4. Cloudflare Tunnel (systemd)

The tunnel exposes the local API container to `api.shaderforge.net` without opening any inbound firewall ports.

```bash
# Install cloudflared
curl -L --output cloudflared.deb \
  https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64.deb
sudo dpkg -i cloudflared.deb

# Authenticate and create a tunnel
cloudflared tunnel login
cloudflared tunnel create shaderforge

# Configure the tunnel — /etc/cloudflared/config.yml
# tunnel: <tunnel-id>
# credentials-file: /root/.cloudflared/<tunnel-id>.json
# ingress:
#   - hostname: api.shaderforge.net
#     service: http://localhost:8080
#   - service: http_status:404

# Add DNS CNAME in Cloudflare dashboard:
#   api.shaderforge.net → <tunnel-id>.cfargotunnel.com  (Proxied)

# Install as a system service
sudo cloudflared service install
sudo systemctl enable --now cloudflared
```

---

### 5. Cloudflare Pages (frontend)

1. Go to <https://dash.cloudflare.com> → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
2. Select the **drcircuit/shaderforge** repository.
3. Configure the build:

   | Setting | Value |
   |---------|-------|
   | Framework preset | None |
   | Build command | `cd shaderforge-engine && npm install && npm run build && cd ../shaderforge.ui && npm install && npm run build` |
   | Build output directory | `shaderforge.ui/dist` |

4. Under **Environment variables**, add:

   | Variable | Value |
   |----------|-------|
   | `VUE_APP_API_BASE_URL` | `https://api.shaderforge.net/api` |

5. Click **Save and Deploy**.

> **Tip:** The `_redirects` file (`shaderforge.ui/public/_redirects`) handles Vue Router's history-mode SPA fallback automatically.

---

### 6. DNS (Cloudflare)

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| `CNAME` | `shaderforge.net` (root) | `shaderforge.pages.dev` | ✅ Proxied |
| `CNAME` | `www` | `shaderforge.pages.dev` | ✅ Proxied |
| `CNAME` | `api` | `<tunnel-id>.cfargotunnel.com` | ✅ Proxied |

---

### 7. GitHub Actions — self-hosted runner on the Pi

```bash
# On the Pi: follow the on-screen instructions from:
# GitHub → drcircuit/shaderforge → Settings → Actions → Runners → New self-hosted runner
# Choose Linux / ARM64, then run the provided commands.

# Install as a service so it survives reboots
sudo ./svc.sh install
sudo ./svc.sh start
```

> Label the runner `pi` — the deploy workflow targets `runs-on: [self-hosted, pi]`.

---

### 8. GitHub Secrets

Go to **GitHub → drcircuit/shaderforge → Settings → Secrets and variables → Actions** and add:

| Secret | Purpose |
|--------|---------|
| `CLOUDFLARE_API_TOKEN` | Deploy UI to Cloudflare Pages |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Pages account |

> API deployment no longer requires any cloud provider token — it uses the self-hosted runner directly.

---

### 9. GitHub Environment

1. Go to **GitHub → drcircuit/shaderforge → Settings → Environments → New environment**.
2. Name it **`production`**.
3. (Optional) Add yourself as a **required reviewer**.
4. Under **Deployment branches**, select **Selected branches** → add `main`.

---

### 10. First deployment

```bash
# On the Pi — first-time start
cd /home/pi/shaderforge
docker compose pull
docker compose up -d

# Verify
curl http://localhost:8080/health
# → {"status":"healthy"}
```

After this, every push to `main` that touches `ShaderForge.API/**` will automatically rebuild and restart the container via the self-hosted runner.

---

## Database backups — Azure Blob Storage

Backups run on a daily systemd timer on the Pi. Each backup is:
- A `pg_dump` compressed with `gzip`
- Kept locally for 7 days
- Pushed immediately to Azure Blob Storage (`shaderforge-backups` container, path `backups/`)

### Prerequisites on the Pi

```bash
# Install azcopy
curl -Lo azcopy.tar.gz https://aka.ms/downloadazcopy-v10-linux
tar -xf azcopy.tar.gz --strip-components=1 -C /usr/local/bin azcopy_linux_arm64*/azcopy
chmod +x /usr/local/bin/azcopy
```

### Backup configuration — `/etc/shaderforge/backup.env`

```bash
sudo mkdir -p /etc/shaderforge
sudo tee /etc/shaderforge/backup.env > /dev/null <<'EOF'
# Postgres credentials (must match docker-compose.yml)
POSTGRES_USER=shaderforge
POSTGRES_DB=shaderforge
COMPOSE_PROJECT_DIR=/home/pi/shaderforge

# Azure Blob Storage
# Base URL: https://<account>.blob.core.windows.net/shaderforge-backups
# SAS token: generated in Azure Portal → Storage account → Containers → shaderforge-backups → Generate SAS
# Store them separately for clarity (do NOT include the leading '?' in AZURE_SAS_TOKEN)
AZURE_BLOB_BASE_URL=https://<account>.blob.core.windows.net/shaderforge-backups
AZURE_SAS_TOKEN=<sas-token-without-leading-question-mark>
EOF

sudo chmod 600 /etc/shaderforge/backup.env
sudo chown root:root /etc/shaderforge/backup.env
```

### Backup script — `/usr/local/bin/shaderforge-db-backup.sh`

```bash
sudo tee /usr/local/bin/shaderforge-db-backup.sh > /dev/null <<'SCRIPT'
#!/usr/bin/env bash
set -euo pipefail

# Load config
# shellcheck source=/etc/shaderforge/backup.env
source /etc/shaderforge/backup.env

BACKUP_DIR=/var/backups/shaderforge
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
FILENAME="shaderforge-${TIMESTAMP}.dump.gz"
LOCAL_PATH="${BACKUP_DIR}/${FILENAME}"

mkdir -p "$BACKUP_DIR"

# Dump from the running postgres container and compress
docker compose -f "${COMPOSE_PROJECT_DIR}/docker-compose.yml" \
  exec -T postgres \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" \
  | gzip > "$LOCAL_PATH"

echo "Backup written: $LOCAL_PATH"

# Push to Azure Blob Storage
azcopy copy "$LOCAL_PATH" "${AZURE_BLOB_BASE_URL}/backups/${FILENAME}?${AZURE_SAS_TOKEN}" \
  --overwrite=false

echo "Backup uploaded to Azure: backups/${FILENAME}"

# Remove local backups older than 7 days
find "$BACKUP_DIR" -name "shaderforge-*.dump.gz" -mtime +7 -delete
echo "Old local backups pruned (>7 days)"
SCRIPT

sudo chmod 700 /usr/local/bin/shaderforge-db-backup.sh
sudo chown root:root /usr/local/bin/shaderforge-db-backup.sh
```

### systemd service — `/etc/systemd/system/shaderforge-db-backup.service`

```ini
[Unit]
Description=ShaderForge database backup
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
EnvironmentFile=/etc/shaderforge/backup.env
ExecStart=/usr/local/bin/shaderforge-db-backup.sh
StandardOutput=journal
StandardError=journal
```

### systemd timer — `/etc/systemd/system/shaderforge-db-backup.timer`

```ini
[Unit]
Description=ShaderForge database backup — daily at 02:00

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

### Enable the timer

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now shaderforge-db-backup.timer

# Verify
sudo systemctl list-timers shaderforge-db-backup.timer
# Trigger a manual test run
sudo systemctl start shaderforge-db-backup.service
journalctl -u shaderforge-db-backup.service -n 50
```

---

## Restoring from a backup

```bash
# List available backups in Azure
azcopy list "${AZURE_BLOB_BASE_URL}/backups/?${AZURE_SAS_TOKEN}"

# Download a specific backup
azcopy copy \
  "${AZURE_BLOB_BASE_URL}/backups/shaderforge-20240101-020000.dump.gz?${AZURE_SAS_TOKEN}" \
  /tmp/shaderforge-restore.dump.gz

# Decompress
gunzip /tmp/shaderforge-restore.dump.gz

# Restore into the running postgres container
# WARNING: this will overwrite the current database
cd /home/pi/shaderforge
docker compose exec -T postgres \
  pg_restore -U shaderforge -d shaderforge --clean --if-exists \
  < /tmp/shaderforge-restore.dump
```

---

## Day-to-day workflow

```
Feature branch  →  Pull Request  →  ci.yml runs tests
                                          │
                            pass ─────────┘
                              │
                       Merge to main
                              │
                    ┌─────────┴─────────┐
              deploy-api.yml      deploy-ui.yml
              (if API changed)    (if UI changed)
                    │                   │
              tests pass           tests pass
                    │                   │
           Pi: docker compose      Cloudflare Pages
             build + restart           deploy
```

---

## Monitoring & alerts (recommended next steps)

| What | Free option |
|------|-------------|
| Uptime monitoring | [UptimeRobot](https://uptimerobot.com) — ping `/health` every 5 min, email on down |
| Error tracking | [Sentry](https://sentry.io) — free tier, 5 k errors/month |
| Pi metrics | `docker stats` or [Netdata](https://www.netdata.cloud) agent |
| Backup health | `journalctl -u shaderforge-db-backup.service` or pipe to a notification script |
