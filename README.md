<p align="center">
  <img src="./frontend/src/assets/brand/message-hub-logo-dark.svg" alt="Message Hub" width="312" />
</p>

<p align="center">
  Plataforma interna para centralizar integrações de mensageria com a Meta WhatsApp Business Platform.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-22%2B-339933?logo=node.js&logoColor=white" alt="Node.js 22+" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5.7" />
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white" alt="NestJS 11" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL 16" />
  <img src="https://img.shields.io/badge/RabbitMQ-3-FF6600?logo=rabbitmq&logoColor=white" alt="RabbitMQ 3" />
  <img src="https://img.shields.io/badge/TypeORM-0.3-FE0803?logo=typeorm&logoColor=white" alt="TypeORM 0.3" />
  <img src="https://img.shields.io/badge/Swagger%2FOpenAPI-11-85EA2D?logo=swagger&logoColor=black" alt="Swagger / OpenAPI 11" />
  <img src="https://img.shields.io/badge/Jest-29-C21325?logo=jest&logoColor=white" alt="Jest 29" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=111827" alt="React 19" />
  <img src="https://img.shields.io/badge/MUI-7-007FFF?logo=mui&logoColor=white" alt="MUI 7" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" alt="Vite 6" />
  <img src="https://img.shields.io/badge/Vitest-4-6E9F18?logo=vitest&logoColor=white" alt="Vitest 4" />
  <img src="https://img.shields.io/badge/TanStack%20Query-5-FF4154?logo=reactquery&logoColor=white" alt="TanStack Query 5" />
  <img src="https://img.shields.io/badge/React%20Router-7-CA4245?logo=reactrouter&logoColor=white" alt="React Router 7" />
  <img src="https://img.shields.io/badge/Zod-3-3E67B1?logo=zod&logoColor=white" alt="Zod 3" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Docker%20Compose-2496ED?logo=docker&logoColor=white" alt="Docker Compose" />
  <img src="https://img.shields.io/badge/GitHub%20Actions-CI-2088FF?logo=githubactions&logoColor=white" alt="GitHub Actions CI" />
  <img src="https://img.shields.io/badge/CodeQL-Security-4B32C3?logo=github&logoColor=white" alt="CodeQL security scanning" />
  <img src="https://img.shields.io/badge/ESLint-9-4B32C3?logo=eslint&logoColor=white" alt="ESLint 9" />
  <img src="https://img.shields.io/badge/Prettier-3-F7B93E?logo=prettier&logoColor=black" alt="Prettier 3" />
  <img src="https://img.shields.io/badge/Helmet-8-000000?logo=helm&logoColor=white" alt="Helmet 8" />
</p>

# Message Hub

WhatsApp/Messaging Hub centralizado — abstrai e centraliza a integração com a **Meta WhatsApp
Business Platform**, expondo um contrato de API interno estável para múltiplos sistemas
consumidores. Arquitetura completa descrita em [AGENTS.md](./AGENTS.md).

## Stack

NestJS + TypeScript, PostgreSQL (TypeORM), RabbitMQ, DDD + Clean Architecture, CQRS + Mediator,
Result Pattern.

## Estrutura

Organização por Bounded Context (`src/modules/*`), cada um com `domain/ → application/ →
infrastructure/ → presentation/`. Módulos com fluxo de negócio completo nesta entrega:
`tenants`, `applications` (inclui `api-keys`), `whatsapp-accounts`, `phone-numbers`, `messages`,
`templates` e `webhooks`.

## Setup

```bash
cp .env.example .env
npm install
npm run migration:run
npm run start:dev
```

Antes de executar as migrations, configure no `.env` instâncias acessíveis de PostgreSQL e
RabbitMQ por meio de `DATABASE_URL` e `RABBITMQ_URL`. A aplicação inicia mesmo que o RabbitMQ
esteja temporariamente indisponível, mas o processamento assíncrono de mensagens e webhooks só
ocorre após a reconexão.

Com o valor padrão do `.env.example`, a API fica disponível em `http://localhost:3000`, a
documentação Swagger em `http://localhost:3000/docs` e o health check em
`http://localhost:3000/health`.

## Console web (frontend)

O diretório `frontend/` contém um console operacional em React para administrar o Hub sem chamar a
API diretamente.

```bash
cp frontend/.env.example frontend/.env
npm install --prefix frontend
npm run dev --prefix frontend
```

Com o valor padrão do `frontend/.env.example`, o console fica disponível em
`http://localhost:5173` e consome a API configurada em `VITE_API_URL`. O login usa a sessão
administrativa (`POST /v1/auth/sessions`); veja as credenciais iniciais em
[Autenticação administrativa](#autenticação-administrativa).

Dentro do próprio console, a tela **Manual do usuário** (`/help`, no menu lateral) explica em
português, tela por tela, como cadastrar tenants, aplicações, contas WhatsApp, números, API keys e
templates, e como enviar e acompanhar mensagens — é a referência recomendada para quem opera o
Hub pela interface web. Para quem vai integrar sistemas via API, use a tela **Documentação da
API** (`/api-docs`) ou o Swagger em `/docs`.

## Docker

Para testar a aplicação completa (console web + API + PostgreSQL + RabbitMQ) sem instalar
nada localmente, com um único comando:

```bash
docker compose up --build
```

Console em `http://localhost:8080`, API em `http://localhost:3000` (Swagger em `/docs`).
O login inicial usa `admin@example.com` / `ChangeMe123!Hub` (definidos em
[docker-compose.yml](./docker-compose.yml); sobrescreva copiando [.env.example](./.env.example)
para `.env` na raiz). Por padrão o compose usa `MESSAGE_PROVIDER=sandbox`, então o envio de
mensagens é simulado e não são necessárias credenciais reais da Meta para explorar o sistema.

As migrations rodam automaticamente antes da API subir (serviço `migrate`, que executa uma vez e
encerra). Dados de Postgres/RabbitMQ persistem em volumes Docker entre reinicializações; para
recomeçar do zero: `docker compose down -v`.

Este fluxo com Docker existe apenas para facilitar testes/demonstração — o desenvolvimento do
dia a dia continua com os comandos de [Setup](#setup) e [Console web](#console-web-frontend)
acima, executados diretamente com Node.js.

Para produção, combine com o overlay [docker-compose.prod.yml](./docker-compose.prod.yml), que
desativa o Swagger, ativa `TRUST_PROXY`, não publica as portas do Postgres/RabbitMQ e restringe
backend/frontend a `127.0.0.1` (assumindo um reverse proxy com TLS na frente). É obrigatório
fornecer um `.env` próprio com segredos reais (senhas, chave de cifragem, `CORS_ORIGINS` HTTPS) —
ver os comentários em `docker-compose.prod.yml` e `.env.example`:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Esses artefatos de containerização não são usados hoje nem no desenvolvimento nem na operação
real da plataforma — foram preparados para quando essa etapa for iniciada.

## Fluxo de ponta a ponta

1. `POST /v1/tenants` — cria um Tenant.
2. `POST /v1/applications` — cria uma Application vinculada ao Tenant.
3. `POST /v1/applications/:applicationId/api-keys` — gera uma API Key (`wh_live_...`, exibida em
   texto puro **apenas nesta resposta**; hash é o único dado persistido).
4. `POST /v1/whatsapp-accounts` — registra uma WhatsApp Business Account (WABA) da Meta.
5. `POST /v1/phone-numbers` — registra um Phone Number da Meta vinculado à WABA.
6. `PUT /v1/applications/:applicationId/phone-numbers` — vincula um ou mais Phone Numbers à
   Application (cadastro inicial, feito uma única vez pela sessão administrativa).
7. `POST /v1/messages` com `Authorization: Bearer wh_live_...` — envia uma mensagem. O envio é
   assíncrono: a Message é criada com status `PENDING`, publicada no RabbitMQ e processada pelo
   `MessageWorker`, que chama a Graph API através do `MetaWhatsAppProvider`. `phoneNumberId` no
   corpo da requisição é opcional: quando omitido, o Hub usa o único Phone Number vinculado à
   Application no passo anterior — só é obrigatório informá-lo se a Application tiver mais de um
   número vinculado, ou nenhum.
8. `POST /v1/templates`, `GET /v1/templates`, `GET/PUT/DELETE /v1/templates/:id`,
   `POST /v1/templates/sync` e `POST /v1/templates/publish-pending` — administram o catálogo
   local de templates da Meta no escopo da WABA do tenant, incluindo rascunhos e sincronização.
9. `GET /webhooks/meta` realiza o handshake da Meta e `POST /webhooks/meta` valida
   `X-Hub-Signature-256` antes de atualizar o status da mensagem (`SENT → DELIVERED → READ`).

## Destinatários, usernames e BSUID

O campo `to` dos endpoints de envio aceita um número E.164 ou um **BSUID** (_Business-Scoped
User ID_) recebido da Meta. Usuários que adotarem username podem ocultar o telefone; nesse caso,
não há como enviar para o texto `@username`. Reutilize exatamente o valor `sender.id` recebido no
webhook para responder ao usuário.

O webhook entregue à URL configurada pela Application inclui a identidade normalizada abaixo:

```json
{
  "event": "whatsapp.message_received",
  "data": {
    "sender": {
      "id": "bsuid:customer-123",
      "displayName": "Maria Silva"
    }
  }
}
```

`displayName` é somente informativo; `sender.id` é o identificador para novas mensagens. Para
usuários sem username, esse campo continua contendo o `wa_id`/telefone recebido da Meta.

## Credenciais da Meta

Cada WABA possui uma origem de credenciais, informada no campo `credentialSource`:

- `default`: usa `META_DEFAULT_CHANNEL_BEARER`, mantido somente no ambiente do Hub e habilitado por `META_DEFAULT_CHANNEL_ENABLED=true`. O request não aceita `accessToken`.
- `tenant`: usa o `accessToken` informado pelo tenant no cadastro. Ele é armazenado com AES-256-GCM; a chave `META_CREDENTIALS_ENCRYPTION_KEY` deve ser Base64 e conter 32 bytes.

O token e o `appSecret` opcional do webhook nunca são retornados pela API, incluídos em DTOs de resposta ou registrados nos logs. Ambos são cifrados em repouso. Após implantar, execute as migrations. Credenciais legadas são protegidas automaticamente na primeira leitura; recomenda-se a rotação de tokens após a implantação.

Quando `META_DEFAULT_CHANNEL_ENABLED=true`, informe também `META_DEFAULT_CHANNEL_TENANT_ID` (UUID estável), `META_DEFAULT_CHANNEL_TENANT_NAME` e `META_DEFAULT_CHANNEL_WABA_ID`. A cada inicialização, o Hub cria ou reconcilia esse tenant e sua conta WhatsApp com `credentialSource=default`; mudanças nesses valores do `.env` passam a valer após reiniciar a API. Esse cadastro é somente leitura na interface e não deve ser gerenciado por endpoints administrativos.

## Exemplos de parâmetros em templates

Componentes `HEADER` e `BODY` que possuem placeholders posicionais (`{{1}}`, `{{2}}`, etc.)
devem enviar valores de exemplo. O Hub recebe o contrato em camelCase e o converte internamente
para o formato exigido pela Meta (`header_text` e `body_text`). Os placeholders precisam ser
sequenciais e toda linha de exemplo deve fornecer um valor para cada parâmetro.

```json
{
  "type": "BODY",
  "text": "Olá {{1}}, o pedido {{2}} foi confirmado.",
  "example": {
    "bodyText": [{ "values": ["Maria Silva", "PED-2026-001"] }]
  }
}
```

## Gestão de modelos Meta pelo console

O console em `/templates` administra o ciclo completo do modelo sem exigir acesso ao painel da
Meta: criação, edição, exclusão, sincronização, publicação de rascunhos e visualização. O editor
suporta `HEADER`, `BODY`, `FOOTER`, variáveis posicionais com exemplos e um botão URL. Modelos
alterados após a publicação retornam para análise da Meta; nome e idioma permanecem imutáveis.

## Autenticação administrativa

Os endpoints de cadastro e gestão exigem uma sessão de usuário com papel `platform_admin`, enviada em `Authorization: Bearer mh_session_...`. As API keys de aplicações são usadas pelos endpoints de mensagens e templates. Webhooks da Meta são anônimos apenas porque possuem validação criptográfica obrigatória.

No primeiro boot, quando ainda não há usuários, o Hub cria o administrador inicial com `INITIAL_PLATFORM_ADMIN_EMAIL` e `INITIAL_PLATFORM_ADMIN_PASSWORD`. Depois, faça login em `POST /v1/auth/sessions` e use a sessão retornada para criar outros usuários em `POST /v1/users`. Senhas são armazenadas com bcrypt; sessões são tokens opacos, persistidos apenas como hash e expiram em 12 horas.

## Persistência e auditoria

- `app`: dados de negócio, usuários e sessões;
- `audit`: trilha persistida de operações mutáveis autenticadas, sem payloads ou secrets;
- `events`: outbox transacional preparado para publicação confiável de eventos de domínio.

Execute as migrations antes da implantação. As tabelas atuais são movidas de `public` para `app` pela migration versionada. 7. `GET /v1/messages/:id` — consulta o status atual (`PENDING → PROCESSING → SENT`, ou
`FAILED → RETRY → PROCESSING` em caso de falha).

As coleções administrativas possuem listagem paginada: `GET /v1/tenants`,
`GET /v1/applications?tenantId=:tenantId`, `GET /v1/whatsapp-accounts?tenantId=:tenantId` e
`GET /v1/phone-numbers?tenantId=:tenantId`. Todas aceitam `page` e `pageSize` (máximo 100).

Envie `Idempotency-Key: <chave>` no `POST /v1/messages` para evitar duplicidade em caso de retry
do cliente.

## Testes

```bash
npm test          # unitários (domain + application)
npm run test:e2e  # fluxo HTTP de ponta a ponta
```

## Limitações conhecidas desta entrega

- Endpoints de administração (`tenants`, `applications`, `api-keys`, `whatsapp-accounts`,
  `phone-numbers`) ainda não possuem autenticação própria — em produção devem ficar atrás de um
  controle de acesso administrativo separado do `wh_live_` usado pelos consumidores.
- O reagendamento de retry do `MessageWorker` usa `setTimeout` em memória; não é durável a
  reinícios do processo. Em produção, considerar o plugin de mensagens atrasadas do RabbitMQ ou
  um scheduler externo.
- O processamento dos webhooks é persistido e deduplicado por hash; o request HTTP apenas valida e publica o evento, enquanto um worker RabbitMQ atualiza a mensagem e encaminha falhas para DLQ.
- Hashing de API Key usa `bcryptjs` (implementação pura em JS) em vez de `bcrypt` nativo, para
  evitar dependência de build nativo no ambiente de desenvolvimento.
