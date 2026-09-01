[← Voltar ao README](../README.md)

# Configuração

O Message Hub é configurado inteiramente por variáveis de ambiente. Existem quatro arquivos de exemplo, cada um com um propósito diferente — **nunca versione os arquivos `.env` efetivos**, apenas os `*.example`.

| Arquivo | Consumido por | Quando usar |
| --- | --- | --- |
| [`.env.example`](../.env.example) | `docker-compose.yml` (raiz do projeto) | Ambiente completo local via Docker Compose, com valores de demonstração já preenchidos. |
| [`.env.production.example`](../.env.production.example) | `docker-compose.yml` + `docker-compose.prod.yml` | Deploy de produção via Docker Compose. Todos os segredos vêm em branco ou como placeholder — preencha antes de subir. |
| [`backend/.env.example`](../backend/.env.example) | `backend` (NestJS) executado nativamente (`npm run start:dev`) | Desenvolvimento do backend fora do Docker. |
| [`frontend/.env.example`](../frontend/.env.example) | `frontend` (Vite) executado nativamente (`npm run dev`) | Desenvolvimento do frontend fora do Docker. |

No Docker Compose, `DATABASE_URL` e `RABBITMQ_URL` são montados automaticamente a partir das variáveis de Postgres/RabbitMQ abaixo — você não as declara diretamente no `.env` da raiz. Fora do Docker, o backend exige as duas explicitamente.

## Runtime e HTTP

| Variável | Obrigatória | Padrão | Descrição |
| --- | --- | --- | --- |
| `NODE_ENV` | Não | `development` | `development`, `test` ou `production`. Ativa validações adicionais em produção (ver seção [Validações específicas de produção](#validações-específicas-de-produção)). |
| `PORT` | Não | `3000` | Porta HTTP do backend quando executado nativamente. No Docker Compose a porta é fixa (`3000`) e mapeada via `BACKEND_PORT`. |
| `LOG_LEVEL` | Não | `info` | Nível mínimo dos logs estruturados (`trace`, `debug`, `info`, `warn`, `error`, `fatal`). |
| `CORS_ORIGINS` | Sim em produção | vazio | Origins autorizadas para o console web, separadas por vírgula, sem caminho e sem curinga (`*`). Em produção é obrigatória e cada origin precisa ser HTTPS. |
| `SWAGGER_ENABLED` | Não | `true` fora de produção | Habilita `/docs`. **Proibido em produção** — a aplicação recusa subir se `NODE_ENV=production` e `SWAGGER_ENABLED=true`. |
| `TRUST_PROXY` | Não | `false` | Ative apenas atrás de um reverse proxy confiável que sobrescreve `X-Forwarded-For`. Controla de qual IP o rate limit é calculado. |

## Banco de dados e fila

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `DATABASE_URL` | Sim | String de conexão Postgres, formato `postgres://usuario:senha@host:porta/banco`. |
| `RABBITMQ_URL` | Sim | String de conexão AMQP, formato `amqp://usuario:senha@host:porta`. |

No Docker Compose essas duas são derivadas de `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `RABBITMQ_USER` e `RABBITMQ_PASSWORD` (ver [Somente Docker Compose](#somente-docker-compose)).

## Administrador inicial

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `INITIAL_PLATFORM_ADMIN_EMAIL` | Sim | E-mail do administrador `platform_admin` criado automaticamente no primeiro boot, apenas se ainda não existir nenhum usuário no banco. |
| `INITIAL_PLATFORM_ADMIN_PASSWORD` | Sim | Senha em texto puro usada só nesse boot inicial; nunca é persistida em claro (hash bcrypt). Mínimo de 12 caracteres. Em produção, o Hub recusa subir com os valores de demonstração (`admin@example.com` / `ChangeMe123!Hub`). |

## Provider de envio

| Variável | Obrigatória | Valores | Descrição |
| --- | --- | --- | --- |
| `MESSAGE_PROVIDER` | Sim | `meta` \| `sandbox` | `sandbox` simula envios sem exigir credenciais reais da Meta — use para explorar o Hub localmente. `meta` envia de fato pela Graph API. Produção exige `meta`. |
| `SANDBOX_ENABLED` | Não | `true`/`false` | Habilita os endpoints administrativos de simulação de webhook (`/v1/sandbox/messages/*`) e a tela "Ambiente sandbox" do console. Produção exige `false`. |

## Meta / WhatsApp

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `META_GRAPH_API_URL_BASE` | Sim | Base da Graph API da Meta, ex.: `https://graph.facebook.com/v25.0/`. |
| `META_WEBHOOK_VERIFY_TOKEN` | Sim em produção | Token comparado em tempo constante no handshake `GET /webhooks/meta` (`hub.verify_token`). |
| `META_APP_SECRET` | Sim em produção | Segredo do app Meta usado para validar `X-Hub-Signature-256` no `POST /webhooks/meta`. |

### Canal WhatsApp padrão (opcional)

Preencha o grupo abaixo **somente** se o ambiente gerenciar uma WhatsApp Business Account (WABA) compartilhada por toda a plataforma, reconciliada automaticamente no boot (`META_DEFAULT_CHANNEL_ENABLED=true`). O token nunca é aceito por requests administrativos nem retornado por nenhum DTO.

| Variável | Obrigatória se habilitado | Descrição |
| --- | --- | --- |
| `META_DEFAULT_CHANNEL_ENABLED` | — | Liga/desliga a reconciliação do canal padrão. |
| `META_GRAPH_API_URL_BASE` | Sim | Reaproveitada da seção anterior; também exigida aqui quando o canal padrão está ligado. |
| `META_DEFAULT_CHANNEL_TENANT_ID` | Sim | UUID do tenant dono do canal padrão. |
| `META_DEFAULT_CHANNEL_TENANT_NAME` | Sim | Nome usado ao criar o tenant, se ele ainda não existir. |
| `META_DEFAULT_CHANNEL_APPLICATION_NAME` | Não | Nome da aplicação padrão criada nesse tenant. |
| `META_DEFAULT_CHANNEL_WABA_ID` | Sim | ID da WABA na Meta. |
| `META_DEFAULT_CHANNEL_BEARER` | Sim | Token de acesso da Meta para esse canal. |
| `META_DEFAULT_CHANNEL_PHONE_NUMBER_ID` | Não | ID do número na Meta, se o canal já incluir um número. |
| `META_DEFAULT_CHANNEL_PHONE_NUMBER` | Não | Número de exibição (E.164). |
| `META_DEFAULT_CHANNEL_USERNAME` | Não | Nome de usuário associado ao canal, se aplicável. |

> `MESSAGING_DEFAULT_PROVIDER`, presente no `backend/.env.example` histórico, não é lido por nenhum código do backend — apenas `MESSAGE_PROVIDER` é consumido. Ignore-a; ela deve ser removida do arquivo de exemplo em uma limpeza futura.

## Cifragem de credenciais

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `META_CREDENTIALS_ENCRYPTION_KEY` | Sim | Chave Base64 de **exatamente 32 bytes**, usada em AES-256-GCM para cifrar tokens Meta de tenant e senhas SMTP de tenant antes de persistir. Gere a sua com o comando abaixo — nunca reaproveite a chave de exemplo em produção. |

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## SMTP padrão (fallback global)

Usado pelos tenants que não cadastraram um SMTP próprio na tela "E-mail SMTP" do console.

| Variável | Obrigatória se habilitado | Padrão | Descrição |
| --- | --- | --- | --- |
| `SMTP_DEFAULT_ENABLED` | — | `false` | Liga/desliga o fallback global de e-mail. |
| `SMTP_HOST` | Sim | — | Host do servidor SMTP. |
| `SMTP_PORT` | Não | `587` | Porta SMTP. |
| `SMTP_SECURE` | Não | `false` | `true` normalmente apenas para SMTPS direto na porta 465; para 587 (STARTTLS) deixe `false`. |
| `SMTP_USER` | Sim | — | Usuário de autenticação SMTP. |
| `SMTP_PASSWORD` | Sim | — | Senha de autenticação SMTP. |
| `SMTP_FROM_EMAIL` | Sim | — | Endereço remetente. |
| `SMTP_FROM_NAME` | Não | `Message Hub` | Nome de exibição do remetente. |

## Alertas de engenharia (opcionais)

Canais externos para os quais o Hub replica falhas persistentes, envios para DLQ e degradações técnicas. Em produção, apenas URLs HTTPS são aceitas.

| Variável | Descrição |
| --- | --- |
| `ENGINEERING_SLACK_WEBHOOK_URL` | Webhook de um canal do Slack. |
| `ENGINEERING_TEAMS_WEBHOOK_URL` | Webhook de um canal do Microsoft Teams. |
| `ENGINEERING_EMAIL_WEBHOOK_URL` | Webhook de um gateway corporativo de e-mail; o Hub envia somente metadados técnicos mínimos, nunca payloads de negócio. |

Sem nenhum canal configurado, o alerta ainda é registrado em `/v1/engineering-alerts` e na tela "Alertas de engenharia", apenas fica marcado como não entregue externamente.

## Frontend

| Variável | Obrigatória | Descrição |
| --- | --- | --- |
| `VITE_API_URL` | Sim | URL da API acessível pelo **navegador do usuário**, não pela rede interna do Docker. É embutida no bundle em tempo de build do Vite — trocar seu valor exige rebuildar o frontend. |

## Somente Docker Compose

Estas variáveis não são lidas diretamente pelo código Node; alimentam os serviços `postgres`/`rabbitmq` e compõem `DATABASE_URL`/`RABBITMQ_URL` dentro do `docker-compose.yml`.

| Variável | Padrão (`.env.example`) | Descrição |
| --- | --- | --- |
| `BACKEND_PORT` | `3000` | Porta publicada no host para a API. |
| `FRONTEND_PORT` | `8080` | Porta publicada no host para o console. |
| `POSTGRES_PORT` | `5432` | Porta publicada no host para o Postgres. |
| `RABBITMQ_PORT` | `5672` | Porta publicada no host para AMQP. |
| `RABBITMQ_MANAGEMENT_PORT` | `15672` | Porta publicada no host para o painel de gerenciamento do RabbitMQ. |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `message_hub` / `message_hub` / `message_hub` | Credenciais e nome do banco Postgres. |
| `RABBITMQ_USER` / `RABBITMQ_PASSWORD` | `message_hub` / `message_hub` | Credenciais do RabbitMQ. |

No overlay de produção (`docker-compose.prod.yml`), Postgres e RabbitMQ deixam de publicar porta no host — são acessíveis apenas pela rede interna do Compose.

## Backup e restore (`scripts/*.sh`)

Lidas por `scripts/backup-postgres.sh` e `scripts/restore-postgres.sh` a partir do `.env` de produção; vêm comentadas em [`.env.production.example`](../.env.production.example) porque têm padrões razoáveis.

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `BACKUP_DIR` | `./backups` | Diretório local onde os dumps `.dump` são gravados. |
| `BACKUP_RETENTION_DAYS` | `14` | Dumps locais mais antigos que N dias são apagados a cada execução. |
| `BACKUP_REMOTE_DIR` | — (opcional) | Destino `rsync -az` para copiar cada dump para fora do host, ex.: `usuario@host:/backups/message-hub`. Sem isso, o backup só protege contra perda de dados no Postgres, não contra perda do servidor inteiro. |

Detalhes operacionais completos em [`operations.md`](./operations.md#backup-e-recuperação-de-desastres).

## Validações específicas de produção

Com `NODE_ENV=production`, o Hub recusa subir se qualquer uma destas condições não for satisfeita:

- `SWAGGER_ENABLED` precisa ser `false`.
- `MESSAGE_PROVIDER` precisa ser `meta`, com `SANDBOX_ENABLED=false`.
- `META_WEBHOOK_VERIFY_TOKEN` e `META_APP_SECRET` precisam estar preenchidos.
- `INITIAL_PLATFORM_ADMIN_EMAIL`/`INITIAL_PLATFORM_ADMIN_PASSWORD` não podem ser os valores de demonstração.
- `META_CREDENTIALS_ENCRYPTION_KEY` não pode ser a chave de exemplo do repositório.
- URLs de alerta de engenharia, quando definidas, precisam ser HTTPS.
