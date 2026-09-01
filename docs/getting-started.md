[← Voltar ao README](../README.md)

# Início rápido

## Pré-requisitos

- Node.js **24** e npm **10+** para execução nativa;
- Docker Engine + Docker Compose v2 para o ambiente completo conteinerizado;
- PostgreSQL e RabbitMQ acessíveis quando executar o backend fora do Docker.

Os projetos são independentes: `backend/` e `frontend/` têm seus próprios `package.json`, lockfile e variáveis de ambiente. Não há `package.json` na raiz do repositório.

## Ambiente completo com Docker

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

O Compose inicia PostgreSQL e RabbitMQ, executa as migrations no serviço one-shot `migrate` e só então inicia backend e frontend. O provider padrão é `sandbox`, portanto não são necessárias credenciais reais da Meta para explorar o Hub. As credenciais `admin@example.com` / `ChangeMe123!Hub` servem apenas para demonstração local — nunca as reutilize fora desse propósito.

Para limpar inclusive os volumes locais de Postgres e RabbitMQ:

```bash
docker compose down -v
```

## Desenvolvimento nativo

1. Copie os exemplos de ambiente. Ajuste `DATABASE_URL` e `RABBITMQ_URL` no arquivo do backend para apontar a instâncias acessíveis (locais ou remotas).

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

Por padrão, a API escuta em `http://localhost:3000` e o Vite em `http://localhost:5173`. Ajuste `CORS_ORIGINS` no backend e `VITE_API_URL` no frontend se as portas ou hosts mudarem. Referência completa de variáveis em [configuration.md](./configuration.md).

## Primeiro fluxo de ponta a ponta

Depois de subir o ambiente (Docker ou nativo), entre no console com o administrador inicial e siga esta ordem — cada cadastro depende do anterior:

1. Crie um tenant: `POST /v1/tenants`.
2. Crie a aplicação consumidora: `POST /v1/applications`.
3. Gere uma API key da aplicação: `POST /v1/applications/:applicationId/api-keys`.
4. Registre a WABA do tenant: `POST /v1/whatsapp-accounts`.
5. Registre cada número Meta: `POST /v1/phone-numbers`.
6. Vincule os números liberados para a aplicação: `PUT /v1/applications/:applicationId/phone-numbers`.
7. Opcionalmente, configure o callback HTTPS de status: `PUT /v1/applications/:applicationId/webhook`.

Todos esses passos também podem ser feitos pelo console, na ordem descrita na tela "Manual do usuário" (`/help`). O `phoneNumberId` usado nos envios é o UUID interno retornado pelo Hub, não o `phone_number_id` da Meta; quando a aplicação tem exatamente um número vinculado, ele é resolvido automaticamente.

### Enviar uma mensagem de texto

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

O retorno `201` significa que a mensagem foi aceita e persistida, não que já foi entregue. Consulte `GET /v1/messages/:id`, `GET /v1/messages/:id/attempts` e `GET /v1/messages/:id/timeline` para acompanhar a execução (ver [api-reference.md](./api-reference.md)).

O campo `to` aceita um E.164 ou um BSUID (*Business-Scoped User ID*) recebido em um webhook da Meta. Não é possível enviar para `@username`; para responder a um usuário com telefone oculto, reutilize exatamente `sender.id` do webhook recebido.

### Enviar um template

```json
POST /v1/messages/templates

{
  "to": "+5511999999999",
  "templateName": "pedido_confirmado",
  "parameters": ["Maria", "PED-2026-001"]
}
```

Informe `templateId` ou `templateName`. Os itens de `parameters` preenchem `{{1}}`, `{{2}}` etc. na ordem em que aparecem no corpo do template.

### Enviar um e-mail

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

Ao menos um entre `textBody` e `htmlBody` é obrigatório. O SMTP específico do tenant, quando existente, prevalece sobre o SMTP padrão da plataforma. Acompanhe a entrega em `GET /v1/emails/:id/timeline`.

## Próximos passos

- [architecture.md](./architecture.md) — módulos, camadas e processamento assíncrono.
- [api-reference.md](./api-reference.md) — todos os endpoints, parâmetros e regras de autenticação.
- [console.md](./console.md) — guia de cada tela do console web.
- [configuration.md](./configuration.md) — referência completa de variáveis de ambiente.
- [operations.md](./operations.md) — deploy, backup/restore, segurança e CI/CD.
