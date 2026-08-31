<p align="center">
  <img src="./frontend/src/assets/brand/message-hub-logo-dark.svg" alt="Message Hub" width="312" />
</p>

<p align="center">Hub interno, multi-tenant e orientado a eventos para centralizar a mensageria WhatsApp da Meta e o envio de e-mails SMTP.</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-24-339933?logo=node.js&logoColor=white" alt="Node.js 24" />
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white" alt="NestJS 11" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5.7" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL 16" />
  <img src="https://img.shields.io/badge/RabbitMQ-3-FF6600?logo=rabbitmq&logoColor=white" alt="RabbitMQ 3" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=111827" alt="React 19" />
</p>

# Message Hub

O Message Hub fornece um contrato HTTP estável para sistemas internos enviarem e acompanharem mensagens. Ele esconde Graph API, tokens, IDs da Meta, regras de reprocessamento, webhooks e detalhes de SMTP. O repositório inclui um console web para operação administrativa.

> O Hub não é um proxy genérico da Meta. A API pública representa conceitos do próprio domínio — tenants, aplicações, números, mensagens, templates e eventos — e permanece independente do formato da Graph API.

## Sumário

- [Capacidades](#capacidades)
- [Arquitetura e módulos](#arquitetura-e-módulos)
- [Início rápido](#início-rápido)
- [Fluxo de configuração e envio](#fluxo-de-configuração-e-envio)
- [Autenticação e isolamento](#autenticação-e-isolamento)
- [Referência da API](#referência-da-api)
- [Processamento assíncrono e confiabilidade](#processamento-assíncrono-e-confiabilidade)
- [Configuração](#configuração)
- [Console web](#console-web)
- [Operação, segurança e observabilidade](#operação-segurança-e-observabilidade)
- [Qualidade, CI/CD e contribuição](#qualidade-cicd-e-contribuição)

## Capacidades

- Cadastro e isolamento de `Tenant → Application → API Key`.
- Registro de contas WhatsApp Business, números de telefone e vínculo explícito de números por aplicação.
- Envio assíncrono de texto e template WhatsApp por Meta ou pelo provider sandbox local.
- Catálogo de templates: criação, edição, sincronização, publicação pendente e exclusão no escopo da conta WhatsApp.
- Envio assíncrono de e-mails por SMTP global ou por configuração específica do tenant.
- Idempotência em envios de WhatsApp e e-mail com `Idempotency-Key`.
- Webhook único da Meta, validação HMAC SHA-256, deduplicação e processamento desacoplado do request HTTP.
- Callbacks de mensagens recebidas e de alteração de status para a URL HTTPS configurada na aplicação.
- Tentativas com backoff, DLQs, linhas do tempo operacionais, auditoria, monitoramento e alertas de engenharia.
- Console React com dashboard, administração, acompanhamento de mensagens/e-mails, sandbox e manual operacional.

## Arquitetura e módulos

O backend é um monólito modular em NestJS. Cada contexto mantém as dependências direcionadas para dentro:

```text
presentation  →  application  →  domain
                     ↑
               infrastructure
```

- `domain`: entidades, value objects, regras, estados e contratos de repositório; não depende de NestJS, TypeORM, HTTP ou provedores.
- `application`: commands, queries, handlers CQRS, portas, mappers e serviços de caso de uso.
- `infrastructure`: Postgres/TypeORM, RabbitMQ, Meta, SMTP, cifragem, outbox e implementações dos contratos.
- `presentation`: controllers, DTOs, guards, filtros e adaptadores HTTP.

Controllers e workers encaminham Commands/Queries ao Mediator. Falhas previstas usam `Result`, convertidos na borda HTTP pelo filtro global; exceções representam condições técnicas inesperadas.

### Contextos de negócio

| Módulo                                  | Responsabilidade                                                                    |
| --------------------------------------- | ----------------------------------------------------------------------------------- |
| `tenants`                               | Ciclo de vida e estado dos tenants.                                                 |
| `applications`                          | Aplicações consumidoras, API keys, quotas, webhooks de saída e vínculos de números. |
| `identity`                              | Usuários administrativos, login, sessão e papéis.                                   |
| `whatsapp-accounts`                     | WABAs e credenciais de canal padrão ou do tenant.                                   |
| `phone-numbers`                         | Números Meta e seu vínculo com uma conta WhatsApp.                                  |
| `messages`                              | Mensagens WhatsApp, tentativas, timeline, provider e callbacks de status.           |
| `templates`                             | Modelo local e sincronização/publicação de templates Meta.                          |
| `webhooks`                              | Entrada Meta, deduplicação, reprocessamento e callback de mensagem recebida.        |
| `emails`                                | E-mails, tentativas, timeline, provider SMTP e worker.                              |
| `email-configurations`                  | Override SMTP cifrado por tenant e fallback global.                                 |
| `dashboard`, `monitoring`               | Consultas agregadas operacionais e saúde/quotas de integrações.                     |
| `audit`, `system-logs`, `notifications` | Auditoria administrativa, logs persistidos e alertas de engenharia.                 |

### Modelo de componentes

```text
Sistemas consumidores / Console React
                 │ HTTP + Bearer token
                 ▼
          API NestJS (v1)
                 │
        Commands / Queries / Mediator
                 │ transação
                 ├──────────────► PostgreSQL (app, audit, events)
                 │                       │
                 │                       └─ outbox transacional
                 ▼
          RabbitMQ (filas duráveis)
             │             │
             ▼             ▼
      Workers WhatsApp   Worker SMTP
             │             │
             ▼             ▼
          Meta API        Servidor SMTP
             │
             ▼
      Webhook /webhooks/meta
```

## Início rápido

### Pré-requisitos

- Node.js **24** e npm **10+** para execução nativa;
- Docker Engine + Docker Compose v2 para o ambiente completo conteinerizado;
- PostgreSQL e RabbitMQ acessíveis quando executar o backend fora do Docker.

Os projetos são independentes: `backend/` e `frontend/` têm seus próprios `package.json`, lockfile e variáveis de ambiente. Não há `package.json` na raiz.

### Ambiente completo com Docker

```powershell
Copy-Item .env.example .env
docker compose up --build
```

| Serviço             | Endereço padrão                |
| ------------------- | ------------------------------ |
| Console web         | `http://localhost:8080`        |
| API                 | `http://localhost:3000`        |
| Swagger             | `http://localhost:3000/docs`   |
| Health              | `http://localhost:3000/health` |
| RabbitMQ Management | `http://localhost:15672`       |

O Compose inicia PostgreSQL e RabbitMQ, executa as migrations no serviço one-shot `migrate` e só então inicia backend e frontend. O provider padrão é `sandbox`; portanto, não são necessárias credenciais da Meta. As credenciais `admin@example.com` / `ChangeMe123!Hub` servem somente para demonstração local.

Para limpar inclusive os volumes locais de Postgres e RabbitMQ:

```bash
docker compose down -v
```

### Desenvolvimento nativo

1. Copie os exemplos de ambiente. Configure `DATABASE_URL` e `RABBITMQ_URL` no arquivo do backend para instâncias acessíveis.

   ```powershell
   Copy-Item backend/.env.example backend/.env
   Copy-Item frontend/.env.example frontend/.env
   ```

2. Instale as dependências e aplique as migrations.

   ```bash
   npm ci --prefix backend
   npm ci --prefix frontend
   npm run migration:run --prefix backend
   ```

3. Em terminais separados, execute API e console.

   ```bash
   npm run start:dev --prefix backend
   npm run dev --prefix frontend
   ```

Por padrão, a API escuta em `http://localhost:3000` e o Vite em `http://localhost:5173`. Ajuste `CORS_ORIGINS` no backend e `VITE_API_URL` no frontend se as portas/hosts mudarem.

## Fluxo de configuração e envio

### Preparação de um canal WhatsApp

1. Crie um tenant: `POST /v1/tenants`.
2. Crie a aplicação consumidora: `POST /v1/applications`.
3. Gere uma API key da aplicação: `POST /v1/applications/:applicationId/api-keys`.
4. Registre a WABA do tenant: `POST /v1/whatsapp-accounts`.
5. Registre cada número Meta: `POST /v1/phone-numbers`.
6. Vincule os números liberados para a aplicação: `PUT /v1/applications/:applicationId/phone-numbers`.
7. Opcionalmente configure callback HTTPS de status: `PUT /v1/applications/:applicationId/webhook`.

O `phoneNumberId` dos envios é o UUID interno retornado pelo Hub, não o `phone_number_id` da Meta. Quando a aplicação tem exatamente um número vinculado, ele é resolvido automaticamente; com mais de um, informe o UUID no payload.

### Envio de texto

```bash
curl -X POST http://localhost:3000/v1/messages \
  -H "Authorization: Bearer wh_live_<api-key>" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: pedido-2026-0001" \
  -d '{
    "to": "+5511999999999",
    "content": "Seu pedido foi confirmado."
  }'
```

O retorno `201` significa que a mensagem foi aceita e persistida, não que já foi entregue ao destinatário. Consulte `GET /v1/messages/:id`, `GET /v1/messages/:id/attempts` e `GET /v1/messages/:id/timeline` para acompanhar a execução.

O campo `to` aceita um E.164 ou um BSUID (_Business-Scoped User ID_) recebido da Meta. Não é possível enviar para `@username`; para responder a um usuário com telefone oculto, reutilize exatamente `sender.id` do webhook recebido.

### Envio de template e e-mail

```json
POST /v1/messages/templates

{
  "to": "+5511999999999",
  "templateName": "pedido_confirmado",
  "parameters": ["Maria", "PED-2026-001"]
}
```

Informe `templateId` ou `templateName`. Os parâmetros do corpo seguem a ordem de `{{1}}`, `{{2}}` e assim por diante.

```json
POST /v1/emails
Idempotency-Key: notificacao-2026-0001

{
  "to": "cliente@exemplo.com",
  "subject": "Pedido confirmado",
  "textBody": "Seu pedido foi confirmado.",
  "htmlBody": "<p>Seu pedido foi confirmado.</p>"
}
```

Ao menos um entre `textBody` e `htmlBody` é obrigatório. O SMTP específico do tenant, quando existente, prevalece sobre o SMTP padrão da plataforma. A timeline fica em `GET /v1/emails/:id/timeline`.

### Estados principais

```text
WhatsApp: PENDING → PROCESSING → SENT → DELIVERED → READ
                                  │
                                  └→ FAILED → RETRY → PROCESSING

E-mail:    PENDING → PROCESSING → SENT
                         │
                         └→ FAILED → RETRY → PROCESSING
```

`SENT` representa aceite pelo provider. `DELIVERED` e `READ` para WhatsApp dependem do webhook posterior da Meta.

## Autenticação e isolamento

### Sessão administrativa

`POST /v1/auth/sessions` autentica usuários e retorna uma sessão opaca `mh_session_...`. A sessão é persistida apenas como hash, expira em 12 horas e é revogada com `DELETE /v1/auth/sessions`.

No primeiro boot sem usuários, o Hub cria o administrador inicial configurado por `INITIAL_PLATFORM_ADMIN_EMAIL` e `INITIAL_PLATFORM_ADMIN_PASSWORD`. Senhas e API keys usam bcrypt; a senha em texto puro nunca é persistida.

| Papel            | Escopo                                                           |
| ---------------- | ---------------------------------------------------------------- |
| `platform_admin` | Administração global e endpoints operacionais da plataforma.     |
| `tenant_admin`   | Escopo do próprio tenant em recursos permitidos e dashboard.     |
| `operator`       | Papel de operação; o acesso é definido pelos guards do endpoint. |

### API keys

Uma Application possui API keys próprias, apresentadas no header `Authorization: Bearer ...`.

| Tipo       | Prefixo           | Uso                                                                      |
| ---------- | ----------------- | ------------------------------------------------------------------------ |
| `platform` | `wh_live_`        | Integrações: mensagens, e-mails e templates.                             |
| `tenant`   | `wh_tenant_live_` | Operações administrativas restritas ao tenant, como contas/números/SMTP. |

A chave inteira é revelada apenas na resposta de criação. O banco mantém identificador, prefixo, hash, status, escopos e expiração — nunca o segredo original. O contexto da chave resolve Application e Tenant; handlers e repositórios validam o escopo para impedir acesso cruzado entre tenants.

### Matriz resumida de acesso

| Área                                                                          | Autenticação requerida                                                    |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Login e webhook Meta                                                          | Pública; o webhook tem handshake e assinatura criptográfica obrigatórios. |
| Tenants, aplicações, API keys e usuários                                      | Sessão `platform_admin`.                                                  |
| Contas WhatsApp, números e SMTP                                               | Sessão administrativa permitida ou API key `tenant`.                      |
| Mensagens, e-mails e templates                                                | Sessão `platform_admin` ou API key da Application.                        |
| Dashboard                                                                     | Sessão de usuário, respeitando seu escopo de tenant.                      |
| Auditoria, logs, alertas, monitoramento, reprocessamento de webhook e sandbox | Sessão `platform_admin`.                                                  |

## Referência da API

Swagger é a referência executável de DTOs, validações e respostas quando habilitado: [`/docs`](http://localhost:3000/docs). A tabela abaixo facilita a descoberta dos recursos.

| Recurso         | Endpoints                                                                                                                                                        |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Saúde           | `GET /health`, `GET /health/live`, `GET /health/ready`                                                                                                           |
| Autenticação    | `POST /v1/auth/sessions`, `DELETE /v1/auth/sessions`                                                                                                             |
| Tenants         | `POST /v1/tenants`, `GET /v1/tenants`, `GET /v1/tenants/:id`, `PATCH /v1/tenants/:id/status`                                                                     |
| Usuários        | `POST /v1/users`, `GET /v1/users`, `GET /v1/users/:id`, `PATCH /v1/users/:id`, `PATCH /v1/users/:id/status`                                                      |
| Aplicações      | `POST /v1/applications`, `GET /v1/applications`, `PUT /v1/applications/:id/webhook`, `PUT /v1/applications/:id/quotas`, `GET                                     | PUT /v1/applications/:id/phone-numbers`                                                                    |
| API keys        | `POST                                                                                                                                                            | GET /v1/applications/:applicationId/api-keys`, `DELETE /v1/applications/:applicationId/api-keys/:apiKeyId` |
| Contas WhatsApp | `GET /v1/whatsapp-accounts/default-channel`, `POST /v1/whatsapp-accounts/default-channel/ensure`, `POST                                                          | GET /v1/whatsapp-accounts`, `GET /v1/whatsapp-accounts/:id`                                                |
| Números         | `POST                                                                                                                                                            | GET /v1/phone-numbers`, `GET /v1/phone-numbers/:id`                                                        |
| Mensagens       | `POST /v1/messages`, `POST /v1/messages/templates`, `GET /v1/messages`, `GET /v1/messages/:id`, `GET /v1/messages/:id/attempts`, `GET /v1/messages/:id/timeline` |
| Templates       | `POST                                                                                                                                                            | GET /v1/templates`, `GET                                                                                   | PUT                                   | DELETE /v1/templates/:id`, `POST /v1/templates/sync`, `POST /v1/templates/publish-pending` |
| E-mails         | `POST /v1/emails`, `GET /v1/emails/:id/timeline`, `GET                                                                                                           | PUT                                                                                                        | DELETE /v1/email-configurations/smtp` |
| Webhooks        | `GET                                                                                                                                                             | POST /webhooks/meta`, `GET /v1/webhook-events`, `POST /v1/webhook-events/:id/reprocess`                    |
| Dashboard       | `GET /v1/dashboard/resource-summary`, `/message-volume`, `/delivery-status`, `/operational-health`, `/recent-messages`                                           |
| Operação        | `GET /v1/monitoring/applications/:applicationId`, `GET /v1/engineering-alerts`, `GET /v1/system-logs`                                                            |
| Sandbox         | `GET /v1/sandbox/messages/configuration`, `POST /v1/sandbox/messages/:id/status`                                                                                 |

As coleções paginadas aceitam `page` e `pageSize` (máximo 100); vários recursos também aceitam filtros como `status`, `search`, `tenantId` ou `applicationId`. A API rejeita campos não declarados, converte DTOs validados e não expõe payloads brutos de providers.

## Processamento assíncrono e confiabilidade

### Outbox transacional

O aceite de uma mensagem, e-mail ou webhook persiste o agregado e o evento de trabalho na mesma transação PostgreSQL. Um dispatcher consulta a outbox a cada segundo, bloqueia lotes com `FOR UPDATE SKIP LOCKED`, publica mensagens persistentes no RabbitMQ e só marca o evento como processado após confirmação da publicação.

Se a publicação falhar, o evento permanece recuperável: o dispatcher agenda nova tentativa com backoff exponencial, limitado a 15 minutos, e marca a falha definitiva após 25 tentativas. Esse desenho evita a perda causada pelo intervalo entre `commit` no banco e `publish` na fila.

### Filas

| Trabalho                      | Fila                      | DLQ                           |
| ----------------------------- | ------------------------- | ----------------------------- |
| Envio WhatsApp                | `message.requested`       | `message.requested.dlq`       |
| Envio de e-mail               | `email.requested`         | `email.requested.dlq`         |
| Webhook recebido da Meta      | `meta.webhook.received`   | `meta.webhook.received.dlq`   |
| Callback de mensagem recebida | `inbound-message.webhook` | `inbound-message.webhook.dlq` |
| Callback de mudança de status | `message.status.webhook`  | `message.status.webhook.dlq`  |

Workers processam entrega _at-least-once_. Entidades de domínio controlam transições, idempotência e registro de tentativas. Erros transitórios de mensagem, e-mail e callbacks usam 1 s, 5 s e 30 s antes do encaminhamento à DLQ.

> Limitação operacional atual: o agendamento desse último retry ocorre por `setTimeout` em memória nos workers. A outbox é durável, mas um processo reiniciado durante o atraso não preserva esse timer. Para resiliência total em produção, substitua-o por filas RabbitMQ com TTL/DLQ, plugin de mensagens atrasadas ou scheduler persistente.

### Webhooks

O endpoint da Meta é único: `GET|POST /webhooks/meta`.

1. O `GET` responde o handshake `hub.challenge` somente com `hub.verify_token` válido, comparado em tempo constante.
2. O `POST` exige `X-Hub-Signature-256`, calculada sobre o corpo bruto com o `appSecret` aplicável.
3. O conteúdo é deduplicado por SHA-256, persistido como evento e publicado pela outbox.
4. O worker atualiza mensagens e gera callbacks assíncronos para as aplicações quando cabível.

Configure a URL pública HTTPS na Meta como `https://api.seu-dominio.com.br/webhooks/meta`. Processamento pesado não acontece no ciclo HTTP do webhook.

## Configuração

Os exemplos completos estão em [`.env.example`](./.env.example), [`.env.production.example`](./.env.production.example), [`backend/.env.example`](./backend/.env.example) e [`frontend/.env.example`](./frontend/.env.example). Nunca versione os arquivos `.env` efetivos.

| Grupo             | Variáveis principais                                                                                                               | Observações                                                                                                                 |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Runtime           | `NODE_ENV`, `PORT`, `LOG_LEVEL`, `CORS_ORIGINS`, `SWAGGER_ENABLED`, `TRUST_PROXY`                                                  | Em produção CORS deve conter origins HTTPS exatos; Swagger é proibido. Ative `TRUST_PROXY` apenas atrás de proxy confiável. |
| Dados e fila      | `DATABASE_URL`, `RABBITMQ_URL`                                                                                                     | Obrigatórias no backend.                                                                                                    |
| Admin inicial     | `INITIAL_PLATFORM_ADMIN_EMAIL`, `INITIAL_PLATFORM_ADMIN_PASSWORD`                                                                  | A senha deve ter pelo menos 12 caracteres; valores de demonstração são bloqueados em produção.                              |
| Provider          | `MESSAGE_PROVIDER`, `SANDBOX_ENABLED`                                                                                              | Valores: `meta` ou `sandbox`. Produção exige `meta` e sandbox desabilitado.                                                 |
| Meta              | `META_GRAPH_API_URL_BASE`, `META_WEBHOOK_VERIFY_TOKEN`, `META_APP_SECRET`                                                          | Token de handshake e App Secret são obrigatórios em produção.                                                               |
| Canal padrão Meta | `META_DEFAULT_CHANNEL_*`                                                                                                           | Habilite apenas se o ambiente gerenciar uma WABA compartilhada; tenant, nome e WABA são obrigatórios nesse modo.            |
| Cifragem          | `META_CREDENTIALS_ENCRYPTION_KEY`                                                                                                  | Base64 de exatamente 32 bytes, usada em AES-256-GCM para tokens Meta e senhas SMTP de tenant.                               |
| SMTP global       | `SMTP_DEFAULT_ENABLED`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME` | É fallback para tenants sem override.                                                                                       |
| Alertas           | `ENGINEERING_SLACK_WEBHOOK_URL`, `ENGINEERING_TEAMS_WEBHOOK_URL`, `ENGINEERING_EMAIL_WEBHOOK_URL`                                  | URLs HTTP(S); em produção somente HTTPS.                                                                                    |
| Frontend          | `VITE_API_URL`                                                                                                                     | É embutida no build Vite e precisa ser acessível pelo navegador, não pela rede interna Docker.                              |

Gere uma chave de cifragem adequada:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

O canal padrão (`META_DEFAULT_CHANNEL_ENABLED=true`) é reconciliado no boot. Seu token não é aceito por requests administrativos, nem retornado por DTOs. Credenciais fornecidas por tenant e `appSecret` de webhook são cifrados antes de persistir.

## Console web

O frontend é um console React 19 + MUI 7, com React Router, TanStack Query, React Hook Form e Zod. Todas as páginas protegidas exigem sessão administrativa.

| Área              | O que permite operar                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------ |
| Visão geral       | Volumes, status de entrega, saúde operacional e mensagens recentes.                        |
| Administração     | Tenants, aplicações, WABAs, números, SMTP, API keys, usuários, auditoria e logs.           |
| Mensageria        | Mensagens, templates, documentação da API, webhooks/DLQ, monitoramento, alertas e sandbox. |
| Manual do usuário | Guia em português, tela a tela, para a operação do Hub.                                    |

No ambiente nativo, o console abre em `http://localhost:5173`; no Docker, em `http://localhost:8080`. A página `/api-docs` direciona o operador à documentação HTTP, enquanto `/help` reúne o manual operacional.

## Operação, segurança e observabilidade

### Produção com Docker Compose

Use o overlay de produção, após preencher um `.env` próprio a partir de [`.env.production.example`](./.env.production.example):

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

O overlay não configura TLS. Ele remove a exposição pública de PostgreSQL/RabbitMQ, publica API e console apenas em `127.0.0.1`, desabilita Swagger, habilita `TRUST_PROXY`, limita logs/recursos e pressupõe um reverse proxy confiável terminando HTTPS.

Valide o deploy pelos endpoints públicos:

```bash
curl --fail https://api.seu-dominio.com.br/health
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs --tail=100 backend migrate
```

### Controles implementados

- `helmet`, compressão, remoção de `X-Powered-By`, CORS explícito e `ValidationPipe` global com whitelist/forbid.
- Rate limit padrão de 100 requisições/minuto; login limitado a 5/minuto. O escopo de uso da API key continua validado pela Application e pelo Tenant em cada operação.
- `TRUST_PROXY` só deve ser ativado quando o proxy sobrescreve cabeçalhos encaminhados, evitando falsificação do IP usado no rate limit.
- URL de webhook de Application precisa ser HTTPS e passar por validação contra destinos privados/inseguros.
- Logs estruturados com redaction para segredos; correlação por request, mensagem, tentativa, tenant, aplicação e provider quando aplicável.
- Auditoria persistente de operações mutáveis autenticadas; schemas PostgreSQL: `app`, `audit` e `events`.
- Health checks de banco e RabbitMQ em `/health` e `/health/ready`; liveness simples em `/health/live`.

Não registre API keys completas, tokens Meta, senha SMTP, corpo de credenciais ou segredos em logs, issues e commits. Consulte [SECURITY.md](./SECURITY.md) para reportar vulnerabilidades de forma privada.

## Qualidade, CI/CD e contribuição

### Comandos locais

```bash
# Backend
npm run validate --prefix backend
npm run test:e2e --prefix backend
npm run build --prefix backend

# Frontend
npm run validate --prefix frontend
```

`validate` executa formatação, lint, typecheck e testes. O backend usa Jest (unitários e E2E); o frontend usa Vitest. A suíte privilegia regras de domínio e aplicação sem dependências externas, complementadas por testes HTTP/E2E.

### CI

Em `main` e pull requests, o GitHub Actions detecta mudanças de backend/frontend e executa, conforme necessário:

1. formatação, lint e typecheck;
2. testes unitários, E2E e cobertura;
3. migrations em PostgreSQL limpo, reversão individual de todas as migrations e nova aplicação;
4. auditoria de dependências (`npm audit --audit-level=high`);
5. build de backend, frontend e imagens Docker.

### Release e deploy

Uma tag estável `vX.Y.Z`, com versão idêntica nos dois `package.json`, dispara validação completa, imagens multi-arquitetura (`linux/amd64` e `linux/arm64`) no GHCR, GitHub Release e deploy via ambiente `production`.

O servidor de deploy deve possuir `.env` de produção preenchido, Docker Compose v2, autenticação de leitura no GHCR e os arquivos `docker-compose.yml`, `docker-compose.prod.yml` e `docker-compose.release.yml`. O workflow usa imagens imutáveis com `--no-build`.

Consulte [CONTRIBUTING.md](./CONTRIBUTING.md) para regras de contribuição e [AGENTS.md](./AGENTS.md) para as decisões e restrições arquiteturais completas.

## Licença

Distribuído sob a [MIT License](./LICENSE).
