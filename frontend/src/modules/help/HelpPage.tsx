import { ExpandMoreOutlined } from "@mui/icons-material";
import {
  AccountTreeOutlined,
  AdminPanelSettingsOutlined,
  AppsOutlined,
  ChatOutlined,
  DashboardOutlined,
  ForumOutlined,
  IntegrationInstructionsOutlined,
  PeopleOutlined,
  PhoneOutlined,
  SettingsOutlined,
  SmartToyOutlined,
  VpnKeyOutlined,
} from "@mui/icons-material";
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
} from "@mui/material";
import type { ReactNode } from "react";
import { PageHeader } from "../../components/ui/PageHeader";

interface Section {
  icon: ReactNode;
  title: string;
  purpose: string;
  steps: string[];
  notes?: { severity: "info" | "warning"; text: string }[];
}

const sections: Section[] = [
  {
    icon: <AdminPanelSettingsOutlined />,
    title: "Acesso ao console",
    purpose:
      "O console exige uma sessão administrativa. As chaves de API das aplicações não são usadas para entrar na interface web.",
    steps: [
      'Na tela de login, informe o e-mail e a senha do usuário cadastrado.',
      'Após autenticar, use a Visão geral para acompanhar a operação ou abra uma opção do menu lateral para executar uma tarefa.',
      'Para integrações externas, não use a senha nem a sessão do console: gere uma chave de API em "Chaves de API" e consulte "Documentação da API".',
    ],
  },
  {
    icon: <ForumOutlined />,
    title: "Navegação e sessão",
    purpose:
      "O menu lateral organiza o console em Visão geral, Administração, Mensageria e Manual do usuário. A barra superior mantém os controles da sessão.",
    steps: [
      'Use os grupos "Administração" e "Mensageria" no menu lateral para expandir ou recolher as opções disponíveis.',
      'Em telas menores, abra o menu pelo ícone no canto superior esquerdo; ele é fechado automaticamente ao navegar para uma tela.',
      'Use o ícone de sol/lua na barra superior para alternar entre os temas claro e escuro.',
      'Use o ícone "Sair" para encerrar a sessão no console. A sessão local é removida mesmo se a confirmação do servidor estiver indisponível.',
    ],
  },
  {
    icon: <DashboardOutlined />,
    title: "Visão geral",
    purpose:
      "É o dashboard operacional do Message Hub. Reúne os indicadores de estrutura, volume, entrega, saúde da operação e as mensagens mais recentes.",
    steps: [
      'Consulte "Recursos cadastrados" para ver as quantidades de tenants, aplicações, contas WhatsApp e números disponíveis para operação.',
      'Use "Volume de mensagens" para acompanhar os envios registrados nos últimos 14 dias.',
      'Use "Status de entrega" para analisar a distribuição dos status das mensagens dos últimos 30 dias.',
      'Em "Saúde operacional", acompanhe a taxa de sucesso, mensagens na fila, falhas nas últimas 24 horas e números ativos.',
      'Confira "Atividade recente" para visualizar os últimos envios, com os quatro últimos dígitos do destinatário, tipo, data e status.',
      'Se um indicador não carregar, use o botão de tentar novamente exibido no próprio cartão. Cada indicador é carregado de forma independente.',
    ],
    notes: [
      {
        severity: "info",
        text: "A Visão geral é somente para acompanhamento. Cadastros, configuração e envio são feitos pelas telas específicas do menu.",
      },
    ],
  },
  {
    icon: <AccountTreeOutlined />,
    title: "Tenants",
    purpose:
      "Cadastra os tenants (os clientes/organizações que usam o Hub). É o primeiro cadastro do fluxo — tudo o mais depende de um tenant existir.",
    steps: [
      'Use "Buscar por nome" e o filtro "Status" (Todos, Ativo, Suspenso) para localizar um tenant na lista.',
      'Clique em "Criar tenant", informe o "Nome do tenant" (mínimo 2 caracteres) e confirme em "Criar tenant".',
      'Clique em "Detalhes" em qualquer linha para ver os dados completos do tenant.',
      'Na tela de detalhes, use "Suspender" (se estiver Ativo) ou "Ativar" (se estiver Suspenso) para mudar o status — essa ação é manual e reversível.',
    ],
  },
  {
    icon: <AppsOutlined />,
    title: "Aplicações",
    purpose:
      "Cadastra aplicações consumidoras, configura o callback de status de mensagens e define quais números cada aplicação pode usar.",
    steps: [
      'Selecione um tenant em "Filtrar por tenant" para exibir a lista de aplicações — sem isso a lista não aparece.',
      'Clique em "Criar aplicação", escolha o "Tenant" e informe o "Nome da aplicação" (mínimo 2 caracteres).',
      'Para configurar o callback de status, selecione primeiro o tenant no filtro, clique em "Configurar webhook", escolha a aplicação e informe a URL HTTPS. Deixe o campo de URL vazio para remover a configuração existente.',
      'Clique em "Vincular números", escolha a aplicação e marque os números que ela poderá usar para enviar mensagens. Salve os vínculos ao terminar.',
    ],
    notes: [
      {
        severity: "info",
        text: "A lista, o seletor do webhook e o seletor de números respeitam o tenant escolhido. Se nenhum tenant estiver selecionado, não haverá aplicações ou números para escolher.",
      },
    ],
  },
  {
    icon: <SmartToyOutlined />,
    title: "Contas WhatsApp",
    purpose:
      "Registra a WhatsApp Business Account (WABA) de um tenant e as credenciais que o Hub utilizará ao comunicar-se com a Meta.",
    steps: [
      'Selecione um tenant em "Filtrar por tenant" (e, opcionalmente, um "Status") para ver as contas cadastradas.',
      'Clique em "Registrar conta", escolha o "Tenant" e informe o "ID da conta WhatsApp (WABA)".',
      'Informe o token de acesso e, quando aplicável, o segredo do aplicativo. Esses valores são tratados como credenciais do tenant; não são exibidos na listagem.',
      'Clique em "Detalhes" em qualquer linha para consultar os dados da conta.',
    ],
    notes: [
      {
        severity: "info",
        text: 'A coluna "Origem" indica como a credencial foi registrada. O formulário atual registra novas contas com credenciais do próprio tenant.',
      },
    ],
  },
  {
    icon: <PhoneOutlined />,
    title: "Números",
    purpose:
      "Registra um número de telefone da Meta vinculado a uma conta WhatsApp já cadastrada.",
    steps: [
      'Selecione um tenant em "Filtrar por tenant" (e, opcionalmente, um "Status") para ver os números cadastrados.',
      'Clique em "Registrar número" e escolha o "Tenant" — isso habilita o campo "Conta WhatsApp".',
      'Escolha a "Conta WhatsApp" e informe o "ID do número de telefone (Meta)" e o "Número de exibição" (ex.: +5511999999999).',
    ],
    notes: [
      {
        severity: "warning",
        text: 'É preciso ter uma conta WhatsApp cadastrada para esse tenant antes de registrar um número — sem isso, o campo "Conta WhatsApp" mostra "Nenhuma conta encontrada".',
      },
    ],
  },
  {
    icon: <VpnKeyOutlined />,
    title: "Chaves de API",
    purpose:
      "Gera e revoga as chaves usadas por outras aplicações (integrações externas) para consumir a API de mensagens e modelos de mensagem. O próprio console não usa essas chaves — as telas de Mensagens e Modelos de mensagem operam com a sua sessão administrativa.",
    steps: [
      'Selecione "Filtrar por tenant" e depois "Filtrar por aplicação" para ver as chaves de uma aplicação.',
      'Clique em "Gerar chave de API", escolha "Tenant" e "Aplicação", o "Tipo" (Plataforma ou Tenant) e, se quiser, uma data em "Expira em (opcional)".',
      "Copie o valor completo da chave exibido no alerta imediatamente após a criação.",
      'Para desativar uma chave, clique em "Revogar" na linha correspondente — chaves já revogadas não podem ser revogadas de novo.',
    ],
    notes: [
      {
        severity: "warning",
        text: 'A chave completa (wh_live_...) só aparece uma única vez, no momento em que é criada. Depois disso, a listagem mostra apenas o "Prefixo" — a chave não pode ser recuperada.',
      },
    ],
  },
  {
    icon: <PeopleOutlined />,
    title: "Usuários",
    purpose:
      "Cria usuários administrativos que poderão fazer login no console, opcionalmente vinculados a um tenant.",
    steps: [
      'Clique em "Criar usuário" e informe "Nome", "E-mail" e "Senha" (mínimo 12 caracteres).',
      'Escolha o "Papel": Administrador da plataforma, Administrador do tenant ou Operador.',
      'Se o papel escolhido não for "Administrador da plataforma", selecione também o "Tenant" — o campo aparece automaticamente e é obrigatório para papéis não globais.',
    ],
    notes: [
      {
        severity: "info",
        text: "Esta tela ainda não lista os usuários já criados — apenas permite criar novos.",
      },
    ],
  },
  {
    icon: <ChatOutlined />,
    title: "Mensagens",
    purpose:
      "Envia mensagens de texto avulsas a partir de um número cadastrado e acompanha, em uma linha do tempo, o processamento, as tentativas, erros, entrega e leitura.",
    steps: [
      'Selecione "Tenant" e "Aplicação" no topo da tela — esses filtros definem de onde as mensagens são listadas e em nome de qual aplicação uma nova mensagem é enviada. Quando só existe uma opção, ela é selecionada automaticamente.',
      'Use o filtro "Status" para navegar pela lista (Pendente, Processando, Enviada, Entregue, Lida, Falhou, Repetindo).',
      'Clique em "Enviar mensagem", escolha o número de origem, informe o "Destinatário" (telefone E.164 ou BSUID recebido em um webhook da Meta) e o texto em "Mensagem" (até 4096 caracteres).',
      'Na linha da mensagem, abra o menu de ações e clique em "Ver linha do tempo". O painel mostra o conteúdo, o status atual e todos os eventos disponíveis em ordem cronológica.',
      'Em cada tentativa, verifique se o provedor aceitou o envio ou se ocorreu falha. Quando houver falha, o painel mostra a mensagem e o código técnico retornado pelo provedor.',
      'Para mensagens entregues ou lidas, a linha do tempo é atualizada a partir dos webhooks da Meta. O evento "Entregue" indica que a mensagem chegou ao destinatário; "Lida" indica a confirmação de leitura.',
      'Quando o status for "Repetindo", aguarde a próxima tentativa automática. Se terminar em "Falha", corrija a causa indicada antes de realizar um novo envio.',
    ],
    notes: [
      {
        severity: "info",
        text: "Quando o usuário usar username e ocultar o telefone, o webhook traz sender.id como BSUID e sender.displayName como nome informativo. Responda usando exatamente o sender.id; não use o texto do @username.",
      },
      {
        severity: "info",
        text: "O status muda automaticamente conforme o processamento avança (Pendente → Processando → Enviada → Entregue → Lida, ou Falhou → Repetindo). A linha do tempo preserva as tentativas de envio; o horário de entrega pode não estar disponível quando o provedor só retornar a confirmação de leitura.",
      },
    ],
  },
  {
    icon: <SettingsOutlined />,
    title: "Modelos de mensagem",
    purpose:
      "Cria, visualiza, edita, exclui, sincroniza e publica os modelos de mensagem da Meta em uma conta WhatsApp.",
    steps: [
      'Selecione "Tenant" e depois a conta WhatsApp para ver os modelos dessa conta. Refine com os filtros "Status" e "Categoria" se necessário.',
      'Use "Sincronizar Meta" para atualizar o status dos modelos a partir da Meta, ou "Publicar pendentes" para enviar os rascunhos para aprovação.',
      'Clique em "Criar modelo" e informe Tenant, Conta WhatsApp, Nome, Idioma e Categoria. O editor permite cabeçalho, corpo, rodapé, variáveis {{1}}, exemplos e botão de URL, com prévia ao lado.',
      'A prévia é atualizada em tempo real. Use "Visualizar no WhatsApp" para consultar um modelo já cadastrado; o cabeçalho usa o nome da empresa, não o número de telefone.',
      'Use "Editar modelo" para alterar a categoria e os componentes. Nome e idioma não podem ser alterados. Em modelos publicados, a alteração é reenviada para análise da Meta.',
      'Use "Excluir modelo" para remover o registro no Hub e solicitar a remoção correspondente na Meta.',
    ],
    notes: [
      {
        severity: "warning",
        text: "O status de aprovação (Rascunho, Pendente, Aprovado, Rejeitado, Pausado, Desativado) é definido pela Meta e pode mudar sem ação do usuário — sincronize periodicamente para manter o console atualizado.",
      },
    ],
  },
  {
    icon: <IntegrationInstructionsOutlined />,
    title: "Documentação da API",
    purpose:
      "Referência de endpoints para times que vão integrar sistemas externos ao Hub via API (envio de mensagens e gestão de templates), com exemplos de requisição prontos para copiar.",
    steps: [
      'Gere ou copie uma chave de API na tela "Chaves de API" antes de testar os exemplos.',
      'Use o botão "Copiar" em cada bloco de código para copiar o comando de exemplo.',
      'A página separa os endpoints de Mensagens e Modelos de mensagem. Nos envios de mensagem, informe uma Idempotency-Key para evitar duplicidade em retries.',
      'Para o contrato completo de todos os endpoints, use o botão "Referência completa (Swagger)".',
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
                  <ListItemIcon sx={{ minWidth: 32, mt: "2px" }}>
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
            <Typography variant="h6">
              Ordem recomendada de configuração
            </Typography>
            <Typography color="text.secondary">
              Cada cadastro depende do anterior. Siga esta ordem na primeira
              configuração de um tenant:
            </Typography>
            <List dense disablePadding>
              {[
                "Tenants — crie o tenant que vai usar o Hub.",
                "Aplicações — vincule a aplicação consumidora ao tenant.",
                "Contas WhatsApp — registre a WABA da Meta para o tenant.",
                "Números — registre os números de telefone dessa conta.",
                "Aplicações — vincule os números que cada aplicação poderá usar.",
                "Modelos de mensagem — cadastre e publique os modelos que serão enviados.",
                "Mensagens — envie mensagens e acompanhe a linha do tempo de entrega.",
                "Chaves de API — gere uma chave apenas se outra aplicação for integrar com o Hub via API.",
              ].map((step, index) => (
                <ListItem key={step} disableGutters alignItems="flex-start">
                  <ListItemIcon sx={{ minWidth: 32, mt: "2px" }}>
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
            <Alert
              severity="info"
              icon={<AdminPanelSettingsOutlined fontSize="small" />}
            >
              Todas as telas de administração exigem login com um usuário que
              tenha papel administrativo, inclusive Mensagens e modelos de
              mensagem. A chave de API de aplicação (wh_live_...) só é
              necessária para integrações externas que chamam a API diretamente
              — veja "Documentação da API".
            </Alert>
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={1.5}>
        <Typography variant="h6">
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            component="span"
          >
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
