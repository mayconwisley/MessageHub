[← Voltar ao README](../README.md)

# Referência da API

Esta página cataloga todos os endpoints HTTP do Message Hub. Para o contrato executável — DTOs, validações e schemas de resposta — use o Swagger em `/docs` (desabilitado em produção por padrão) ou a tela "Documentação da API" do console.

- URL base local (Docker): `http://localhost:3000`
- URL base local (nativo): `http://localhost:3000` (backend) — ver [getting-started.md](./getting-started.md)
- Não há prefixo global de versão na raiz da aplicação: os recursos de negócio vivem sob `/v1/*`; saúde vive em `/health*`; o webhook da Meta vive em `/webhooks/meta` (sem `/v1`).

## Autenticação

| Mecanismo | Como enviar | Concede acesso a |
| --- | --- | --- |
| Sessão administrativa | `Authorization: Bearer mh_session_...`, obtida em `POST /v1/auth/sessions` | Console web e qualquer endpoint marcado "Sessão" abaixo. Expira em 12h. |
| API key de aplicação (`platform`) | `Authorization: Bearer wh_live_...` | Mensagens, e-mails e templates (`PlatformAdminOrApiKeyGuard`) — também aceita sessão `platform_admin`. |
| API key de aplicação (`tenant`) | `Authorization: Bearer wh_tenant_live_...` | Contas WhatsApp, números e SMTP do próprio tenant (`PlatformAdminOrTenantApiKeyGuard`) — também aceita sessão `platform_admin`/`tenant_admin`. |
| Público | — | Login, handshake e recebimento do webhook Meta, `/health*`. O webhook exige assinatura HMAC própria em vez de Bearer token. |

Endpoints marcados **"admin-only"** em algum parâmetro (ex.: `tenantId`, `applicationId`) só aceitam esse parâmetro quando a chamada usa sessão `platform_admin` — com API key, o escopo é resolvido automaticamente a partir da própria chave, e informar o parâmetro é ignorado ou rejeitado conforme o endpoint.

## Convenções

- **Paginação**: toda listagem aceita `page` (padrão `1`) e `pageSize` (padrão `20`, máximo `100`).
- **Ordenação**: listagens que suportam ordenação aceitam `sortBy` (um valor específico do recurso, ver tabelas abaixo) e `sortDirection` (`ASC` ou `DESC`).
- **Filtros de data**: quando presentes, `createdFrom`/`createdTo` (ou equivalentes) aceitam datas ISO 8601.
- **Idempotência**: `POST /v1/messages`, `POST /v1/messages/templates` e `POST /v1/emails` aceitam o header opcional `Idempotency-Key`. Reenviar a mesma chave retorna o recurso já criado com `HTTP 200` e o header `Idempotent-Replay: true`, em vez de duplicar o envio.
- **Erros**: falhas de domínio previstas (validação, conflito, não encontrado) retornam um corpo de erro padronizado com código HTTP apropriado; exceções não previstas retornam `500` e são registradas em `/v1/system-logs`.
- **Corpos rejeitados**: a API usa `ValidationPipe` global com whitelist — campos não declarados no DTO são rejeitados, não apenas ignorados.
- **CORS**: cabeçalhos liberados são `Authorization, Content-Type, Idempotency-Key, X-Request-Id`.

## Saúde

| Método | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| GET | `/health` | Pública | Checagem completa (Postgres + RabbitMQ via `@nestjs/terminus`). |
| GET | `/health/live` | Pública | Liveness simples, sem checar dependências. |
| GET | `/health/ready` | Pública | Readiness — mesma checagem de `/health`. |

## Autenticação e sessão

| Método | Rota | Auth | Corpo / parâmetros |
| --- | --- | --- | --- |
| POST | `/v1/auth/sessions` | Pública (5 req/min) | Body: `email`, `password`. |
| DELETE | `/v1/auth/sessions` | Sessão | Revoga a sessão do header `Authorization`. |

## Tenants — Sessão `platform_admin`

| Método | Rota | Parâmetros |
| --- | --- | --- |
| POST | `/v1/tenants` | Body: `name` (≤255). |
| GET | `/v1/tenants` | Query: `status`, `search` (≤255), `createdFrom`/`createdTo`, `sortBy` (`name`\|`status`\|`createdAt`), `sortDirection`, + paginação. |
| GET | `/v1/tenants/:id` | Path: `id`. |
| PATCH | `/v1/tenants/:id/status` | Path: `id`. Body: `status`. Bloqueado para o tenant do canal padrão gerenciado por ambiente. |

## Usuários — Sessão `platform_admin`

| Método | Rota | Parâmetros |
| --- | --- | --- |
| POST | `/v1/users` | Body: `name`, `email`, `password` (12–72 bytes), `role`, `tenantId?`. |
| GET | `/v1/users` | Query: `tenantId`, `role`, `status`, `search`, `createdFrom`/`createdTo`, `sortBy` (`name`\|`email`\|`role`\|`status`\|`createdAt`), `sortDirection`, + paginação. |
| GET | `/v1/users/:id` | Path: `id`. |
| PATCH | `/v1/users/:id` | Path: `id`. Body: `name?`, `email?`, `role?`, `tenantId?`. |
| PATCH | `/v1/users/:id/status` | Path: `id`. Body: `status`. Um usuário não pode suspender a própria conta. |

## Aplicações — Sessão `platform_admin`

| Método | Rota | Parâmetros |
| --- | --- | --- |
| POST | `/v1/applications` | Body: `tenantId`, `name` (≤255). |
| GET | `/v1/applications` | Query: `tenantId` (**obrigatório**), `search`, `createdFrom`/`createdTo`, `sortBy` (`name`\|`status`\|`createdAt`), `sortDirection`, + paginação. |
| GET | `/v1/applications/:applicationId` | Path: `applicationId`. |
| PUT | `/v1/applications/:applicationId/webhook` | Body: `webhookUrl` (HTTPS, validado contra SSRF; `null`/vazio remove). |
| PUT | `/v1/applications/:applicationId/quotas` | Body: `quotaPerMinute` (1–100000), `quotaPerDay` (1–100000000). No console: botão "Configurar quotas" na tela Aplicações. |
| GET | `/v1/applications/:applicationId/phone-numbers` | Números atualmente vinculados. |
| PUT | `/v1/applications/:applicationId/phone-numbers` | Body: `phoneNumberIds` (array de UUID) — substitui o vínculo. |

## Chaves de API — Sessão `platform_admin`

| Método | Rota | Parâmetros |
| --- | --- | --- |
| POST | `/v1/applications/:applicationId/api-keys` | Body: `type?` (`platform`\|`tenant`, padrão `platform`), `expiresAt?`, `scopes?` (≤20 itens). Resposta traz o valor completo da chave uma única vez. |
| GET | `/v1/applications/:applicationId/api-keys` | Query: `status`, `search`, `createdFrom`/`createdTo`, `sortBy` (`status`\|`createdAt`\|`expiresAt`\|`lastUsedAt`), `sortDirection`, + paginação. |
| DELETE | `/v1/applications/:applicationId/api-keys/:apiKeyId` | Revoga a chave. |

## Contas WhatsApp — Sessão admin ou API key `tenant`

| Método | Rota | Parâmetros |
| --- | --- | --- |
| GET | `/v1/whatsapp-accounts/default-channel` | Retorna `{ enabled, wabaId }` do canal padrão do ambiente. |
| POST | `/v1/whatsapp-accounts/default-channel/ensure` | Body: `tenantId?` (obrigatório com sessão admin). Rejeita se o tenant resolvido não for o dono do canal padrão. |
| POST | `/v1/whatsapp-accounts` | Body: `tenantId?` (admin-only), `wabaId`, `credentialSource` (`DEFAULT` rejeitado neste endpoint), `accessToken?`, `appSecret?`, `credentialExpiresAt?`. |
| GET | `/v1/whatsapp-accounts` | Query: `tenantId` (admin-only), `status`, `search`, `createdFrom`/`createdTo`, `sortBy` (`wabaId`\|`status`\|`createdAt`), `sortDirection`, + paginação. |
| GET | `/v1/whatsapp-accounts/:id` | Path: `id`. |

## Números — Sessão admin ou API key `tenant`

| Método | Rota | Parâmetros |
| --- | --- | --- |
| POST | `/v1/phone-numbers` | Body: `whatsAppAccountId`, `phoneNumberId` (ID Meta), `displayNumber` (ex.: `+5511999999999`). |
| GET | `/v1/phone-numbers` | Query: `tenantId` (admin-only), `status`, `search`, `createdFrom`/`createdTo`, `sortBy` (`displayNumber`\|`status`\|`createdAt`), `sortDirection`, + paginação. |
| GET | `/v1/phone-numbers/:id` | Path: `id`. |

## Mensagens — Sessão `platform_admin` ou API key de aplicação

| Método | Rota | Parâmetros |
| --- | --- | --- |
| POST | `/v1/messages` | Header: `Idempotency-Key?`. Body: `applicationId?` (admin-only), `phoneNumberId?` (opcional se a aplicação tiver exatamente 1 número vinculado), `to` (E.164 ou BSUID, ≤256), `content` (≤4096). |
| POST | `/v1/messages/templates` | Header: `Idempotency-Key?`. Body: `applicationId?`, `phoneNumberId?`, `to`, `templateId?` ou `templateName?`, `parameters?` (≤100 itens, cada ≤4096, preenchem `{{1}}`, `{{2}}`...). |
| GET | `/v1/messages` | Query: `status`, `search` (messageId, providerMessageId, requestId, Idempotency-Key ou destinatário), `applicationId` (admin-only), `createdFrom`/`createdTo`, `sortBy` (`status`\|`createdAt`), `sortDirection`, + paginação. |
| GET | `/v1/messages/:id` | Query: `applicationId?` (admin-only). |
| GET | `/v1/messages/:id/attempts` | Histórico de tentativas de envio. |
| GET | `/v1/messages/:id/timeline` | Linha do tempo completa (criação, tentativas, status recebidos por webhook, erros). |

## Modelos de mensagem (templates) — Sessão `platform_admin` ou API key de aplicação

| Método | Rota | Parâmetros |
| --- | --- | --- |
| POST | `/v1/templates` | Body: `tenantId?` (admin-only), `whatsAppAccountId`, `name` (≤512), `language`, `category` (`UTILITY`\|`MARKETING`\|`AUTHENTICATION`), `components[]` (`HEADER`/`BODY`/`FOOTER`/`BUTTONS`, com `example` e botão de URL), `parameterFormat?`. |
| GET | `/v1/templates` | Query: `whatsAppAccountId` (**obrigatório**), `sync?` (força sincronização com a Meta antes de listar), `status` (`DRAFT`\|`PENDING`\|`APPROVED`\|`REJECTED`\|`PAUSED`\|`DISABLED`), `category`, `search`, `createdFrom`/`createdTo`, `sortBy` (`name`\|`status`\|`category`\|`createdAt`), `sortDirection`, `tenantId` (admin-only), + paginação. |
| GET | `/v1/templates/:id` | Query: `tenantId?` (admin-only). |
| PUT | `/v1/templates/:id` | Body: `tenantId?`, `category`, `components[]`, `parameterFormat?` (≤30). Nome e idioma são imutáveis; alterar um template publicado o reenvia para análise da Meta. |
| DELETE | `/v1/templates/:id` | Remove localmente e solicita remoção na Meta. |
| POST | `/v1/templates/sync` | Body: `tenantId?`, `whatsAppAccountId`. Busca status atual na Meta. |
| POST | `/v1/templates/publish-pending` | Body: `tenantId?`, `whatsAppAccountId`. Reenvia rascunhos pendentes para aprovação. |

## E-mails — Sessão `platform_admin` ou API key de aplicação

| Método | Rota | Parâmetros |
| --- | --- | --- |
| POST | `/v1/emails` | Header: `Idempotency-Key?`. Body: `applicationId?` (admin-only), `to` (e-mail, ≤320), `subject` (≤255), `textBody?`/`htmlBody?` (≤100000 cada; ao menos um é obrigatório). |
| GET | `/v1/emails` | Query: `status`, `search`, `applicationId` (admin-only), `createdFrom`/`createdTo`, `sortBy` (`status`\|`createdAt`), `sortDirection`, + paginação. |
| GET | `/v1/emails/:id/timeline` | Query: `applicationId?` (admin-only). Linha do tempo de tentativas, aceite pelo provedor, falhas e reenvios. |

## Configuração de SMTP por tenant — Sessão admin ou API key `tenant`

Base: `/v1/email-configurations/smtp`.

| Método | Rota | Parâmetros |
| --- | --- | --- |
| GET | `/v1/email-configurations/smtp` | Query: `tenantId?` (admin-only). |
| PUT | `/v1/email-configurations/smtp` | Body: `tenantId?`, `host` (≤255), `port` (1–65535), `secure`, `username` (≤320), `password`, `fromEmail` (≤320), `fromName` (≤255). A senha é cifrada e nunca retornada. |
| DELETE | `/v1/email-configurations/smtp` | Query: `tenantId?`. Remove o override; o tenant volta a usar o SMTP padrão global, se habilitado. |

## Dashboard — Sessão de usuário

Base: `/v1/dashboard`. O escopo de tenant é resolvido automaticamente pela sessão (`platform_admin` vê todos; demais papéis precisam ter `tenantId` no próprio usuário).

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/v1/dashboard/resource-summary` | Quantidades de tenants, aplicações, contas WhatsApp e números. |
| GET | `/v1/dashboard/message-volume` | Volume de envios nos últimos 14 dias. |
| GET | `/v1/dashboard/delivery-status` | Distribuição de status das mensagens nos últimos 30 dias. |
| GET | `/v1/dashboard/operational-health` | Taxa de sucesso, fila, falhas nas últimas 24h e números ativos. |
| GET | `/v1/dashboard/recent-messages` | Últimos envios registrados. |

## Webhooks — recepção Meta e gestão de eventos

| Método | Rota | Auth | Parâmetros |
| --- | --- | --- | --- |
| GET | `/webhooks/meta` | Verify-token (comparação em tempo constante) | Query: `hub.mode`, `hub.verify_token`, `hub.challenge` — handshake de verificação da Meta. |
| POST | `/webhooks/meta` | Assinatura `X-Hub-Signature-256` (HMAC sobre o corpo bruto) | Body: payload bruto da Meta. Deduplicado por SHA-256, persistido e processado de forma assíncrona. |
| GET | `/v1/webhook-events` | Sessão `platform_admin` | Query: `status`, `createdFrom`/`createdTo`, `sortBy` (`status`\|`receivedAt`), `sortDirection`, + paginação. |
| POST | `/v1/webhook-events/:id/reprocess` | Sessão `platform_admin` | Reenfileira um evento que esgotou as tentativas automáticas. Retorna `202`. |

## Monitoramento e operação — Sessão `platform_admin`

| Método | Rota | Descrição |
| --- | --- | --- |
| GET | `/v1/monitoring/applications/:applicationId` | Quotas, taxa de entrega (24h), saúde das chaves de API e dos números/credenciais Meta vinculados à aplicação. |
| GET | `/v1/engineering-alerts` | Query: `severity` (`WARNING`\|`CRITICAL`), `createdFrom`/`createdTo`, `sortBy` (`severity`\|`occurredAt`), `sortDirection`, + paginação. |
| GET | `/v1/system-logs` | Query: `level` (`trace`..`fatal`), `search`, `createdFrom`/`createdTo`, `sortBy` (`level`\|`occurredAt`), `sortDirection`, + paginação. |
| GET | `/v1/audit-logs` | Query: `resourceType`, `httpMethod`, `createdFrom`/`createdTo`, `sortBy` (`occurredAt`\|`resourceType`\|`httpStatus`), `sortDirection`, + paginação. |

## Sandbox — Sessão `platform_admin`, requer `SANDBOX_ENABLED=true`

Base: `/v1/sandbox/messages`.

| Método | Rota | Parâmetros |
| --- | --- | --- |
| GET | `/v1/sandbox/messages/configuration` | Retorna `{ enabled, activeProvider }`. |
| POST | `/v1/sandbox/messages/:id/status` | Body: `status` (`DELIVERED`\|`READ`\|`FAILED`). Simula o callback de status de uma mensagem já enviada. Retorna `202`. |

---

Para exemplos de requisição prontos para copiar (curl, Node.js, C#), use a tela "Documentação da API" do console (`/api-docs`) ou baixe a [coleção Postman](../frontend/public/message-hub.postman_collection.json) por lá.
