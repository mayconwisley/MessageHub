import { ExpandMoreOutlined } from '@mui/icons-material';
import {
  AccountTreeOutlined,
  AdminPanelSettingsOutlined,
  AppsOutlined,
  ChatOutlined,
  DashboardOutlined,
  EmailOutlined,
  ForumOutlined,
  HistoryOutlined,
  IntegrationInstructionsOutlined,
  MonitorHeartOutlined,
  NotificationsActiveOutlined,
  PeopleOutlined,
  PhoneOutlined,
  ScienceOutlined,
  SettingsOutlined,
  SmartToyOutlined,
  VpnKeyOutlined,
  WebhookOutlined,
} from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';

interface Section {
  icon: ReactNode;
  title: string;
  purpose: string;
  steps: string[];
  notes?: { severity: 'info' | 'warning'; text: string }[];
}

const sections: Section[] = [
  {
    icon: <AdminPanelSettingsOutlined />,
    title: 'Acesso ao console',
    purpose:
      'O console exige uma sessão administrativa. As chaves de API das aplicações não são usadas para entrar na interface web.',
    steps: [
      'Na tela de login, informe o e-mail e a senha do usuário cadastrado.',
      'Após autenticar, use a Visão geral para acompanhar a operação ou abra uma opção do menu lateral para executar uma tarefa.',
      'Para integrações externas, não use a senha nem a sessão do console: gere uma chave de API em "Chaves de API" e consulte "Documentação da API".',
    ],
  },
  {
    icon: <ForumOutlined />,
    title: 'Navegação e sessão',
    purpose:
      'O menu lateral organiza o console em Visão geral, Administração, Mensageria e Manual do usuário. A barra superior mantém os controles da sessão.',
    steps: [
      'Use os grupos "Administração" e "Mensageria" no menu lateral para expandir ou recolher as opções disponíveis.',
      'Em telas menores, abra o menu pelo ícone no canto superior esquerdo; ele é fechado automaticamente ao navegar para uma tela.',
      'Use o ícone de sol/lua na barra superior para alternar entre os temas claro e escuro.',
      'Use o ícone "Sair" para encerrar a sessão no console. A sessão local é removida mesmo se a confirmação do servidor estiver indisponível.',
    ],
  },
  {
    icon: <DashboardOutlined />,
    title: 'Visão geral',
    purpose:
      'É o dashboard operacional do Message Hub. Reúne o estado da plataforma, indicadores de estrutura, volume, entrega, itens que precisam de atenção e a atividade técnica mais recente.',
    steps: [
      'Consulte "Estado da plataforma" para ver, de forma independente, se API, banco de dados e RabbitMQ estão disponíveis. Atualiza automaticamente a cada 30 segundos, ou use o ícone de atualizar para checar na hora.',
      'Use os cartões de atalho ("Consultar mensagens", "Gerenciar aplicações", "Documentação da API", "Monitor de integrações", "Alertas de engenharia", "Ambiente sandbox") para ir direto à tela correspondente.',
      'Consulte "Recursos cadastrados" para ver as quantidades de tenants, aplicações, contas WhatsApp e números disponíveis para operação.',
      'Use "Volume de mensagens" para acompanhar os envios registrados nos últimos 14 dias.',
      'Use "Status de entrega" para analisar a distribuição dos status das mensagens dos últimos 30 dias.',
      'Em "Requer atenção", veja mensagens com falha nas últimas 24 horas e mensagens aguardando processamento — clique em qualquer linha para ir direto à tela de Mensagens filtrada.',
      'Em "Qualidade de entrega", acompanhe a taxa de sucesso (indicador circular) e a quantidade de números ativos.',
      'Confira "Atividade técnica recente" para visualizar os últimos envios, com os quatro últimos dígitos do destinatário, tipo, data e status.',
      'Se um indicador não carregar, use o botão de tentar novamente exibido no próprio cartão. Cada indicador é carregado de forma independente.',
    ],
    notes: [
      {
        severity: 'info',
        text: 'A Visão geral é somente para acompanhamento. Cadastros, configuração e envio são feitos pelas telas específicas do menu.',
      },
    ],
  },
  {
    icon: <AccountTreeOutlined />,
    title: 'Tenants',
    purpose:
      'Cadastra os tenants (os clientes/organizações que usam o Hub). É o primeiro cadastro do fluxo — tudo o mais depende de um tenant existir.',
    steps: [
      'Use "Buscar por nome" e o filtro "Status" (Todos, Ativo, Suspenso) para localizar um tenant na lista.',
      'Clique em "Criar tenant", informe o "Nome do tenant" (mínimo 2 caracteres) e confirme em "Criar tenant".',
      'Clique em "Detalhes" em qualquer linha para ver os dados completos do tenant.',
      'Na tela de detalhes, use "Suspender" (se estiver Ativo) ou "Ativar" (se estiver Suspenso) para mudar o status — essa ação é manual e reversível.',
    ],
  },
  {
    icon: <AppsOutlined />,
    title: 'Aplicações',
    purpose:
      'Cadastra aplicações consumidoras, configura o callback de status de mensagens e define quais números cada aplicação pode usar.',
    steps: [
      'Selecione um tenant em "Filtrar por tenant" para exibir a lista de aplicações — sem isso a lista não aparece.',
      'Clique em "Criar aplicação", escolha o "Tenant" e informe o "Nome da aplicação" (mínimo 2 caracteres). Uma aplicação nova nasce com quota padrão de 60 mensagens/minuto e 10.000 mensagens/dia.',
      'Para configurar o callback de status, selecione primeiro o tenant no filtro, clique em "Configurar webhook", escolha a aplicação e informe a URL HTTPS. Deixe o campo de URL vazio para remover a configuração existente.',
      'Clique em "Configurar quotas", escolha a aplicação e informe os novos limites de "Quota por minuto" e "Quota por dia". Os valores atuais da aplicação selecionada são pré-carregados no formulário.',
      'Clique em "Vincular números", escolha a aplicação e marque os números que ela poderá usar para enviar mensagens. Salve os vínculos ao terminar.',
      'Clique em "Ver detalhes" em qualquer linha para consultar webhook, quotas e números vinculados da aplicação em um só lugar.',
    ],
    notes: [
      {
        severity: 'info',
        text: 'A lista e os seletores de webhook, quotas e números respeitam o tenant escolhido. Se nenhum tenant estiver selecionado, não haverá aplicações ou números para escolher.',
      },
      {
        severity: 'info',
        text: 'O consumo efetivo das quotas configuradas aqui é acompanhado em "Monitor de integrações".',
      },
    ],
  },
  {
    icon: <SmartToyOutlined />,
    title: 'Contas WhatsApp',
    purpose:
      'Registra a WhatsApp Business Account (WABA) de um tenant e as credenciais que o Hub utilizará ao comunicar-se com a Meta.',
    steps: [
      'Selecione um tenant em "Filtrar por tenant" (e, opcionalmente, um "Status") para ver as contas cadastradas.',
      'Clique em "Registrar conta", escolha o "Tenant" e informe o "ID da conta WhatsApp (WABA)".',
      'Informe o token de acesso e, quando aplicável, o segredo do aplicativo. Esses valores são tratados como credenciais do tenant; não são exibidos na listagem.',
      'Clique em "Detalhes" em qualquer linha para consultar os dados da conta.',
    ],
    notes: [
      {
        severity: 'info',
        text: 'A coluna "Origem" indica como a credencial foi registrada. O formulário atual registra novas contas com credenciais do próprio tenant.',
      },
    ],
  },
  {
    icon: <PhoneOutlined />,
    title: 'Números',
    purpose: 'Registra um número de telefone da Meta vinculado a uma conta WhatsApp já cadastrada.',
    steps: [
      'Selecione um tenant em "Filtrar por tenant" (e, opcionalmente, um "Status") para ver os números cadastrados.',
      'Clique em "Registrar número" e escolha o "Tenant" — isso habilita o campo "Conta WhatsApp".',
      'Escolha a "Conta WhatsApp" e informe o "ID do número de telefone (Meta)" e o "Número de exibição" (ex.: +5511999999999).',
    ],
    notes: [
      {
        severity: 'warning',
        text: 'É preciso ter uma conta WhatsApp cadastrada para esse tenant antes de registrar um número — sem isso, o campo "Conta WhatsApp" mostra "Nenhuma conta encontrada".',
      },
    ],
  },
  {
    icon: <EmailOutlined />,
    title: 'E-mail SMTP',
    purpose:
      'Configura o SMTP próprio de um tenant para o envio de e-mails via API. Sem essa configuração, o tenant usa o SMTP padrão da plataforma (quando habilitado no ambiente do Hub).',
    steps: [
      'Selecione um "Tenant" para ver a origem atual em uso: "SMTP do tenant", "SMTP padrão da plataforma" ou "Não configurado".',
      'Informe "Servidor SMTP", "Porta", "Usuário SMTP" e "Senha SMTP", além de "E-mail remetente" e "Nome remetente", e confirme em "Salvar SMTP do tenant".',
      'Ative "SMTPS direto" apenas para a porta 465; para a porta 587 (STARTTLS), deixe desativado.',
      'Se o tenant já tiver uma configuração própria, use "Usar SMTP padrão" para removê-la e voltar a depender do fallback global.',
    ],
    notes: [
      {
        severity: 'info',
        text: 'A senha SMTP é cifrada no banco e nunca é exibida novamente após salva — para trocá-la, informe uma nova senha e salve outra vez.',
      },
    ],
  },
  {
    icon: <VpnKeyOutlined />,
    title: 'Chaves de API',
    purpose:
      'Gera e revoga as chaves usadas por outras aplicações (integrações externas) para consumir a API de mensagens e modelos de mensagem. O próprio console não usa essas chaves — as telas de Mensagens e Modelos de mensagem operam com a sua sessão administrativa.',
    steps: [
      'Selecione "Filtrar por tenant" e depois "Filtrar por aplicação" para ver as chaves de uma aplicação.',
      'Clique em "Gerar chave de API", escolha "Tenant" e "Aplicação", o "Tipo" (Plataforma ou Tenant) e, se quiser, uma data em "Expira em (opcional)".',
      'Copie o valor completo da chave exibido no alerta imediatamente após a criação.',
      'Consulte as colunas "Escopos" e "Último uso" na listagem para saber o que a chave autoriza e se ela está realmente em uso ("Nunca" quando ainda não foi usada).',
      'Para desativar uma chave, clique em "Revogar" na linha correspondente — chaves já revogadas não podem ser revogadas de novo.',
    ],
    notes: [
      {
        severity: 'warning',
        text: 'A chave completa (wh_live_...) só aparece uma única vez, no momento em que é criada. Depois disso, a listagem mostra apenas o "Prefixo" — a chave não pode ser recuperada.',
      },
    ],
  },
  {
    icon: <PeopleOutlined />,
    title: 'Usuários',
    purpose:
      'Cria, lista, edita e ativa/desativa usuários administrativos que podem fazer login no console, opcionalmente vinculados a um tenant.',
    steps: [
      'Use "Buscar por nome ou e-mail" e os filtros "Papel" e "Status" para localizar um usuário na lista.',
      'Clique em "Criar usuário" e informe "Nome", "E-mail" e "Senha" (mínimo 12 caracteres).',
      'Escolha o "Papel": Administrador da plataforma, Administrador do tenant ou Operador.',
      'Se o papel escolhido não for "Administrador da plataforma", selecione também o "Tenant" — o campo aparece automaticamente e é obrigatório para papéis não globais.',
      'Abra o menu de ações de uma linha e clique em "Editar" para alterar nome, e-mail, papel ou tenant de um usuário existente.',
      'Use "Desativar" (com confirmação) ou "Ativar" no menu de ações para alternar o status de acesso de um usuário.',
    ],
    notes: [
      {
        severity: 'info',
        text: 'Um usuário não pode desativar a própria conta — a ação é bloqueada pela API mesmo que tentada por outro caminho.',
      },
    ],
  },
  {
    icon: <HistoryOutlined />,
    title: 'Eventos e logs',
    purpose:
      'Reúne a trilha de auditoria das ações administrativas ("Eventos") e os logs técnicos de execução capturados pela ferramenta ("Logs"), ambos somente leitura.',
    steps: [
      'Na aba "Eventos", filtre por "Método" (POST, PUT, PATCH, DELETE) ou pelo "Tipo de recurso" (ex.: tenants, users) e clique em "Ver detalhes" para consultar ator, rota, status HTTP e metadados da requisição.',
      'Na aba "Logs", filtre por "Nível" (Trace a Fatal) ou busque um trecho no campo "Buscar na mensagem"; use "Ver detalhes" para o contexto completo e os metadados técnicos do registro.',
    ],
    notes: [
      {
        severity: 'info',
        text: 'Nenhuma das duas abas expõe payloads de negócio ou secrets — apenas metadados operacionais. Ambas atualizam automaticamente a cada 30 segundos.',
      },
    ],
  },
  {
    icon: <ChatOutlined />,
    title: 'Mensagens',
    purpose:
      'Envia mensagens avulsas — texto livre, modelo aprovado da Meta ou e-mail —, lista o que já foi enviado em abas separadas por canal (WhatsApp e E-mails) e acompanha, em uma linha do tempo, o processamento, as tentativas, erros, entrega e leitura.',
    steps: [
      'Selecione "Tenant" e "Aplicação" no topo da tela — esses filtros definem de onde as comunicações são listadas e em nome de qual aplicação uma nova mensagem é enviada. Quando só existe uma opção, ela é selecionada automaticamente.',
      'Use as abas "WhatsApp" e "E-mails" para alternar qual canal está sendo listado — cada aba tem sua própria lista, filtro de status e campo de rastreio.',
      'Use o filtro "Status" para navegar pela lista. Em WhatsApp: Pendente, Processando, Enviada, Entregue, Lida, Falhou ou Repetindo. Em E-mails: Pendente, Processando, Enviada, Falhou ou Repetindo (não há Entregue/Lida para e-mail).',
      'Use o campo "Rastrear mensagem"/"Rastrear e-mail" para buscar por ID, provider ID, request ID, chave de idempotência, destinatário ou (só para e-mail) assunto.',
      'Clique em "Enviar mensagem" e escolha o tipo de envio no topo do formulário: "Texto livre", "Modelo" ou "E-mail".',
      'Em "Texto livre", escolha o número de origem, informe o "Destinatário" (telefone E.164 ou BSUID recebido em um webhook da Meta) e o texto em "Mensagem" (até 4096 caracteres).',
      'Em "Modelo", escolha a "Conta WhatsApp" para listar os modelos aprovados dessa conta, selecione o modelo, o número de origem e o "Destinatário"; preencha os "Parâmetros" na mesma ordem dos placeholders {{1}}, {{2}} etc. do corpo do modelo, quando existirem.',
      'Em "E-mail", informe o "Destinatário" (endereço de e-mail), o "Assunto" e a "Mensagem". O envio usa o SMTP do tenant configurado em "E-mail SMTP" ou, na ausência de override, o SMTP padrão da plataforma. Ao enviar, a tela troca automaticamente para a aba "E-mails".',
      'Na linha de uma mensagem ou e-mail, abra o menu de ações e clique em "Ver linha do tempo". O painel mostra o conteúdo, o status atual e todos os eventos disponíveis em ordem cronológica.',
      'Em cada tentativa, verifique se o provedor aceitou o envio ou se ocorreu falha. Quando houver falha, o painel mostra a mensagem e o código técnico retornado pelo provedor.',
      'Para mensagens entregues ou lidas, a linha do tempo é atualizada a partir dos webhooks da Meta. O evento "Entregue" indica que a mensagem chegou ao destinatário; "Lida" indica a confirmação de leitura.',
      'Quando o status for "Repetindo", aguarde a próxima tentativa automática. Se terminar em "Falha", corrija a causa indicada antes de realizar um novo envio.',
    ],
    notes: [
      {
        severity: 'info',
        text: 'Somente modelos com status "Aprovado" aparecem no seletor de "Modelo" — sincronize com a Meta na tela "Modelos de mensagem" se um modelo recém-aprovado ainda não aparecer.',
      },
      {
        severity: 'warning',
        text: 'Se a fila RabbitMQ estiver indisponível, um aviso aparece no topo da tela: os envios continuam sendo aceitos e ficam como pendentes até a conexão ser restabelecida, sem perda de dados.',
      },
      {
        severity: 'info',
        text: 'Quando o usuário usar username e ocultar o telefone, o webhook traz sender.id como BSUID e sender.displayName como nome informativo. Responda usando exatamente o sender.id; não use o texto do @username.',
      },
      {
        severity: 'info',
        text: 'O status muda automaticamente conforme o processamento avança (Pendente → Processando → Enviada → Entregue → Lida, ou Falhou → Repetindo). A linha do tempo preserva as tentativas de envio; o horário de entrega pode não estar disponível quando o provedor só retornar a confirmação de leitura.',
      },
    ],
  },
  {
    icon: <SettingsOutlined />,
    title: 'Modelos de mensagem',
    purpose:
      'Cria, visualiza, edita, exclui, sincroniza e publica os modelos de mensagem da Meta em uma conta WhatsApp.',
    steps: [
      'Selecione "Tenant" e depois a conta WhatsApp para ver os modelos dessa conta. Refine com "Buscar por nome" e os filtros "Status" e "Categoria" se necessário.',
      'Use "Sincronizar Meta" para atualizar o status dos modelos a partir da Meta, ou "Publicar pendentes" para enviar os rascunhos para aprovação.',
      'Clique em "Criar modelo" e informe Tenant, Conta WhatsApp, Nome, Idioma e Categoria. O editor permite cabeçalho, corpo, rodapé, variáveis {{1}}, exemplos e botão de URL, com prévia ao lado.',
      'A prévia é atualizada em tempo real. Use "Visualizar no WhatsApp" para consultar um modelo já cadastrado; o cabeçalho usa o nome da empresa, não o número de telefone.',
      'Use "Editar modelo" para alterar a categoria e os componentes. Nome e idioma não podem ser alterados. Em modelos publicados, a alteração é reenviada para análise da Meta.',
      'Use "Excluir modelo" para remover o registro no Hub e solicitar a remoção correspondente na Meta.',
    ],
    notes: [
      {
        severity: 'warning',
        text: 'O status de aprovação (Rascunho, Pendente, Aprovado, Rejeitado, Pausado, Desativado) é definido pela Meta e pode mudar sem ação do usuário — sincronize periodicamente para manter o console atualizado.',
      },
      {
        severity: 'info',
        text: 'A coluna "Retorno da Meta" mostra o motivo de rejeição ou o último erro reportado pela Meta para o modelo, quando houver.',
      },
    ],
  },
  {
    icon: <IntegrationInstructionsOutlined />,
    title: 'Documentação da API',
    purpose:
      'Referência de endpoints para times que vão integrar sistemas externos ao Hub via API (envio de mensagens WhatsApp e e-mail, gestão de templates e configuração de contas WhatsApp/números/SMTP de um tenant), com exemplos de requisição prontos para copiar.',
    steps: [
      'Gere ou copie uma chave de API na tela "Chaves de API" antes de testar os exemplos.',
      'Use o botão "Copiar" em cada bloco de código para copiar o comando de exemplo.',
      'A página separa os endpoints em Mensagens, E-mails, Modelos de mensagem (chave "Plataforma", wh_live_...) e Configuração do tenant — Contas WhatsApp, Números e SMTP (chave "Tenant", wh_tenant_live_...). Nos envios de mensagem e de e-mail, informe uma Idempotency-Key para evitar duplicidade em retries.',
      'Baixe a "Coleção Postman" para importar todos os exemplos prontos no Postman ou compatíveis.',
      'Para o contrato completo de todos os endpoints, use o botão "Referência completa (Swagger)".',
    ],
  },
  {
    icon: <WebhookOutlined />,
    title: 'Webhooks e DLQ',
    purpose:
      'Mostra os eventos recebidos da Meta (payload mascarado), seu processamento e permite reenviar manualmente os que esgotaram as tentativas automáticas.',
    steps: [
      'Use o filtro "Status" (Pendente, Processado, Falhou / DLQ) para localizar um evento.',
      'Consulte as colunas "Tentativas" e "Motivo" para entender quantas vezes o processamento foi tentado e por que falhou, quando aplicável.',
      'Clique em "Ver payload mascarado" para inspecionar o conteúdo recebido da Meta.',
      'Para eventos com status "Falhou / DLQ", use "Reprocessar" para tentar novamente — a ação é registrada na auditoria técnica.',
    ],
    notes: [
      {
        severity: 'info',
        text: '"Reprocessar" só fica disponível para eventos que já esgotaram todas as tentativas automáticas.',
      },
    ],
  },
  {
    icon: <MonitorHeartOutlined />,
    title: 'Monitor de integrações',
    purpose:
      'Acompanha a saúde e a capacidade de uma aplicação: quotas de envio, taxa de entrega das últimas 24 horas, saúde das chaves de API e dos números/credenciais Meta vinculados.',
    steps: [
      'Selecione "Tenant" e depois a "Aplicação" para carregar o monitor — sem uma aplicação selecionada, nada é exibido.',
      'Em "Quotas", verifique o consumo por minuto e por dia frente ao limite configurado para a aplicação.',
      'Em "Entrega (24h)", acompanhe a taxa de falha; um alerta aparece automaticamente quando ela atinge 10% ou mais.',
      'Consulte as tabelas "Credenciais de API" e "Números e credenciais Meta" para ver expiração e saúde de cada credencial.',
    ],
  },
  {
    icon: <NotificationsActiveOutlined />,
    title: 'Alertas de engenharia',
    purpose:
      'Lista falhas persistentes, envios para DLQ e degradações técnicas relevantes para a equipe de engenharia, incluindo se o alerta foi entregue a um canal externo (Slack, Teams ou e-mail).',
    steps: [
      'Use o filtro "Severidade" (Crítica ou Alerta) para priorizar a análise.',
      'Clique em "Ver dados técnicos" para consultar a mensagem completa e os metadados do alerta (ex.: IDs de mensagem, aplicação ou tenant envolvidos).',
      'A coluna "Entrega externa" indica se o alerta foi enviado a um canal configurado (`ENGINEERING_SLACK_WEBHOOK_URL`, `ENGINEERING_TEAMS_WEBHOOK_URL` ou `ENGINEERING_EMAIL_WEBHOOK_URL`) ou se ficou pendente por falta de canal.',
    ],
    notes: [
      {
        severity: 'info',
        text: 'A lista atualiza automaticamente a cada 30 segundos.',
      },
    ],
  },
  {
    icon: <ScienceOutlined />,
    title: 'Ambiente sandbox',
    purpose:
      'Permite simular callbacks de status (entrega, leitura ou falha) de uma mensagem sem depender da Meta — útil para testar integrações e o fluxo de webhooks localmente.',
    steps: [
      'Verifique o alerta no topo da tela: o sandbox só fica disponível quando o provider ativo é "sandbox" (`MESSAGE_PROVIDER=sandbox` e `SANDBOX_ENABLED=true` no ambiente do Hub).',
      'Selecione "Tenant", "Aplicação" e a mensagem já enviada pelo fluxo normal que terá o status simulado.',
      'Escolha o "Webhook simulado" (DELIVERED, READ ou FAILED) e clique em "Simular webhook".',
      'Use os números finais informados nos chips (0000 para rejeição permanente, 0001 para falha transitória) ao registrar números de telefone de teste, para exercitar os fluxos de erro.',
    ],
  },
];

function SectionAccordion({ section }: { section: Section }) {
  return (
    <Accordion variant="outlined" disableGutters>
      <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          {section.icon}
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {section.title}
          </Typography>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={1.5}>
          <Typography color="text.secondary">{section.purpose}</Typography>
          {section.steps.length > 0 && (
            <List dense disablePadding>
              {section.steps.map((step, index) => (
                <ListItem key={step} disableGutters alignItems="flex-start">
                  <ListItemIcon sx={{ minWidth: 32, mt: '2px' }}>
                    <Chip
                      label={index + 1}
                      size="small"
                      sx={{ minWidth: 24, height: 24, fontWeight: 700 }}
                    />
                  </ListItemIcon>
                  <ListItemText primary={step} />
                </ListItem>
              ))}
            </List>
          )}
          {section.notes?.map((note) => (
            <Alert key={note.text} severity={note.severity}>
              {note.text}
            </Alert>
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}

export function HelpPage() {
  return (
    <Stack spacing={3}>
      <PageHeader
        title="Manual do usuário"
        description="Guia completo para acessar, configurar e operar o console do Message Hub."
      />

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={1.5}>
            <Typography variant="h6">Ordem recomendada de configuração</Typography>
            <Typography color="text.secondary">
              Cada cadastro depende do anterior. Siga esta ordem na primeira configuração de um
              tenant:
            </Typography>
            <List dense disablePadding>
              {[
                'Tenants — crie o tenant que vai usar o Hub.',
                'Aplicações — vincule a aplicação consumidora ao tenant.',
                'Contas WhatsApp — registre a WABA da Meta para o tenant.',
                'Números — registre os números de telefone dessa conta.',
                'Aplicações — vincule os números que cada aplicação poderá usar.',
                'Modelos de mensagem — cadastre e publique os modelos que serão enviados.',
                'Mensagens — envie mensagens e acompanhe a linha do tempo de entrega.',
                'Chaves de API — gere uma chave apenas se outra aplicação for integrar com o Hub via API.',
              ].map((step, index) => (
                <ListItem key={step} disableGutters alignItems="flex-start">
                  <ListItemIcon sx={{ minWidth: 32, mt: '2px' }}>
                    <Chip
                      label={index + 1}
                      size="small"
                      color="primary"
                      sx={{ minWidth: 24, height: 24, fontWeight: 700 }}
                    />
                  </ListItemIcon>
                  <ListItemText primary={step} />
                </ListItem>
              ))}
            </List>
            <Divider />
            <Alert severity="info" icon={<AdminPanelSettingsOutlined fontSize="small" />}>
              Todas as telas de administração exigem login com um usuário que tenha papel
              administrativo, inclusive Mensagens e modelos de mensagem. A chave de API de aplicação
              (wh_live_...) só é necessária para integrações externas que chamam a API diretamente —
              veja "Documentação da API".
            </Alert>
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={1.5}>
        <Typography variant="h6">
          <Stack direction="row" spacing={1} alignItems="center" component="span">
            <ForumOutlined fontSize="small" />
            <span>Telas do console</span>
          </Stack>
        </Typography>
        <Stack spacing={1}>
          {sections.map((section) => (
            <SectionAccordion key={section.title} section={section} />
          ))}
        </Stack>
      </Stack>
    </Stack>
  );
}
