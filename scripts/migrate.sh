#!/usr/bin/env bash
# Apply versioned SQL migrations to the Supabase Postgres via psql.
# Requires SUPABASE_DB_URL in .env (the database connection string).
set -euo pipefail

if [ -f .env ] && [ -z "${SUPABASE_DB_URL:-}" ]; then
  val="$(grep -E '^SUPABASE_DB_URL=' .env | head -1 | cut -d= -f2-)"
  val="${val%\"}"; val="${val#\"}"   # strip surrounding double quotes
  val="${val%\'}"; val="${val#\'}"   # strip surrounding single quotes
  export SUPABASE_DB_URL="$val"
fi

if [ -z "${SUPABASE_DB_URL:-}" ]; then
  echo "✗ SUPABASE_DB_URL belum diset di .env"
  echo "  Ambil di Supabase: Project Settings → Database → Connection string → URI (Session pooler)"
  exit 1
fi

for f in supabase/migrations/*.sql; do
  echo "→ applying $f"
  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$f"
done
echo "✓ Semua migration berhasil diterapkan."
