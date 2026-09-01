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

## Documentação

Este README cobre o essencial para rodar e entender o projeto rapidamente. A documentação detalhada vive em [`docs/`](./docs) e é mantida separada por assunto para não ficar gigante:

| Documento | Conteúdo |
| --- | --- |
| [docs/getting-started.md](./docs/getting-started.md) | Pré-requisitos, Docker, desenvolvimento nativo e primeiro fluxo ponta a ponta (enviar texto, template e e-mail). |
| [docs/architecture.md](./docs/architecture.md) | Camadas, módulos de negócio, modelo de componentes, outbox transacional, filas/DLQ e webhook da Meta. |
| [docs/api-reference.md](./docs/api-reference.md) | Todos os endpoints HTTP, autenticação, parâmetros de query/body, paginação, ordenação e idempotência. |
| [docs/configuration.md](./docs/configuration.md) | Referência completa de variáveis de ambiente, por arquivo `.env.example`, incluindo validações exigidas em produção. |
| [docs/console.md](./docs/console.md) | Guia de cada tela do console web e a ordem recomendada de configuração. |
| [docs/operations.md](./docs/operations.md) | Deploy em produção, backup/restore, controles de segurança, CI/CD e processo de release. |
| [AGENTS.md](./AGENTS.md) | Regras arquiteturais, convenções de código e restrições obrigatórias do projeto. |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Como contribuir: branches, commits, revisão. |
| [SECURITY.md](./SECURITY.md) | Como reportar vulnerabilidades de forma privada. |

O console web também traz o mesmo guia operacional embutido em português, tela a tela, na rota `/help` ("Manual do usuário"), e uma referência de endpoints com exemplos prontos para copiar em `/api-docs` ("Documentação da API").

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

## Arquitetura em um relance

O backend é um monólito modular em NestJS, com dependências sempre apontando para dentro (`presentation → application → domain`, alimentado por `infrastructure`):

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

Detalhes de cada módulo, do outbox transacional e das filas/DLQ estão em [docs/architecture.md](./docs/architecture.md).

## Início rápido

### Pré-requisitos

- Node.js **24** e npm **10+** para execução nativa;
- Docker Engine + Docker Compose v2 para o ambiente completo conteinerizado.

Os projetos são independentes: `backend/` e `frontend/` têm seus próprios `package.json`, lockfile e variáveis de ambiente. Não há `package.json` na raiz.

### Ambiente completo com Docker

```powershell
Copy-Item .env.example .env
docker compose up --build
```

| Serviço | Endereço padrão |
| --- | --- |
| Console web | `http://localhost:8080` |
| API | `http://localhost:3000` |
| Swagger | `http://localhost:3000/docs` |
| Health | `http://localhost:3000/health` |
| RabbitMQ Management | `http://localhost:15672` |

O provider padrão é `sandbox`, então não são necessárias credenciais da Meta para explorar o Hub. As credenciais `admin@example.com` / `ChangeMe123!Hub` servem só para demonstração local.

Passo a passo completo (desenvolvimento nativo, primeiro tenant, primeiro envio) em [docs/getting-started.md](./docs/getting-started.md).

## Autenticação, em resumo

| Mecanismo | Uso |
| --- | --- |
| Sessão administrativa (`POST /v1/auth/sessions`) | Console web e endpoints de administração global. Expira em 12h. |
| API key `platform` (`wh_live_...`) | Integrações externas: mensagens, e-mails e templates. |
| API key `tenant` (`wh_tenant_live_...`) | Operações administrativas restritas a um tenant: contas WhatsApp, números e SMTP. |

Detalhes de papéis, matriz completa de acesso por recurso e todos os endpoints estão em [docs/api-reference.md](./docs/api-reference.md).

## Qualidade e CI/CD, em resumo

```bash
# Backend
npm run validate --prefix backend

# Frontend
npm run validate --prefix frontend
```

CI no GitHub Actions valida, testa e builda backend/frontend a cada push/PR; tags `vX.Y.Z` disparam release com imagens multi-arquitetura no GHCR. Processo completo, deploy de produção, backup/restore e controles de segurança em [docs/operations.md](./docs/operations.md).

## Licença

Distribuído sob a [MIT License](./LICENSE).
