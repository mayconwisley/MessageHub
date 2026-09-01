#!/usr/bin/env bash
# Faz o dump do PostgreSQL de produção via `docker compose exec` e aplica
# retenção local. Pensado para rodar por cron no servidor de deploy, no
# mesmo diretório que contém docker-compose.yml/.prod.yml e o `.env`.
#
# Uso:
#   ./scripts/backup-postgres.sh
#
# Variáveis (lidas do ambiente ou do `.env` no diretório atual):
#   POSTGRES_USER, POSTGRES_DB      - credenciais do banco (ver .env.production.example)
#   BACKUP_DIR                      - diretório local dos dumps (padrão: ./backups)
#   BACKUP_RETENTION_DAYS           - dias de retenção local (padrão: 14)
#   BACKUP_REMOTE_DIR               - destino rsync opcional para cópia externa
#                                      (ex.: usuario@host:/backups/message-hub ou
#                                      /mnt/storage-externo/message-hub); se vazio,
#                                      nenhuma cópia externa é feita.
#
# O RabbitMQ não é incluído: filas são transporte volátil, não fonte de
# verdade - o estado durável fica no outbox do Postgres (ver README.md).
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

POSTGRES_USER="${POSTGRES_USER:-message_hub}"
POSTGRES_DB="${POSTGRES_DB:-message_hub}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
COMPOSE_FILES=(-f docker-compose.yml -f docker-compose.prod.yml)

mkdir -p "$BACKUP_DIR"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
dump_file="${BACKUP_DIR}/message-hub-${POSTGRES_DB}-${timestamp}.dump"
tmp_file="${dump_file}.part"

echo "Gerando dump de '${POSTGRES_DB}' em ${dump_file}..."
docker compose "${COMPOSE_FILES[@]}" exec -T postgres \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --compress=9 \
  > "$tmp_file"
mv "$tmp_file" "$dump_file"
echo "Dump concluído: $(du -h "$dump_file" | cut -f1)"

if [[ -n "${BACKUP_REMOTE_DIR:-}" ]]; then
  echo "Copiando dump para destino externo: ${BACKUP_REMOTE_DIR}"
  rsync -az "$dump_file" "${BACKUP_REMOTE_DIR%/}/"
fi

echo "Removendo dumps locais com mais de ${BACKUP_RETENTION_DAYS} dias..."
find "$BACKUP_DIR" -maxdepth 1 -name 'message-hub-*.dump' -mtime "+${BACKUP_RETENTION_DAYS}" -print -delete

echo "Backup finalizado."
