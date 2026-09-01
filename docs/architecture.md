[← Voltar ao README](../README.md)

# Arquitetura

Para as regras arquiteturais obrigatórias, convenções de código e decisões detalhadas de design, [AGENTS.md](../AGENTS.md) é a fonte de verdade — este documento é um mapa de leitura, não uma duplicata.

## Camadas

O backend é um monólito modular em NestJS. Cada módulo de negócio segue Clean Architecture / DDD com as dependências sempre apontando para dentro:

```text
presentation  →  application  →  domain
                     ↑
               infrastructure
```

| Camada | Conteúdo | Depende de |
| --- | --- | --- |
| `domain` | Entidades, value objects, regras de negócio, estados e contratos de repositório (interfaces). | Nada externo — sem NestJS, TypeORM, HTTP ou providers. |
| `application` | Commands, queries, handlers CQRS, portas (interfaces de infraestrutura) e mappers de caso de uso. | Somente `domain`. |
| `infrastructure` | Implementações concretas: Postgres/TypeORM, RabbitMQ, cliente Meta, SMTP, cifragem, outbox. | `domain` e `application` (implementa as portas). |
| `presentation` | Controllers, DTOs, guards, filtros e adaptadores HTTP. | `application`, via Mediator. |

Controllers e workers nunca chamam serviços de aplicação diretamente — eles despacham Commands/Queries ao Mediator, que roteia para o handler correspondente. Falhas de negócio previstas (validação, conflito, não encontrado) usam o `Result` pattern e são convertidas em respostas HTTP pelo filtro de exceção global; uma exceção lançada representa uma condição técnica não prevista.

## Módulos de negócio

| Módulo | Responsabilidade |
| --- | --- |
| `tenants` | Ciclo de vida e status dos tenants (organizações que usam o Hub). |
| `applications` | Aplicações consumidoras de um tenant, API keys, quotas, webhook de saída e vínculo de números. |
| `identity` | Usuários administrativos, login, sessão e papéis (`platform_admin`, `tenant_admin`, `operator`). |
| `whatsapp-accounts` | WhatsApp Business Accounts (WABA) e suas credenciais — próprias do tenant ou do canal padrão da plataforma. |
| `phone-numbers` | Números Meta e seu vínculo com uma conta WhatsApp. |
| `messages` | Envio, tentativas, timeline, resolução de provider (Meta/sandbox) e callbacks de status de mensagens WhatsApp. |
| `templates` | Modelo local de templates e sincronização/publicação com a Meta. |
| `webhooks` | Recepção do webhook único da Meta, deduplicação, reprocessamento manual e disparo do callback de mensagem recebida. |
| `emails` | Envio, tentativas, timeline e worker de e-mails via SMTP. |
| `email-configurations` | Override de SMTP cifrado por tenant, com fallback para o SMTP global. |
| `dashboard` | Consultas agregadas para a Visão geral do console. |
| `monitoring` | Saúde e quotas de integrações por aplicação. |
| `audit` | Trilha de auditoria de operações administrativas mutáveis. |
| `system-logs` | Logs técnicos persistidos para consulta operacional. |
| `notifications` | Alertas de engenharia e entrega a canais externos (Slack, Teams, e-mail). |

## Modelo de componentes

```text
Sistemas consumidores / Console React
                 │ HTTP + Bearer token
                 ▼
          API NestJS (v1)
                 │
        Commands / Queries / Mediator
                 │ transação
                 ├──────────────► PostgreSQL (schemas app, audit, events)
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

## Estados principais

```text
WhatsApp: PENDING → PROCESSING → SENT → DELIVERED → READ
                                  │
                                  └→ FAILED → RETRY → PROCESSING

E-mail:    PENDING → PROCESSING → SENT
                         │
                         └→ FAILED → RETRY → PROCESSING
```

`SENT` representa aceite pelo provider (Meta ou servidor SMTP), não confirmação de chegada ao destinatário. `DELIVERED` e `READ` para WhatsApp dependem exclusivamente do webhook posterior da Meta — nunca são inferidos pelo Hub.

## Outbox transacional e filas

Todo aceite de mensagem, e-mail ou webhook persiste o agregado de domínio e o evento de trabalho na **mesma transação PostgreSQL**. Um dispatcher consulta a tabela de outbox a cada segundo, bloqueia lotes com `FOR UPDATE SKIP LOCKED`, publica no RabbitMQ (mensagens persistentes) e só marca o evento como processado após confirmação da publicação. Se a publicação falhar, o evento permanece recuperável — retry com backoff exponencial (limite de 15 minutos), falha definitiva após 25 tentativas. Esse desenho evita a janela de perda entre o `commit` no banco e o `publish` na fila.

| Trabalho | Fila | DLQ |
| --- | --- | --- |
| Envio WhatsApp | `message.requested` | `message.requested.dlq` |
| Envio de e-mail | `email.requested` | `email.requested.dlq` |
| Webhook recebido da Meta | `meta.webhook.received` | `meta.webhook.received.dlq` |
| Callback de mensagem recebida | `inbound-message.webhook` | `inbound-message.webhook.dlq` |
| Callback de mudança de status | `message.status.webhook` | `message.status.webhook.dlq` |

Workers processam entrega *at-least-once*; as entidades de domínio controlam transições de estado, idempotência e registro de tentativas. Erros transitórios de mensagem, e-mail e callback usam, respectivamente, 1s, 5s e 30s de espera antes do encaminhamento à DLQ.

> **Limitação operacional atual**: o agendamento desse último retry ocorre por `setTimeout` em memória nos workers. A outbox é durável, mas um processo reiniciado durante o atraso não preserva esse timer. Para resiliência total em produção, substitua por filas RabbitMQ com TTL/DLQ, plugin de mensagens atrasadas ou um scheduler persistente.

## Webhook da Meta

O endpoint é único: `GET|POST /webhooks/meta` (sem prefixo `/v1`).

1. `GET` responde o handshake `hub.challenge` somente com `hub.verify_token` válido, comparado em tempo constante.
2. `POST` exige `X-Hub-Signature-256`, calculada sobre o corpo bruto com o `appSecret` aplicável (padrão da plataforma ou específico da conta WhatsApp).
3. O conteúdo é deduplicado por SHA-256, persistido como evento e publicado pela outbox — nenhum processamento pesado acontece no ciclo HTTP do webhook.
4. O worker correspondente atualiza mensagens (status ou conteúdo recebido) e gera callbacks assíncronos para a URL configurada na aplicação, quando cabível.

Detalhes de cada endpoint HTTP estão em [api-reference.md](./api-reference.md); a configuração de ambiente em [configuration.md](./configuration.md).
