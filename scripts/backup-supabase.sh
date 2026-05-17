#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${SUPABASE_URL:-}" || -z "${SUPABASE_ANON_KEY:-}" ]]; then
  echo "Missing SUPABASE_URL or SUPABASE_ANON_KEY"
  exit 1
fi

OUT_DIR="${1:-./backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"
TARGET_DIR="${OUT_DIR%/}/supabase-${STAMP}"
mkdir -p "$TARGET_DIR"

COMMON_HEADERS=(
  -H "apikey: ${SUPABASE_ANON_KEY}"
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
)

curl -sS "${COMMON_HEADERS[@]}" \
  "${SUPABASE_URL%/}/rest/v1/knowledge_entries?select=id,title,author,tags,text,created_at&order=created_at.asc" \
  > "${TARGET_DIR}/knowledge_entries.json"

curl -sS "${COMMON_HEADERS[@]}" \
  "${SUPABASE_URL%/}/rest/v1/world_stats?select=key,value_json,updated_at&order=key.asc" \
  > "${TARGET_DIR}/world_stats.json"

echo "Backup saved to: ${TARGET_DIR}"
