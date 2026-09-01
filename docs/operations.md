[← Voltar ao README](../README.md)

# Operação, segurança e observabilidade

## Produção com Docker Compose

Use o overlay de produção, após preencher um `.env` próprio a partir de [`.env.production.example`](../.env.production.example):

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

O overlay **não configura TLS**. Ele remove a exposição pública de PostgreSQL/RabbitMQ (acessíveis só pela rede interna do Compose), publica API e console apenas em `127.0.0.1`, desabilita Swagger, habilita `TRUST_PROXY`, limita logs/recursos (backend: 1 CPU / 512M; frontend: 0.5 CPU / 128M) e pressupõe um reverse proxy confiável terminando HTTPS na frente.

Valide o deploy pelos endpoints públicos:

```bash
curl --fail https://api.seu-dominio.com.br/health
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail=100 backend migrate
```

## Backup e recuperação de desastres

O Postgres é a única fonte de verdade durável do Hub (inclusive da outbox transacional); o RabbitMQ carrega apenas transporte volátil e pode ser recriado vazio a qualquer momento — por isso só o Postgres precisa de backup.

```bash
# Dump manual (usa docker compose exec + pg_dump, aplica retenção local)
./scripts/backup-postgres.sh

# Restauração (destrutiva — pede confirmação, ver instruções no cabeçalho do script)
./scripts/restore-postgres.sh backups/message-hub-message_hub-<timestamp>.dump
```

Agende `backup-postgres.sh` via cron no servidor de deploy, executado a partir do diretório com o `.env` de produção — por exemplo, diariamente às 3h com retenção de 14 dias local:

```cron
0 3 * * * cd /caminho/para/message-hub && ./scripts/backup-postgres.sh >> /var/log/message-hub-backup.log 2>&1
```

Defina `BACKUP_REMOTE_DIR` (destino compatível com `rsync`, ex.: `usuario@host:/backups/message-hub`) no `.env` para copiar cada dump para fora do host — sem isso, um backup que mora só no volume Docker do próprio servidor não protege contra a perda do servidor inteiro. Teste a restauração periodicamente em um ambiente separado; um backup nunca validado por restore não é confiável.

Procedimento de restore: pare o serviço `backend`, execute `restore-postgres.sh` com o caminho do dump, reinicie `backend`, valide `/health`. Todas as variáveis (`BACKUP_DIR`, `BACKUP_RETENTION_DAYS`, `BACKUP_REMOTE_DIR`) estão documentadas em [configuration.md](./configuration.md#backup-e-restore-scriptssh).

## Controles de segurança implementados

- `helmet`, compressão, remoção de `X-Powered-By`, CORS explícito (sem curinga) e `ValidationPipe` global com whitelist/forbid de campos não declarados.
- Rate limit padrão de 100 requisições/minuto; login limitado a 5/minuto. O escopo de uso de cada API key continua validado por Application e Tenant em toda operação, independentemente do rate limit.
- `TRUST_PROXY` só deve ser ativado quando o proxy na frente sobrescreve cabeçalhos encaminhados — do contrário, o IP usado no rate limit pode ser falsificado pelo próprio cliente.
- A URL de webhook de saída de uma Application precisa ser HTTPS e passa por validação contra destinos privados/inseguros (proteção SSRF).
- Logs estruturados com redaction de segredos; correlação por request, mensagem, tentativa, tenant, aplicação e provider quando aplicável.
- Auditoria persistente de toda operação mutável autenticada; schemas PostgreSQL separados: `app`, `audit` e `events`.
- Tokens Meta de tenant e senhas SMTP de tenant são cifrados em repouso (AES-256-GCM) — nunca retornados em claro por nenhum DTO.
- Health checks de banco e RabbitMQ em `/health` e `/health/ready`; liveness simples e sem dependências em `/health/live`.

Não registre API keys completas, tokens Meta, senha SMTP, corpo de credenciais ou segredos em logs, issues e commits. Consulte [SECURITY.md](../SECURITY.md) para reportar vulnerabilidades de forma privada.

## Qualidade e testes locais

```bash
# Backend
npm run validate --prefix backend
npm run test:e2e --prefix backend
npm run build --prefix backend

# Frontend
npm run validate --prefix frontend
```

`validate` executa formatação, lint, typecheck e testes em cada projeto. O backend usa Jest (unitários e E2E); o frontend usa Vitest. A suíte privilegia regras de domínio e aplicação sem dependências externas, complementadas por testes HTTP/E2E do backend.

## CI

Em `main` e pull requests, o GitHub Actions detecta mudanças de backend/frontend e executa, conforme necessário:

1. formatação, lint e typecheck;
2. testes unitários, E2E e cobertura;
3. migrations em PostgreSQL limpo, reversão individual de todas as migrations e nova aplicação;
4. auditoria de dependências (`npm audit --audit-level=high`);
5. build de backend, frontend e imagens Docker.

## Release e deploy

Uma tag estável `vX.Y.Z`, com versão idêntica nos dois `package.json`, dispara validação completa, build de imagens multi-arquitetura (`linux/amd64` e `linux/arm64`) publicadas no GHCR, criação de GitHub Release e deploy via o ambiente `production` do GitHub Actions.

O servidor de deploy precisa ter: `.env` de produção preenchido, Docker Compose v2, autenticação de leitura no GHCR, e os arquivos `docker-compose.yml`, `docker-compose.prod.yml` e `docker-compose.release.yml`. O workflow usa imagens imutáveis com `--no-build` (nunca builda no servidor de produção).

Consulte [CONTRIBUTING.md](../CONTRIBUTING.md) para regras de contribuição e [AGENTS.md](../AGENTS.md) para as decisões e restrições arquiteturais completas.
