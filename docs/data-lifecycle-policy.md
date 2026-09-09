# Política de ciclo de vida de dados

## Política aprovada

- Mensagens WhatsApp, e-mails e eventos de webhook são excluídos definitivamente após **90 dias** por padrão.
- O prazo pode ser ajustado por tenant por `PATCH /v1/tenants/{id}/data-retention`.
- Eventos de auditoria são preservados por **seis meses de calendário**, independentemente do tenant.
- A limpeza roda diariamente, em lotes de 1.000 registros, e usa um advisory lock do PostgreSQL para que apenas uma réplica a execute por vez.
- Ao remover mensagens e e-mails, as tentativas e linhas de timeline associadas são excluídas pelas chaves estrangeiras com `ON DELETE CASCADE`.
- Um webhook é associado ao tenant quando seu payload aponta inequivocamente para um único número de telefone cadastrado. Eventos legados ou ambíguos usam o padrão global de 90 dias, sem ganhar uma retenção maior.

## Estado atual

Nenhuma exclusão ou anonimização automática é executada pelo Message Hub. Essa é uma escolha
intencional: retenção é uma regra de negócio por tenant e não deve ser ativada por padrão.

## Pré-requisitos para ativação

Para cada tenant, a operação deve registrar e aprovar:

1. prazo de retenção para mensagens, e-mails, webhooks e logs técnicos;
2. ação ao expirar: anonimização irreversível ou exclusão definitiva;
3. prazo de retenção separado para auditoria administrativa;
4. responsável pelo tratamento e canal para solicitações de titulares;
5. base legal e requisitos contratuais aplicáveis.

## Regras de implementação

- A configuração deve ser por tenant e iniciar desabilitada.
- O job deve produzir auditoria estruturada sem registrar conteúdo pessoal removido.
- Antes de executar a ação definitiva, o job deve suportar modo de simulação com contagem por
  tipo de dado e tenant.
- A operação deve ser idempotente e paginada; nunca executar `DELETE` amplo sem limite.
- Mensagens, e-mails e webhooks devem ser tratados separadamente de credenciais, chaves,
  registros de auditoria e dados necessários para obrigações legais.
- Solicitações de exportação, exclusão e anonimização devem ser autenticadas, autorizadas e
  rastreáveis por tenant.

## Critérios de aceite para a implementação

- Migration versionada para as configurações por tenant.
- Endpoint administrativo protegido para leitura e atualização da política.
- Job agendado, com dry-run, métricas de volume/erro e alertas de falha.
- Testes unitários de cálculo de elegibilidade e integração para o escopo por tenant.
- Documentação de operação e rollback, quando a ação escolhida permitir reversão.
