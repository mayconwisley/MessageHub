[← Voltar ao README](../README.md)

# Console web

O frontend é um console React 19 + MUI 7, com React Router, TanStack Query, React Hook Form e Zod. Todas as páginas protegidas exigem uma sessão administrativa (`POST /v1/auth/sessions`) — a sessão local basta para navegar entre telas; o acesso real a cada recurso é reforçado pelo backend em cada chamada, conforme o papel do usuário.

No ambiente nativo, o console abre em `http://localhost:5173`; no Docker, em `http://localhost:8080`.

O próprio console inclui um manual operacional em português, tela a tela, na rota `/help` ("Manual do usuário") — este documento espelha o mesmo conteúdo para quem prefere ler fora da aplicação, e serve como referência de qual papel é necessário para cada área.

## Papéis

| Papel | Escopo |
| --- | --- |
| `platform_admin` | Administração global e todos os endpoints operacionais da plataforma. |
| `tenant_admin` | Escopo do próprio tenant nos recursos permitidos e no dashboard. |
| `operator` | Papel de operação; o acesso efetivo é definido pelos guards de cada endpoint. |

O menu lateral esconde itens que um usuário sem `platform_admin` normalmente não usa (Tenants, Usuários, Eventos e logs, Webhooks e DLQ, Monitor de integrações, Alertas de engenharia, Ambiente sandbox) — isso é apenas uma conveniência de navegação; a autorização real é sempre validada pela API.

## Ordem recomendada de configuração

Cada cadastro depende do anterior. Na primeira configuração de um tenant:

1. **Tenants** — crie o tenant que vai usar o Hub.
2. **Aplicações** — vincule a aplicação consumidora ao tenant.
3. **Contas WhatsApp** — registre a WABA da Meta para o tenant.
4. **Números** — registre os números de telefone dessa conta.
5. **Aplicações** — vincule os números que cada aplicação poderá usar.
6. **Modelos de mensagem** — cadastre e publique os modelos que serão enviados.
7. **Mensagens** — envie mensagens e acompanhe a linha do tempo de entrega.
8. **Chaves de API** — gere uma chave apenas se outra aplicação for integrar com o Hub via API.

## Telas

| Tela | Rota | O que permite operar |
| --- | --- | --- |
| Visão geral | `/` | Dashboard: estado da plataforma (API, banco e RabbitMQ), atalhos, recursos cadastrados, volume de mensagens (14 dias), status de entrega (30 dias), itens que requerem atenção (falhas 24h e fila), qualidade de entrega e atividade técnica recente. Somente leitura. |
| Tenants | `/tenants` | Criar tenants e alternar status (Ativo/Suspenso). Primeiro cadastro do fluxo. |
| Aplicações | `/applications` | Criar aplicações por tenant, configurar o callback HTTPS de status, configurar quotas de envio por minuto/dia e vincular os números que a aplicação pode usar. |
| Contas WhatsApp | `/whatsapp-accounts` | Registrar a WABA de um tenant e suas credenciais (token de acesso, segredo do app). |
| Números | `/phone-numbers` | Registrar números Meta vinculados a uma conta WhatsApp já cadastrada. |
| E-mail SMTP | `/email-configurations` | Configurar (ou remover) o SMTP próprio de um tenant; sem override, o tenant usa o SMTP padrão da plataforma. |
| Chaves de API | `/api-keys` | Gerar e revogar chaves usadas por integrações externas, com escopos e último uso visíveis na listagem. O console não usa essas chaves para si mesmo. |
| Usuários | `/users` | Criar, listar, filtrar, editar e ativar/desativar usuários administrativos, com papel e, se necessário, tenant vinculado. |
| Eventos e logs | `/audit-logs` | Aba "Eventos": trilha de auditoria de ações administrativas mutáveis. Aba "Logs": logs técnicos de execução. Ambas somente leitura, atualizando a cada 30s. |
| Mensagens | `/messages` | Enviar texto livre, template ou e-mail avulso; abas separadas para listar mensagens WhatsApp e e-mails, cada uma com seus próprios filtros e rastreio; acompanhar linha do tempo, tentativas e status de entrega/leitura. |
| Modelos de mensagem | `/templates` | Criar, editar, excluir, sincronizar com a Meta e publicar templates pendentes, com busca por nome, filtros de status/categoria, retorno da Meta e prévia ao vivo. |
| Documentação da API | `/api-docs` | Referência de endpoints para integração externa (mensagens, e-mails, templates e configuração do tenant), com exemplos de requisição prontos para copiar, coleção Postman para download e link para o Swagger completo. |
| Webhooks e DLQ | `/webhooks` | Inspecionar eventos recebidos da Meta (payload mascarado, tentativas e motivo de falha) e reprocessar manualmente os que esgotaram as tentativas automáticas. |
| Monitor de integrações | `/monitoring` | Quotas de envio, taxa de entrega (24h), saúde de chaves de API e de números/credenciais Meta por aplicação. |
| Alertas de engenharia | `/engineering-alerts` | Falhas persistentes, envios para DLQ e degradações técnicas, com indicação de entrega a canais externos (Slack, Teams, e-mail). |
| Ambiente sandbox | `/sandbox` | Simular callbacks de status (entregue, lido, falhou) de uma mensagem já enviada, sem depender da Meta. Disponível apenas com `MESSAGE_PROVIDER=sandbox` e `SANDBOX_ENABLED=true`. |
| Manual do usuário | `/help` | Este mesmo guia, dentro do console. |

## Notas de operação

- **Quotas de aplicação** (`PUT /v1/applications/:applicationId/quotas`) são configuradas pelo botão "Configurar quotas" em Aplicações; o consumo efetivo é acompanhado em "Monitor de integrações". Uma aplicação nova nasce com 60 mensagens/minuto e 10.000 mensagens/dia.
- Uma **chave de API completa** (`wh_live_...` ou `wh_tenant_live_...`) só é exibida uma vez, no momento da criação; depois disso a listagem mostra apenas o prefixo.
- Em **Contas WhatsApp**, a coluna "Origem" indica como a credencial foi registrada; o formulário atual só cria contas com credenciais do próprio tenant (o canal padrão gerenciado por ambiente é reconciliado automaticamente no boot, sem passar por esse formulário).
- Em **Mensagens**, apenas templates com status "Aprovado" aparecem no seletor de envio — sincronize em "Modelos de mensagem" se um template recém-aprovado ainda não aparecer. WhatsApp e e-mails têm abas de listagem separadas, cada uma com filtro de status e campo de rastreio próprios; e-mails não têm status Entregue/Lida.
- Em **Usuários**, um administrador não pode desativar a própria conta — a API bloqueia essa operação mesmo tentada por outro caminho.
- Em **Ambiente sandbox**, use os finais `0000` (rejeição permanente) e `0001` (falha transitória) em números de telefone de teste para exercitar fluxos de erro.
