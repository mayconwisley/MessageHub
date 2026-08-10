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
`tenants`, `applications` (inclui `api-keys`), `whatsapp-accounts`, `phone-numbers`, `messages`.
`templates` e `webhooks` existem apenas como esqueleto (estrutura de pastas + módulo NestJS),
prontos para receber casos de uso nas próximas iterações.

## Setup

```bash
cp .env.example .env
npm install
docker compose up -d postgres rabbitmq
npm run migration:run
npm run start:dev
```

API disponível em `http://localhost:3000`, documentação Swagger em `http://localhost:3000/docs`,
health check em `http://localhost:3000/health`.

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
7. `GET /v1/messages/:id` — consulta o status atual (`PENDING → PROCESSING → SENT`, ou
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
- `templates` e `webhooks` são esqueletos sem casos de uso implementados.
- Redis está disponível no `docker-compose.yml` mas ainda não é consumido por nenhum módulo.
- Hashing de API Key usa `bcryptjs` (implementação pura em JS) em vez de `bcrypt` nativo, para
  evitar dependência de build nativo no ambiente de desenvolvimento.
