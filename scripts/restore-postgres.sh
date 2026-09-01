#!/usr/bin/env bash
# Restaura um dump gerado por backup-postgres.sh no PostgreSQL de produção.
# DESTRUTIVO: sobrescreve o conteúdo atual do banco. Rode a partir do
# diretório que contém docker-compose.yml/.prod.yml e o `.env`.
#
# Uso:
#   ./scripts/restore-postgres.sh caminho/para/dump.dump
#
# Procedimento recomendado:
#   1. docker compose -f docker-compose.yml -f docker-compose.prod.yml stop backend
#   2. ./scripts/restore-postgres.sh backups/message-hub-message_hub-<timestamp>.dump
#   3. docker compose -f docker-compose.yml -f docker-compose.prod.yml start backend
#   4. Conferir /health e os dados restaurados antes de liberar tráfego real.
set -euo pipefail

cd "$(dirname "$0")/.."

dump_file="${1:-}"
if [[ -z "$dump_file" ]]; then
  echo "Uso: $0 <caminho-para-dump.dump>" >&2
  exit 1
fi
if [[ ! -f "$dump_file" ]]; then
  echo "Arquivo de dump não encontrado: $dump_file" >&2
  exit 1
fi

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

POSTGRES_USER="${POSTGRES_USER:-message_hub}"
POSTGRES_DB="${POSTGRES_DB:-message_hub}"
COMPOSE_FILES=(-f docker-compose.yml -f docker-compose.prod.yml)

echo "Isto vai APAGAR e RESTAURAR o banco '${POSTGRES_DB}' a partir de: ${dump_file}"
echo "Confirme que o serviço 'backend' está parado antes de continuar."
read -r -p "Digite 'restaurar' para confirmar: " confirmation
if [[ "$confirmation" != "restaurar" ]]; then
  echo "Cancelado."
  exit 1
fi

docker compose "${COMPOSE_FILES[@]}" exec -T postgres \
  pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner \
  < "$dump_file"

echo "Restauração concluída. Reinicie o backend e valide /health antes de liberar tráfego."
