# Guia de contribuição

Obrigado por contribuir com o Message Hub. O projeto centraliza integrações de mensageria e lida
com dados e credenciais sensíveis; por isso, mudanças precisam preservar a separação arquitetural,
o isolamento multi-tenant e a segurança do contrato público.

## Antes de começar

1. Abra uma issue para discutir mudanças relevantes de arquitetura ou comportamento público.
2. Crie uma branch a partir de `main`, com um nome descritivo, por exemplo
   `feat/message-idempotency` ou `fix/webhook-signature`.
3. Nunca faça commit de arquivos `.env`, credenciais, tokens, senhas, chaves privadas ou dados de
   produção.

## Ambiente local

Use Node.js 24 e npm 10+. Copie apenas os exemplos de ambiente e configure valores locais:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm ci --prefix backend
npm ci --prefix frontend
```

Para iniciar a infraestrutura completa de demonstração, execute:

```bash
docker compose up --build
```

## Diretrizes de implementação

- Organize mudanças por módulo de negócio e mantenha as dependências apontando para dentro:
  `domain` não depende de NestJS, ORM, HTTP ou provedores externos; `application` depende de
  contratos; `infrastructure` contém as implementações; `presentation` apenas adapta a fronteira.
- Não use `any`. Dados externos devem ser recebidos como `unknown` e validados antes do uso.
- Controllers e consumers devem ser finos e delegar comandos e queries ao Mediator.
- Preserve o Result Pattern para falhas esperadas e não exponha detalhes internos de provedores.
- Toda mudança de schema exige migration versionada, com caminhos `up` e `down` funcionais.
- Toda operação multi-tenant deve validar o escopo de tenant, aplicação e credencial.
- Não registre tokens, API keys, senhas, dados pessoais desnecessários ou payloads sensíveis.

## Qualidade obrigatória

Execute antes de abrir um pull request:

```bash
npm run validate --prefix backend
npm run validate --prefix frontend
```

Se a alteração incluir migrations, valide também em um PostgreSQL limpo:

```bash
npm run migration:run --prefix backend
npm run migration:revert --prefix backend
```

Inclua ou atualize testes unitários para regras de domínio e aplicação. Adicione testes de
integração ou E2E quando a mudança atravessar banco, fila, HTTP ou integrações externas.

## Pull requests

Descreva o problema, a solução, os impactos no contrato/API, migrations, configuração necessária e
como a mudança foi testada. Mantenha o pull request focado: não misture refactors amplos, mudanças
de formatação e funcionalidades sem relação.

Ao enviar uma contribuição, você concorda em licenciá-la sob os termos da [MIT License](./LICENSE).
