# AGENTS.md

## Message Hub

Este projeto é um **WhatsApp/Messaging Hub centralizado**, responsável por abstrair e centralizar a integração com a **Meta WhatsApp Business Platform**.

O objetivo é permitir que múltiplos sistemas consumam uma única API interna para envio, recebimento e gerenciamento de mensagens WhatsApp, evitando que cada sistema implemente diretamente as APIs da Meta.

---

# 1. Objetivo do Projeto

O Message Hub deve funcionar como uma camada de integração entre os sistemas consumidores e a Meta.

```text
┌────────────────────┐
│    Projeto A       │
└─────────┬──────────┘
          │
┌────────────────────┐
│    Projeto B       │
└─────────┬──────────┘
          │
┌────────────────────┐
│    Projeto C       │
└─────────┬──────────┘
          │
          │ HTTP API
          ▼
┌────────────────────────────────────┐
│          Message Hub              │
│                                    │
│ NestJS + TypeScript                │
│ DDD + Clean Architecture           │
│ CQRS + Mediator                    │
│ Result Pattern                     │
└────────────────┬───────────────────┘
                 │
                 │ Meta Graph API
                 ▼
        ┌────────────────────┐
        │       Meta         │
        │ WhatsApp Business  │
        └────────────────────┘
```

O Hub deve esconder dos sistemas consumidores todos os detalhes específicos da Meta, incluindo:

- Graph API;
- Access Tokens;
- Phone Number ID;
- WhatsApp Business Account ID;
- payloads específicos da Meta;
- URLs da Meta;
- Webhooks da Meta;
- regras de retry;
- tratamento de erros da Meta;
- rate limits;
- versionamento da API da Meta.

Os sistemas consumidores devem depender somente do contrato da API do Hub.

---

# 2. Princípios Arquiteturais

O projeto deve seguir obrigatoriamente:

- Domain-Driven Design (DDD);
- Clean Architecture;
- Clean Code;
- SOLID;
- Separation of Concerns;
- Dependency Inversion;
- Result Pattern;
- CQRS;
- Mediator Pattern;
- Dependency Injection;
- programação orientada a interfaces;
- responsabilidade única por arquivo;
- responsabilidade única por classe;
- baixo acoplamento;
- alta coesão;
- composição sobre herança quando apropriado.

A arquitetura deve priorizar **manutenibilidade, testabilidade, extensibilidade e isolamento de dependências externas**.

---

# 3. Stack Principal

Tecnologias principais:

- Node.js;
- TypeScript;
- NestJS;
- PostgreSQL;
- ORM compatível com TypeScript;
- RabbitMQ;
- Redis quando necessário;
- OpenAPI/Swagger;
- Jest.

Bibliotecas adicionais devem ser adicionadas somente quando houver justificativa técnica.

Evitar dependências desnecessárias.

## Tipagem TypeScript

É proibido utilizar `any` no backend e no frontend, inclusive de forma explícita, implícita, em casts, tipos genéricos, callbacks, DTOs, contratos HTTP, mocks e integrações externas.

- Usar `unknown` para dados cujo formato ainda não foi validado e realizar o estreitamento de tipo antes do uso;
- Definir interfaces, tipos, DTOs e generics explícitos para todos os contratos conhecidos;
- Preferir `Record<string, unknown>` a objetos sem tipagem quando a estrutura for dinâmica;
- Não desabilitar regras do TypeScript ou ESLint para contornar a proibição de `any`.

---

# 4. Clean Architecture

A aplicação deve ser dividida em camadas com dependências direcionadas para dentro.

```text
┌─────────────────────────────────────┐
│             API / HTTP              │
│             NestJS                  │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│          Infrastructure             │
│ DB / RabbitMQ / Meta / Redis        │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│            Application              │
│ Commands / Queries / Handlers       │
│ DTOs / Ports / Use Cases            │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│              Domain                 │
│ Entities / Value Objects / Rules    │
│ Domain Services / Events            │
└─────────────────────────────────────┘
```

A camada Domain não pode depender de:

- NestJS;
- TypeORM;
- Prisma;
- PostgreSQL;
- RabbitMQ;
- Redis;
- HTTP;
- Meta API;
- bibliotecas de infraestrutura.

A camada Application também não deve depender diretamente de implementações concretas de infraestrutura.

---

# 5. Estrutura de Diretórios

A estrutura deve seguir responsabilidade e contexto de negócio.

```text
src/
├── domain/
│   ├── entities/
│   ├── value-objects/
│   ├── aggregates/
│   ├── domain-services/
│   ├── events/
│   ├── repositories/
│   ├── errors/
│   └── enums/
│
├── application/
│   ├── commands/
│   ├── queries/
│   ├── handlers/
│   ├── dto/
│   ├── ports/
│   ├── services/
│   └── mappers/
│
├── infrastructure/
│   ├── database/
│   │   ├── entities/
│   │   ├── repositories/
│   │   ├── migrations/
│   │   └── configuration/
│   │
│   ├── messaging/
│   │   ├── rabbitmq/
│   │   └── consumers/
│   │
│   ├── meta/
│   │   ├── clients/
│   │   ├── dto/
│   │   ├── mappers/
│   │   └── services/
│   │
│   ├── cache/
│   └── configuration/
│
├── presentation/
│   ├── http/
│   │   ├── controllers/
│   │   ├── dto/
│   │   ├── guards/
│   │   ├── filters/
│   │   ├── interceptors/
│   │   └── pipes/
│   │
│   └── webhooks/
│
├── shared/
│   ├── result/
│   ├── errors/
│   ├── types/
│   ├── constants/
│   └── utils/
│
└── main.ts
```

Quando o projeto crescer, preferir organização por **Bounded Context/feature**, mantendo as mesmas separações arquiteturais.

Exemplo:

```text
src/
├── modules/
│   ├── applications/
│   ├── tenants/
│   ├── whatsapp-accounts/
│   ├── phone-numbers/
│   ├── messages/
│   ├── templates/
│   └── webhooks/
│
├── shared/
└── main.ts
```

Dentro de cada módulo, manter a separação:

```text
messages/
├── domain/
├── application/
├── infrastructure/
└── presentation/
```

Preferir essa abordagem quando houver vários Bounded Contexts.

## 5.1 Estrutura real atual (referência viva)

O backend já adota a organização por módulo/Bounded Context descrita acima. Estrutura atual de `backend/src/`:

```text
backend/src/
├── app.module.ts
├── main.ts
│
├── infrastructure/
│   ├── configuration/        # app.config, database.config, meta.config, rabbitmq.config, env.validation
│   ├── database/              # data-source.ts, database.module.ts, migrations/
│   ├── logging/                # pino, captura de logs de sistema
│   ├── messaging/rabbitmq/    # módulo, constants, health indicator
│   ├── meta/                   # clients/ dto/ errors/ mappers/ services/ (Graph API)
│   └── sandbox/                 # provider de mensagens para ambiente sandbox
│
├── presentation/http/
│   ├── controllers/            # ex.: health.controller.ts
│   ├── decorators/             # current-auth-context, current-authenticated-user...
│   ├── dto/                     # pagination-query.dto.ts
│   ├── filters/                  # global-exception.filter.ts
│   ├── guards/                   # api-key, platform-admin, tenant-api-key, user-session...
│   ├── interceptors/            # audit-log.interceptor.ts
│   ├── result-http.mapper.ts
│   └── validation-message.translator.ts
│
├── shared/
│   ├── constants/
│   ├── domain/                  # entity.base.ts, value-object.base.ts, unique-id.ts
│   ├── errors/                   # base.error.ts, rate-limit-exceeded.error.ts
│   ├── mediator/                # mediator.ts, command.base.ts, query.base.ts
│   ├── result/                   # result.ts
│   ├── security/                 # webhook-url.security.ts
│   └── types/
│
└── modules/
    ├── applications/            # Application + ApiKey (contexto Identity)
    ├── audit/                    # trilha de auditoria administrativa
    ├── dashboard/                # queries agregadas para o painel operacional
    ├── identity/                 # User, autenticação, sessão
    ├── messages/                 # Message, MessageAttempt, worker de envio
    ├── monitoring/                # monitor de integrações (quotas, saúde de credenciais)
    ├── notifications/             # alertas de engenharia (Slack/Teams/E-mail)
    ├── phone-numbers/
    ├── system-logs/               # captura de logs técnicos em banco
    ├── templates/
    ├── tenants/
    ├── webhooks/                  # WebhookEvent, processamento e replays
    └── whatsapp-accounts/
```

Cada módulo em `modules/` segue a mesma separação interna:

```text
modules/<contexto>/
├── domain/
│   ├── entities/
│   ├── enums/
│   ├── errors/
│   ├── repositories/           # interfaces (ex.: *.repository.interface.ts)
│   └── value-objects/           # quando aplicável
│
├── application/
│   ├── commands/
│   ├── queries/
│   ├── handlers/
│   ├── dto/
│   ├── mappers/
│   ├── ports/                   # interfaces de infraestrutura (publishers, providers)
│   └── services/                # regra específica que não é Command/Query
│
├── infrastructure/
│   ├── entities/                 # *.orm-entity.ts
│   ├── repositories/              # postgres-*.repository.ts
│   ├── messaging/                 # publishers/constants RabbitMQ do módulo
│   ├── workers/                    # consumers RabbitMQ
│   └── security/                   # ex.: access-token-cipher.service.ts
│
├── presentation/
│   ├── controllers/
│   ├── dto/
│   └── mappers/
│
└── <contexto>.module.ts
```

**Desvio conhecido a corrigir:** o módulo `templates` ainda não possui `commands/`, `queries/` nem `handlers/` — `TemplatesController` chama `TemplateManagementService` diretamente, fora do Mediator. Ao refatorar esse módulo, alinhar à estrutura acima (ver seção 12).

---

# 6. DDD

O domínio deve representar conceitos reais do negócio.

Principais conceitos esperados:

```text
Tenant
Application
ApiKey
WhatsAppAccount
PhoneNumber
Template
Message
MessageAttempt
WebhookEvent
```

Esses conceitos não devem ser tratados apenas como tabelas de banco.

O modelo de domínio deve representar:

- identidade;
- invariantes;
- regras de negócio;
- estados;
- transições;
- relacionamentos relevantes;
- comportamentos.

Evitar criar entidades anêmicas contendo somente propriedades públicas.

---

# 7. Bounded Contexts

O sistema deve ser preparado para separar responsabilidades por contexto.

Possíveis Bounded Contexts:

```text
Identity
    └── Applications
    └── ApiKeys
    └── Tenants

WhatsApp
    └── WhatsAppAccounts
    └── PhoneNumbers
    └── Templates

Messaging
    └── Messages
    └── MessageAttempts

Webhook
    └── WebhookEvents

Infrastructure
    └── Meta
    └── RabbitMQ
    └── Redis
```

Não criar abstrações compartilhadas entre contextos sem necessidade real.

---

# 8. SOLID

## Single Responsibility Principle

Cada classe deve possuir uma única responsabilidade.

Não criar:

```text
WhatsAppService
```

com:

- autenticação;
- persistência;
- envio;
- retry;
- webhook;
- templates;
- logging.

Preferir:

```text
SendMessageHandler
MessageRepository
MetaWhatsAppClient
MessageRetryService
TemplateService
WebhookProcessor
```

---

## Open/Closed Principle

O sistema deve permitir extensão sem alterar comportamentos existentes sempre que possível.

Exemplo:

```text
IMessageProvider
       │
       ├── MetaWhatsAppProvider
       ├── TwilioProvider
       └── FutureProvider
```

---

## Liskov Substitution Principle

Implementações de uma interface devem respeitar integralmente o contrato definido pela abstração.

---

## Interface Segregation Principle

Preferir interfaces pequenas e específicas.

Evitar:

```typescript
interface IWhatsAppService {
  sendMessage();
  sendImage();
  sendVideo();
  sendAudio();
  createTemplate();
  deleteTemplate();
  processWebhook();
  retryMessage();
}
```

Preferir:

```typescript
interface IMessageSender {}

interface ITemplateManager {}

interface IWebhookProcessor {}

interface IMessageRepository {}
```

---

## Dependency Inversion Principle

O domínio e a aplicação dependem de abstrações.

```text
Application
     │
     ▼
IMessageRepository
     ▲
     │
PostgresMessageRepository
```

Nunca:

```text
Application
     │
     ▼
PostgresMessageRepository
```

---

# 9. Interfaces

Interfaces devem ser utilizadas para representar contratos entre camadas.

Exemplo:

```typescript
export interface IMessageRepository {
  save(message: Message): Promise<Result<void>>;
  findById(id: MessageId): Promise<Result<Message>>;
}
```

A implementação fica na infraestrutura:

```typescript
export class PostgresMessageRepository
  implements IMessageRepository {
}
```

A aplicação nunca deve conhecer `PostgresMessageRepository`.

---

# 10. Result Pattern

Operações de negócio não devem depender de exceções para representar falhas esperadas.

Utilizar `Result<T>`.

Exemplo conceitual:

```typescript
Result<T>
├── Success<T>
└── Failure
```

Exemplo:

```typescript
const result = await handler.execute(command);

if (result.isFailure) {
  return result;
}

return result;
```

Erros esperados devem ser representados pelo Result Pattern.

Exemplos:

```text
TenantNotFound
ApplicationNotFound
InvalidApiKey
WhatsAppAccountNotFound
PhoneNumberNotFound
TemplateNotFound
InvalidMessage
MessageAlreadyProcessed
ProviderUnavailable
RateLimitExceeded
```

Exceções devem ficar reservadas para situações realmente excepcionais ou falhas de infraestrutura que não façam parte do fluxo normal de negócio.

---

# 11. CQRS

Utilizar CQRS para separar operações de leitura e escrita.

## Commands

Commands alteram estado.

Exemplos:

```text
SendMessageCommand
SendTemplateMessageCommand
CreateApplicationCommand
CreateApiKeyCommand
RegisterWhatsAppAccountCommand
ProcessWebhookCommand
RetryMessageCommand
```

## Queries

Queries não alteram estado.

Exemplos:

```text
GetMessageQuery
GetMessageStatusQuery
ListMessagesQuery
GetTemplateQuery
ListTemplatesQuery
GetWhatsAppAccountQuery
```

Commands e Queries devem possuir handlers próprios.

```text
commands/
├── send-message.command.ts
├── send-template-message.command.ts
└── create-application.command.ts

queries/
├── get-message.query.ts
├── list-messages.query.ts
└── get-template.query.ts

handlers/
├── send-message.handler.ts
├── send-template-message.handler.ts
├── create-application.handler.ts
├── get-message.handler.ts
└── list-messages.handler.ts
```

---

# 12. Mediator Pattern

Utilizar Mediator para desacoplar Controllers e Consumers dos handlers.

Fluxo:

```text
HTTP Controller
      │
      ▼
Mediator
      │
      ▼
Command / Query
      │
      ▼
Handler
      │
      ▼
Application / Domain
```

O Controller não deve instanciar diretamente UseCases ou Services.

Evitar:

```typescript
const service = new MessageService(...);
```

Preferir:

```typescript
return this.mediator.send(command);
```

O mesmo princípio deve ser aplicado aos consumers do RabbitMQ.

---

# 13. DTOs

DTOs devem ser utilizados nas fronteiras da aplicação.

Exemplos:

```text
presentation/http/dto/
    SendMessageRequest.dto.ts
    SendTemplateMessageRequest.dto.ts

application/dto/
    SendMessageDto.ts
    MessageResponseDto.ts
```

DTO não é entidade de domínio.

Não utilizar DTO diretamente como entidade.

Não expor entidades de domínio diretamente pela API.

Fluxo:

```text
HTTP Request
     ↓
Request DTO
     ↓
Command
     ↓
Handler
     ↓
Domain
     ↓
Response DTO
     ↓
HTTP Response
```

Validação de entrada deve acontecer na fronteira da aplicação.

---

# 14. Regra de responsabilidade por arquivo

Cada arquivo deve possuir uma responsabilidade clara.

Evitar arquivos como:

```text
utils.ts
helpers.ts
common.ts
services.ts
```

quando utilizados como depósitos genéricos de código.

Preferir:

```text
phone-number.validator.ts
message-status.mapper.ts
api-key.generator.ts
meta-error.mapper.ts
message-retry-policy.ts
```

Uma classe principal por arquivo.

O nome do arquivo deve representar claramente sua responsabilidade.

---

# 15. Meta API

A integração com a Meta deve ficar exclusivamente na Infrastructure.

Exemplo:

```text
infrastructure/meta/
├── clients/
│   └── meta-whatsapp.client.ts
├── dto/
│   ├── meta-send-message.dto.ts
│   └── meta-template-message.dto.ts
├── mappers/
│   └── meta-message.mapper.ts
└── errors/
    └── meta-error.mapper.ts
```

O domínio nunca deve conhecer:

```text
Graph API
phone_number_id
access_token
WABA
Meta DTO
Meta response
Meta error code
```

Esses detalhes pertencem à infraestrutura.

---

# 16. Abstração do Provider

Criar uma abstração para o provedor de mensagens.

Exemplo:

```typescript
export interface IMessageProvider {
  send(message: OutgoingMessage): Promise<Result<ProviderMessageResult>>;
}
```

Implementação:

```typescript
export class MetaWhatsAppProvider
  implements IMessageProvider {
}
```

Isso permite futuramente suportar outros canais/provedores sem alterar o domínio.

Exemplo futuro:

```text
IMessageProvider
├── MetaWhatsAppProvider
├── TwilioWhatsAppProvider
├── EmailProvider
└── SmsProvider
```

Não implementar providers que não sejam necessários atualmente apenas por antecipação arquitetural.

---

# 17. Multi-Tenant

O Hub deve ser preparado para multi-tenancy.

Hierarquia:

```text
Tenant
   │
   ├── Applications
   │       │
   │       └── API Keys
   │
   └── WhatsApp Accounts
           │
           └── Phone Numbers
```

Uma requisição deve conseguir determinar:

```text
API Key
   ↓
Application
   ↓
Tenant
   ↓
WhatsApp Account
   ↓
Phone Number
```

Todas as operações devem validar o escopo do Tenant.

Nunca permitir acesso cruzado entre tenants.

---

# 18. API Keys

Os projetos consumidores devem autenticar no Hub através de credenciais próprias.

Exemplo:

```http
Authorization: Bearer wh_live_xxxxxxxxx
```

As credenciais da Meta não devem ser disponibilizadas aos projetos consumidores.

Fluxo:

```text
Projeto
   │
   │ API Key do Hub
   ▼
Message Hub
   │
   │ Meta Access Token
   ▼
Meta
```

API Keys devem:

- possuir identificação;
- possuir hash seguro;
- possuir status;
- possuir data de criação;
- permitir revogação;
- permitir expiração quando necessário;
- possuir escopos/permissões quando necessário.

Nunca armazenar API Keys em texto puro quando não for necessário.

---

# 19. Mensagens

O conceito de Message deve possuir ciclo de vida explícito.

Exemplo:

```text
PENDING
   ↓
PROCESSING
   ↓
SENT
   ↓
DELIVERED
   ↓
READ
```

Com estados de falha:

```text
PENDING
   ↓
PROCESSING
   ↓
FAILED
   ↓
RETRY
   ↓
PROCESSING
```

Os estados devem ser controlados pelo domínio.

Não espalhar regras de transição em Controllers, Repositories ou Workers.

---

# 20. Idempotência

O envio de mensagens deve ser idempotente sempre que possível.

Uma requisição deve poder possuir:

```http
Idempotency-Key: abc-123
```

O Hub deve impedir duplicidade causada por:

- retry do cliente;
- timeout;
- retry do worker;
- reprocessamento de fila;
- indisponibilidade temporária.

O comportamento de idempotência deve ser definido explicitamente no domínio/aplicação.

---

# 21. RabbitMQ

RabbitMQ deve ser utilizado para processamento assíncrono quando apropriado.

Exemplo:

```text
POST /messages
      ↓
Create Message
      ↓
Publish MessageRequested
      ↓
RabbitMQ
      ↓
Message Worker
      ↓
Meta
```

O worker deve:

- consumir mensagens;
- executar envio;
- registrar tentativa;
- atualizar status;
- tratar falhas;
- aplicar retry;
- evitar duplicidade.

Nunca assumir que uma mensagem será processada exatamente uma vez.

Projetar considerando **at-least-once delivery**.

---

# 22. Retry

Retries devem possuir política explícita.

Preferir:

```text
Exponential Backoff
+
Maximum Attempts
+
Dead Letter Queue
```

Exemplo:

```text
Attempt 1
   ↓
1s

Attempt 2
   ↓
5s

Attempt 3
   ↓
30s

Attempt 4
   ↓
DLQ
```

Não implementar retry infinito.

Erros permanentes não devem ser repetidos indefinidamente.

---

# 23. Webhooks

A Meta deve possuir um único endpoint de webhook no Hub.

```text
Meta
  │
  ▼
POST /webhooks/meta
  │
  ▼
Webhook Processor
  │
  ├── Message Received
  ├── Message Delivered
  ├── Message Read
  └── Message Failed
```

O webhook deve ser:

- validado;
- registrado;
- processado;
- idempotente;
- rastreável.

O processamento pesado não deve ocorrer diretamente no request HTTP do webhook.

Preferir:

```text
Webhook
   ↓
Validate
   ↓
Persist Event
   ↓
Queue
   ↓
Worker
```

---

# 24. Persistência

Repositories devem abstrair o acesso aos dados.

Domínio:

```typescript
interface IMessageRepository {
  save(message: Message): Promise<Result<void>>;
}
```

Infraestrutura:

```typescript
class PostgresMessageRepository
  implements IMessageRepository {
}
```

O domínio não deve conhecer ORM.

Evitar colocar regras de negócio em:

- entities do ORM;
- migrations;
- repositories;
- controllers.

---

# 25. Migrations

Toda alteração estrutural no banco deve ser realizada através de migrations versionadas.

Nunca depender de alteração manual do banco em ambientes controlados.

Migrations devem ser:

- determinísticas;
- versionadas;
- reversíveis quando possível;
- testadas antes de produção.

---

# 26. Observabilidade

O Hub deve possuir:

- logs estruturados;
- correlation ID;
- request ID;
- message ID;
- tenant ID;
- application ID;
- provider message ID;
- métricas;
- health checks.

Um envio deve ser rastreável:

```text
Request ID
    ↓
Message ID
    ↓
Attempt ID
    ↓
RabbitMQ Message ID
    ↓
Meta Message ID
```

Nunca registrar secrets ou tokens nos logs.

---

# 27. Segurança

Nunca armazenar ou registrar:

- Meta Access Tokens em logs;
- API Keys em logs;
- senhas;
- secrets;
- tokens completos.

Secrets devem vir de:

- environment variables;
- secret manager;
- mecanismo seguro de configuração.

Credenciais armazenadas em banco devem possuir proteção adequada.

---

# 28. Controllers

Controllers devem ser finos.

Responsabilidades:

- receber request;
- validar DTO;
- construir Command/Query;
- enviar através do Mediator;
- transformar resultado em resposta HTTP.

Não colocar regra de negócio em Controller.

Evitar:

```typescript
@Post()
async send() {
  // validações complexas
  // acesso ao banco
  // chamada Meta
  // retry
  // regras de negócio
}
```

Preferir:

```typescript
@Post()
async send(@Body() dto: SendMessageRequestDto) {
  return this.mediator.send(
    new SendMessageCommand(dto)
  );
}
```

---

# 29. Services

Services não devem ser utilizados como depósito genérico de regras.

Um Service deve representar uma responsabilidade específica.

Exemplos válidos:

```text
MessageRetryPolicy
TemplateRenderer
ApiKeyGenerator
WebhookSignatureValidator
MetaErrorMapper
```

Evitar:

```text
WhatsAppService
CommonService
UtilityService
GeneralService
```

quando essas classes acumularem responsabilidades distintas.

---

# 30. Use Cases / Handlers

Cada operação da aplicação deve possuir seu próprio Command/Query e Handler.

Exemplo:

```text
send-message/
├── send-message.command.ts
├── send-message.handler.ts
└── send-message.result.ts
```

O Handler deve coordenar a operação.

Não deve conter detalhes específicos da infraestrutura.

---

# 31. Mappers

Mapeamentos entre camadas devem ser explícitos.

Exemplo:

```text
HTTP DTO
   ↓
Command
   ↓
Domain
   ↓
Provider DTO
   ↓
Meta API
```

Não utilizar `Object.assign()` ou mapeamento implícito indiscriminadamente para atravessar fronteiras arquiteturais.

---

# 32. Testes

Testes devem acompanhar a arquitetura.

```text
tests/
├── unit/
│   ├── domain/
│   └── application/
│
├── integration/
│   ├── database/
│   └── rabbitmq/
│
└── e2e/
    └── api/
```

Prioridade:

1. Domain;
2. Application;
3. integração;
4. E2E.

Regras de negócio devem possuir testes unitários independentes de banco ou infraestrutura.

---

# 33. Testabilidade

Código de domínio deve poder ser testado sem:

- NestJS;
- PostgreSQL;
- RabbitMQ;
- Redis;
- HTTP;
- Meta API.

Exemplo:

```text
Domain Test
     │
     ├── sem banco
     ├── sem RabbitMQ
     ├── sem NestJS
     └── sem Meta
```

---

# 34. NestJS

NestJS deve ser utilizado principalmente como framework de composição e infraestrutura da aplicação.

Não deixar que decorators do NestJS contaminem o Domain quando não forem necessários.

Evitar acoplamento excessivo do domínio a:

```typescript
@Injectable()
@Controller()
@Module()
```

O domínio deve permanecer independente do framework sempre que possível.

---

# 35. Dependency Injection

Dependências devem ser injetadas.

Evitar instanciação manual de dependências dentro das classes.

Evitar:

```typescript
const repository = new PostgresMessageRepository();
```

Preferir:

```typescript
constructor(
  private readonly repository: IMessageRepository
) {}
```

A composição deve ocorrer na infraestrutura/NestJS.

---

# 36. Erros

Erros devem possuir classificação clara.

Exemplo:

```text
Domain Error
Application Error
Infrastructure Error
Provider Error
Validation Error
Authentication Error
Authorization Error
```

Erros da Meta devem ser convertidos para erros internos apropriados.

Não expor diretamente o payload bruto da Meta ao cliente.

---

# 37. API Contract

A API pública do Hub deve ser independente da API da Meta.

Exemplo:

```http
POST /v1/messages
```

O contrato deve ser estável mesmo quando a Meta alterar:

```text
Graph API version
payload
error format
authentication
endpoint
```

Mudanças internas na Meta não devem quebrar os consumidores do Hub sem necessidade.

---

# 38. Versionamento da API

A API deve possuir versionamento.

Exemplo:

```text
/v1/messages
/v1/templates
/v1/webhooks/meta
```

Mudanças incompatíveis devem criar nova versão.

Evitar breaking changes silenciosas.

---

# 39. Idempotência de Webhooks

Eventos recebidos da Meta podem ser duplicados.

Todo webhook deve possuir mecanismo para evitar processamento duplicado.

Persistir um identificador único do evento sempre que disponível.

Fluxo:

```text
Webhook
   ↓
Event ID
   ↓
Already processed?
   ├── YES → Ignore
   └── NO  → Persist + Process
```

---

# 40. Rate Limiting

O Hub deve possuir proteção contra abuso dos consumidores.

Considerar:

- Tenant;
- Application;
- API Key;
- endpoint;
- provider.

O rate limit interno deve ser separado dos limites impostos pela Meta.

---

# 41. Configuração

Configurações devem ser centralizadas.

Exemplo:

```text
META_API_VERSION
META_BASE_URL
RABBITMQ_URL
DATABASE_URL
REDIS_URL
LOG_LEVEL
```

Não acessar `process.env` diretamente em qualquer classe.

Criar uma camada de configuração.

---

# 42. Variáveis de Ambiente

Nunca versionar:

```text
.env
.env.production
.env.local
```

Versionar apenas:

```text
.env.example
```

com valores fictícios.

---

# 43. Serviços externos

Durante o desenvolvimento, PostgreSQL, RabbitMQ e Redis quando necessário são configurados por
variáveis de ambiente e podem ser executados pela infraestrutura que o time definir. Artefatos de
containerização e implantação serão introduzidos somente quando essa etapa for iniciada.

---

# 44. Documentação

A API deve possuir documentação OpenAPI/Swagger.

Todos os endpoints públicos devem documentar:

- request;
- response;
- autenticação;
- erros;
- códigos HTTP;
- exemplos.

---

# 45. Regras de nomenclatura

Utilizar nomes explícitos.

Preferir:

```text
SendTemplateMessageCommand
SendTemplateMessageHandler
MetaWhatsAppProvider
PostgresMessageRepository
WebhookSignatureValidator
```

Evitar:

```text
Handler
Service
Manager
Helper
Utils
Provider
Repository
```

sem contexto no nome.

---

# 46. Proibição de God Classes

Não criar classes gigantes.

Sinais de problema:

- centenas de linhas;
- muitas dependências;
- muitos métodos não relacionados;
- múltiplas responsabilidades;
- difícil testar isoladamente;
- necessidade de alterar a classe para funcionalidades não relacionadas.

Quando isso ocorrer, dividir por responsabilidade.

---

# 47. Proibição de God Modules

O mesmo princípio vale para módulos NestJS.

Evitar um único:

```text
WhatsAppModule
```

contendo todo o sistema.

Preferir módulos independentes:

```text
ApplicationsModule
TenantsModule
WhatsAppAccountsModule
PhoneNumbersModule
MessagesModule
TemplatesModule
WebhooksModule
```

---

# 48. Regra para novas funcionalidades

Antes de implementar uma funcionalidade:

1. identificar o Bounded Context;
2. identificar a regra de negócio;
3. definir entidade/value object quando necessário;
4. definir Command ou Query;
5. criar Handler;
6. definir interfaces necessárias;
7. implementar infraestrutura;
8. criar DTO;
9. criar Controller/Consumer;
10. adicionar testes;
11. atualizar documentação.

Não começar pela infraestrutura.

---

# 49. Regra de dependências

As dependências devem apontar para abstrações.

```text
Presentation
      ↓
Application
      ↓
Domain

Infrastructure
      ↓
Application / Domain
```

O Domain nunca deve depender de Infrastructure.

---

# 50. Regra principal

Ao implementar qualquer funcionalidade, sempre perguntar:

> "Essa responsabilidade pertence realmente a esta camada?"

Se a resposta for não, mover a responsabilidade para a camada correta.

O objetivo da arquitetura não é criar complexidade artificial, mas **manter o domínio independente, reduzir acoplamento e permitir evolução segura do sistema**.

---

# 51. Fluxo de envio de mensagem

Fluxo esperado:

```text
Client
  │
  ▼
POST /v1/messages
  │
  ▼
Request DTO
  │
  ▼
SendMessageCommand
  │
  ▼
Mediator
  │
  ▼
SendMessageHandler
  │
  ├── valida Tenant
  ├── valida Application
  ├── valida API Key
  ├── valida WhatsApp Account
  ├── valida Phone Number
  ├── cria Message
  ├── persiste Message
  └── publica MessageRequested
             │
             ▼
          RabbitMQ
             │
             ▼
      Message Worker
             │
             ▼
      IMessageProvider
             │
             ▼
    MetaWhatsAppProvider
             │
             ▼
         Meta API
             │
             ▼
      Provider Response
             │
             ▼
      Update Message
```

---

# 52. Regra de desacoplamento da Meta

Nenhum projeto consumidor deve precisar conhecer detalhes da Meta.

O consumidor deve trabalhar com:

```text
Message Hub Contract
```

e não:

```text
Meta Graph API Contract
```

Isso é uma das principais razões de existência deste projeto.

---

# 53. Resultado arquitetural esperado

O projeto deve permitir:

```text
                  Message Hub
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
      Projeto A    Projeto B    Projeto C
```

Enquanto internamente:

```text
Message Hub
│
├── Authentication
├── Multi-Tenancy
├── Applications
├── WhatsApp Accounts
├── Phone Numbers
├── Templates
├── Messages
├── Webhooks
├── RabbitMQ
├── Retry
├── Idempotency
├── Observability
└── Meta Provider
```

O Hub deve ser tratado como uma **plataforma de mensageria interna**, e não como um simples wrapper HTTP da API da Meta.

# Frontend

O frontend fica em `frontend/` e é um console operacional para a API do Message Hub.

## Organização

Organizar React por funcionalidade, e não por tipo técnico global. Cada módulo concentra suas páginas, componentes específicos, chamadas de API, hooks, esquemas e tipos.

Estrutura atual de `frontend/src/`:

```text
frontend/src/
├── app/                           # App.tsx (rotas/layout), ThemeModeProvider, theme.ts
├── assets/brand/                  # logos e marca
├── modules/
│   ├── api-docs/
│   ├── api-keys/
│   ├── applications/
│   ├── audit-logs/                # EventsTab + SystemLogsTab
│   ├── auth/
│   ├── dashboard/
│   ├── engineering-alerts/
│   ├── help/
│   ├── messages/
│   ├── monitoring/
│   ├── phone-numbers/
│   ├── sandbox/
│   ├── templates/
│   ├── tenants/
│   ├── users/
│   ├── webhooks/
│   └── whatsapp-accounts/
├── components/
│   ├── ui/                        # design system (ex.: PageHeader)
│   └── shared/                    # PaginatedTable, FormDialog, TableActionsMenu,
│                                   # AsyncState, EntityResult, CodeBlock e os
│                                   # *Autocomplete (Tenant/Application/PhoneNumber/
│                                   # PhoneNumberMulti/WhatsAppAccount/Message)
├── services/                      # http-client.ts, auth-storage.ts, pagination.ts
├── hooks/                         # usePagination.ts
├── lib/                           # presentation.ts (labels/formatação)
└── styles/
```

Cada módulo concentra `<Modulo>Page.tsx` + `<modulo>.api.ts` (e, quando necessário, diálogos/abas próprios, ex.: `TemplateFormDialog.tsx`, `MessageTimelineDialog.tsx`).

**Desvios conhecidos a corrigir:**
- Os `*Autocomplete` compartilhados (exceto `MessageAutocomplete`) buscam uma página fixa de 100 itens e filtram no cliente, em vez de repassar o termo digitado para o parâmetro `search` do backend — registros após o 100º ficam inacessíveis.
- `UsersPage` cai para exibir o UUID crú do tenant quando ele não está nessa lista de 100 (contraria a convenção de nunca expor IDs crus).
- `MonitoringPage` renderiza `PaginatedTable` com paginação decorativa (`page=1`, `pageSize=100`, `onPageChange`/`onPageSizeChange` vazios).

## Regras obrigatórias

- Usar MUI como biblioteca de componentes e manter o tema centralizado.
- Usar TanStack Query para dados remotos, cache, invalidação e estados de carregamento.
- Usar React Hook Form e Zod em formulários e validar novamente no backend.
- Não duplicar autorização no frontend como mecanismo de segurança. O frontend apenas controla a experiência; o backend é a fonte de verdade.
- Construir interfaces acessíveis, responsivas e com estados vazios, de carregamento e de erro.
- Criar um item de menu e uma tela próprios quando áreas exibirem dados, permissões ou ações diferentes. Não agrupar cadastros independentes em uma única tela apenas por pertencerem ao mesmo contexto administrativo.
- Tipar contratos HTTP explicitamente, observando a proibição global de `any`.
- Manter tokens somente no `sessionStorage`; nunca registrar, exibir novamente ou persistir API keys em texto puro.
- Para coleções administrativas, consumir os endpoints paginados do backend; não simular listagens no cliente.
