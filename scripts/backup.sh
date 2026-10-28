#!/usr/bin/env bash
# scripts/backup.sh
# NaijaBox PostgreSQL backup script
# Usage: ./scripts/backup.sh
#
# Prerequisites:
#   - pg_dump must be installed (postgresql-client package)
#   - DATABASE_URL env var must be set, OR individual DB_* vars below
#   - Set BACKUP_DIR to your preferred backup location
#
# Restore instructions:
#   1. List backups: ls -lh $BACKUP_DIR
#   2. Restore: pg_restore -d "$DATABASE_URL" "$BACKUP_DIR/<filename>.dump"
#      OR for plain SQL: psql "$DATABASE_URL" < "$BACKUP_DIR/<filename>.sql"

set -euo pipefail

# ─── Config ───────────────────────────────────────────────────────────────────
BACKUP_DIR="${BACKUP_DIR:-/var/backups/naijabox}"
KEEP_DAYS="${KEEP_DAYS:-7}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/naijabox_$TIMESTAMP.dump"

# Use DATABASE_URL if set, otherwise build from components
DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@db:5432/naijabox}"

# ─── Run backup ───────────────────────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting NaijaBox database backup..."
pg_dump \
  --format=custom \
  --compress=9 \
  --no-acl \
  --no-owner \
  "$DB_URL" \
  --file="$BACKUP_FILE"

echo "[$(date)] Backup written to: $BACKUP_FILE"

# ─── Prune old backups (keep last N days) ─────────────────────────────────────
echo "[$(date)] Removing backups older than $KEEP_DAYS days..."
find "$BACKUP_DIR" -name "naijabox_*.dump" -mtime +"$KEEP_DAYS" -delete

echo "[$(date)] Backup complete. Current backups:"
ls -lh "$BACKUP_DIR"/*.dump 2>/dev/null || echo "  (no backups found)"
