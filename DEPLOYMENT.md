# ShaderForge — Deployment Plan

## Architecture overview

```
shaderforge.net  (Cloudflare Pages — Vue 3 SPA, free)
        │
        │ HTTPS REST
        ▼
api.shaderforge.net  (Fly.io — .NET 9 API, free tier)
        │
        │ PostgreSQL (SSL)
        ▼
Neon  (free-tier managed PostgreSQL — 0.5 GB, auto-suspend)
```

### Why these services?

| Service | Tier | Cost | What it provides |
|---------|------|------|-----------------|
| **Cloudflare Pages** | Free | $0 | Global CDN, custom domain, unlimited requests, SPA routing |
| **Fly.io** | Free (shared-cpu-1x, 256 MB) | $0 | Containerised .NET 9, auto-sleep, HTTPS, custom domain |
| **Neon** | Free | $0 | 0.5 GB PostgreSQL, 1-day point-in-time restore, auto-suspend |

---

## CI/CD pipeline

```
Pull Request → ci.yml
  ├── test-api   (dotnet test)
  └── test-ui    (lint + jest)

Push to main
  ├── ci.yml (same gates)
  ├── deploy-api.yml   (if ShaderForge.API/** changed)
  │     ├── job: test   → dotnet test
  │     └── job: deploy → flyctl deploy --wait-timeout 120
  ├── deploy-ui.yml    (if shaderforge.ui/** changed)
  │     ├── job: test   → lint + jest
  │     └── job: deploy → cloudflare/pages-action
  └── db-backup.yml    (every Sunday 02:00 UTC)
        └── pg_dump → GitHub Actions artifact (90-day retention)
```

Both deploy jobs are gated on their test job and target the **`production`** GitHub Environment, so they only run after tests pass and can be protected with required reviewers.

---

## One-time setup

### 1. Neon (PostgreSQL)

1. Sign up at <https://neon.tech> (free, no credit card).
2. Create a project named **shaderforge**, region **eu-central-1** (closest to Fly.io `ams`).
3. Copy the **connection string** — it looks like:
   ```
   postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Keep this string safe — you will need it in steps 2 and 5.

---

### 2. Fly.io (API)

```bash
# Install flyctl (macOS / Linux)
curl -L https://fly.io/install.sh | sh

# Sign up / log in
flyctl auth signup        # or: flyctl auth login

# Create the app (matches app name in fly.toml)
flyctl apps create shaderforge-api

# Set production secrets
flyctl secrets set \
  ConnectionStrings__DefaultConnection="<neon-connection-string>" \
  Jwt__Secret="$(openssl rand -hex 32)"

# Confirm secrets are set (values are hidden)
flyctl secrets list
```

> **Note:** `Jwt__Secret` must be at least 32 characters. The command above generates a cryptographically random 64-character hex string.

#### Get the Fly.io IP for DNS (step 4)

```bash
flyctl ips list
```

Note the **IPv4** and **IPv6** addresses shown.

---

### 3. Cloudflare Pages (frontend)

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
   Cloudflare will assign a `*.pages.dev` preview URL — note it.

6. Once deployed, go to **Custom domains** → **Set up a custom domain** → enter `shaderforge.net`.  
   Cloudflare will automatically add the required DNS record if your domain is already on Cloudflare.

> **Tip:** The `_redirects` file (`shaderforge.ui/public/_redirects`) is already in the repo and handles Vue Router's history-mode SPA fallback.

---

### 4. DNS (Cloudflare)

Your domain **shaderforge.net** must be on Cloudflare (transfer or add as a site). Then add these records:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| `CNAME` | `shaderforge.net` (root) | `shaderforge.pages.dev` | ✅ Proxied |
| `CNAME` | `www` | `shaderforge.pages.dev` | ✅ Proxied |
| `A` | `api` | `<Fly.io IPv4>` | ☐ DNS only |
| `AAAA` | `api` | `<Fly.io IPv6>` | ☐ DNS only |

> Leave `api.shaderforge.net` **unproxied** (DNS only / grey cloud) so Fly.io's TLS termination works correctly.

#### Register the custom domain with Fly.io

```bash
flyctl certs create api.shaderforge.net
flyctl certs show  api.shaderforge.net   # confirm certificate is issued
```

---

### 5. GitHub Secrets

Go to **GitHub → drcircuit/shaderforge → Settings → Secrets and variables → Actions** and add:

| Secret | How to get it |
|--------|---------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare dashboard → My Profile → API Tokens → Create Token → use "Edit Cloudflare Pages" template |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare dashboard → right sidebar on any zone page |
| `FLY_API_TOKEN` | `flyctl auth token` |
| `DATABASE_URL` | Same Neon connection string as step 1 (used only by the weekly backup job) |

---

### 6. GitHub Environment

1. Go to **GitHub → drcircuit/shaderforge → Settings → Environments → New environment**.
2. Name it **`production`**.
3. (Optional) Add yourself as a **required reviewer** — deployments will wait for your approval before running.
4. Under **Deployment branches**, select **Selected branches** → add `main`.

---

### 7. First deployment

The first `git push` to `main` after completing the steps above will:

1. Run CI tests.
2. Deploy the API container to Fly.io (which also runs `dotnet ef database update` automatically via `Database.Migrate()` in `Program.cs`).
3. Deploy the frontend to Cloudflare Pages.

Verify with:

```bash
curl https://api.shaderforge.net/health
# → {"status":"healthy"}

open https://shaderforge.net
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
              Fly.io deploy     Cloudflare Pages deploy
```

---

## Monitoring & alerts (recommended next steps)

| What | Free option |
|------|-------------|
| Uptime monitoring | [UptimeRobot](https://uptimerobot.com) — ping `/health` every 5 min, email on down |
| Error tracking | [Sentry](https://sentry.io) — free tier, 5 k errors/month |
| Fly.io metrics | `flyctl dashboard` — CPU, memory, request count |
| Neon storage | Neon dashboard shows storage usage vs 0.5 GB limit |

---

## Scaling beyond the free tier

When you outgrow the free tiers:

| Bottleneck | Solution | Cost |
|------------|----------|------|
| Fly.io memory (256 MB) | Upgrade to 512 MB or 1 GB machine | ~$3–7/month |
| Neon storage (0.5 GB) | Upgrade to Launch plan | $19/month |
| Cloudflare Pages | Already unlimited on free | $0 |
| Database backups | Neon paid plans include 7-day PITR | included |
