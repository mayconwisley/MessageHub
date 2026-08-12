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

## Fluxo de ponta a ponta

1. `POST /v1/tenants` — cria um Tenant.
2. `POST /v1/applications` — cria uma Application vinculada ao Tenant.
3. `POST /v1/applications/:applicationId/api-keys` — gera uma API Key (`wh_live_...`, exibida em
   texto puro **apenas nesta resposta**; hash é o único dado persistido).
4. `POST /v1/whatsapp-accounts` — registra uma WhatsApp Business Account (WABA) da Meta.
5. `POST /v1/phone-numbers` — registra um Phone Number da Meta vinculado à WABA.
6. `POST /v1/messages` com `Authorization: Bearer wh_live_...` — envia uma mensagem. O envio é
   assíncrono: a Message é criada com status `PENDING`, publicada no RabbitMQ e processada pelo
   `MessageWorker`, que chama a Graph API através do `MetaWhatsAppProvider`.
7. `POST /v1/templates`, `GET /v1/templates`, `GET/PUT/DELETE /v1/templates/:id`,
   `POST /v1/templates/sync` e `POST /v1/templates/publish-pending` — administram o catálogo
   local de templates da Meta no escopo da WABA do tenant, incluindo rascunhos e sincronização.
8. `GET /webhooks/meta` realiza o handshake da Meta e `POST /webhooks/meta` valida
   `X-Hub-Signature-256` antes de atualizar o status da mensagem (`SENT → DELIVERED → READ`).

## Credenciais da Meta

Cada WABA possui uma origem de credenciais, informada no campo `credentialSource`:

- `default`: usa `META_DEFAULT_CHANNEL_BEARER`, mantido somente no ambiente do Hub e habilitado por `META_DEFAULT_CHANNEL_ENABLED=true`. O request não aceita `accessToken`.
- `tenant`: usa o `accessToken` informado pelo tenant no cadastro. Ele é armazenado com AES-256-GCM; a chave `META_CREDENTIALS_ENCRYPTION_KEY` deve ser Base64 e conter 32 bytes.

O token e o `appSecret` opcional do webhook nunca são retornados pela API, incluídos em DTOs de resposta ou registrados nos logs. Ambos são cifrados em repouso. Após implantar, execute as migrations. Credenciais legadas são protegidas automaticamente na primeira leitura; recomenda-se a rotação de tokens após a implantação.

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

## Autenticação administrativa

Os endpoints de cadastro e gestão exigem uma sessão de usuário com papel `platform_admin`, enviada em `Authorization: Bearer mh_session_...`. As API keys de aplicações são usadas pelos endpoints de mensagens e templates. Webhooks da Meta são anônimos apenas porque possuem validação criptográfica obrigatória.

No primeiro boot, quando ainda não há usuários, o Hub cria o administrador inicial com `INITIAL_PLATFORM_ADMIN_EMAIL` e `INITIAL_PLATFORM_ADMIN_PASSWORD`. Depois, faça login em `POST /v1/auth/sessions` e use a sessão retornada para criar outros usuários em `POST /v1/users`. Senhas são armazenadas com bcrypt; sessões são tokens opacos, persistidos apenas como hash e expiram em 12 horas.

## Persistência e auditoria

- `app`: dados de negócio, usuários e sessões;
- `audit`: trilha persistida de operações mutáveis autenticadas, sem payloads ou secrets;
- `events`: outbox transacional preparado para publicação confiável de eventos de domínio.

Execute as migrations antes da implantação. As tabelas atuais são movidas de `public` para `app` pela migration versionada. 7. `GET /v1/messages/:id` — consulta o status atual (`PENDING → PROCESSING → SENT`, ou
`FAILED → RETRY → PROCESSING` em caso de falha).

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
