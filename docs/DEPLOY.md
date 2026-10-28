# NaijaBox Deployment Guide

Production deployment guide for NaijaBox on a Ubuntu VPS with Docker, Caddy (auto HTTPS), and PostgreSQL.

---

## Prerequisites

- A domain name pointing to your server (e.g. `naijabox.app`)
- A fresh Ubuntu 22.04 or 24.04 VPS (minimum 1 vCPU, 1 GB RAM)
- SSH access to the server
- Git repository cloned or access to deploy code

---

## 1. Domain and DNS Setup

1. Point your domain's **A record** to your server's public IP address.
2. Point `www.<yourdomain>` to the same IP (optional, for redirect).
3. Wait for DNS propagation (usually 5–30 minutes; check with `dig <yourdomain>`).

---

## 2. Install Docker on Ubuntu

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker dependencies
sudo apt install -y ca-certificates curl gnupg

# Add Docker's official GPG key and repo
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine and Compose
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add your user to docker group (so you don't need sudo)
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker compose version
```

---

## 3. Clone the Repository

```bash
cd /opt
sudo git clone https://github.com/yourusername/naijabox.git naijabox
sudo chown -R $USER:$USER /opt/naijabox
cd /opt/naijabox
```

---

## 4. Configure Environment Variables

Create the production `.env` file from the example:

```bash
cp .env.example .env
nano .env  # or use your preferred editor
```

Fill in ALL values — especially secrets. See `.env.example` for descriptions.

**Required values to set:**

```env
DATABASE_URL=postgresql://postgres:<STRONG_DB_PASSWORD>@db:5432/naijabox
AUTH_SECRET=<run: openssl rand -base64 32>
AUTH_URL=https://yourdomain.app/api/auth
SITE_URL=https://yourdomain.app
SITE_DOMAIN=yourdomain.app

POSTGRES_PASSWORD=<STRONG_DB_PASSWORD>
POSTGRES_USER=postgres
POSTGRES_DB=naijabox

ADMIN_EMAIL=owner@yourdomain.app
ADMIN_PASSWORD=<STRONG_INITIAL_PASSWORD>

CONTACT_EMAIL=hello@yourdomain.app
```

> [!CAUTION]
> Never commit your `.env` file to git. It is in `.gitignore`.

---

## 5. First Deploy — Build and Start

```bash
# Build and start all services (app, db, caddy)
docker compose -f docker-compose.production.yml up -d --build

# Check services are running
docker compose -f docker-compose.production.yml ps
```

Caddy will automatically obtain an HTTPS certificate from Let's Encrypt. This requires port 80 and 443 to be open and DNS to be pointing to your server.

---

## 6. Run Database Migrations and Seed

```bash
# Run migrations inside the app container
docker compose -f docker-compose.production.yml exec app node scripts/migrate.js
# OR if using pnpm locally:
# DATABASE_URL=<your-url> pnpm db:migrate

# Seed initial content (sets up experiences, categories, seed questions)
docker compose -f docker-compose.production.yml exec app node scripts/seed.js
```

---

## 7. Create the First Admin Account

> [!IMPORTANT]
> Run this **once** after initial deploy. If `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set in `.env`, the seed script creates the owner. Alternatively, use the dedicated script:

```bash
# Using the dedicated create-owner script (safe — refuses to run if owner already exists)
docker compose -f docker-compose.production.yml exec app pnpm admin:create-owner
```

Then immediately log in at `https://yourdomain.app/admin` and **change your password** via the settings page.

> [!WARNING]
> Change `ADMIN_PASSWORD` in `.env` after first login. The seed script default password must never stay in production.

---

## 8. Verify HTTPS and Health

```bash
# Check the health endpoint
curl https://yourdomain.app/api/health
# Expected: {"status":"ok","db":"connected","ts":"..."}

# Check Caddy logs if HTTPS fails
docker compose -f docker-compose.production.yml logs caddy
```

---

## 9. Set Up Nightly Database Backup (Cron)

```bash
# Make backup script executable
chmod +x /opt/naijabox/scripts/backup.sh

# Create backup directory
sudo mkdir -p /var/backups/naijabox
sudo chown $USER:$USER /var/backups/naijabox

# Add cron job (runs daily at 3 AM)
crontab -e
```

Add this line:

```
0 3 * * * BACKUP_DIR=/var/backups/naijabox DATABASE_URL="postgresql://postgres:<password>@localhost:5432/naijabox" /opt/naijabox/scripts/backup.sh >> /var/log/naijabox-backup.log 2>&1
```

> [!TIP]
> Consider backing up to an external location (S3, Backblaze B2) for disaster recovery. The backup script outputs `.dump` files compatible with `pg_restore`.

---

## 10. Updates and Redeployment

```bash
cd /opt/naijabox

# Pull latest code
git pull origin main

# Rebuild and restart with zero-downtime (Compose handles this)
docker compose -f docker-compose.production.yml up -d --build

# If there are database migrations:
docker compose -f docker-compose.production.yml exec app node scripts/migrate.js
```

---

## 11. Rollback Procedure

If a deploy breaks something:

```bash
# Roll back to the previous Git commit
git log --oneline -10       # Find the commit to roll back to
git checkout <commit-hash>  # Check out the previous version

# Rebuild with the old code
docker compose -f docker-compose.production.yml up -d --build
```

If the database migration needs to be rolled back, restore from the backup made before the deploy:

```bash
# Restore from backup
pg_restore \
  --clean \
  --no-acl \
  --no-owner \
  -d "postgresql://postgres:<password>@localhost:5432/naijabox" \
  /var/backups/naijabox/naijabox_<TIMESTAMP>.dump
```

---

## 12. Monitoring Uptime

- Add the health endpoint `https://yourdomain.app/api/health` to an uptime monitor (e.g. UptimeRobot, Better Stack, Freshping — all have free tiers).
- Set up email alerts for downtime.

---

## Environment Variable Reference

See `.env.example` for the full list with descriptions.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| HTTPS certificate fails | Ensure DNS A record points to server; ports 80/443 open in firewall |
| App can't connect to DB | Verify `DATABASE_URL` uses `db` as hostname (not `localhost`) in production |
| Admin login broken | Verify `AUTH_SECRET` is set and consistent across restarts |
| Out of disk space | Check Docker image cache (`docker system prune`) and backup dir size |
| High memory usage | Upgrade VPS tier; tune `DEFAULT_QUESTION_COUNT` down |
