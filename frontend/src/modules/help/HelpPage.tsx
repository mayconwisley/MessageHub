import { ExpandMoreOutlined } from '@mui/icons-material';
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
    icon: <DashboardOutlined />,
    title: 'Visão geral',
    purpose: 'Primeira tela após o login. Apenas orienta sobre as três grandes áreas do console: Configuração, Mensagens e Operação. Não possui listas nem formulários.',
    steps: [],
  },
  {
    icon: <AccountTreeOutlined />,
    title: 'Tenants',
    purpose: 'Cadastra os tenants (os clientes/organizações que usam o Hub). É o primeiro cadastro do fluxo — tudo o mais depende de um tenant existir.',
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
    purpose: 'Vincula aplicações consumidoras (as integrações que vão enviar mensagens) a um tenant, e configura o webhook que recebe atualizações de status de mensagem.',
    steps: [
      'Selecione um tenant em "Filtrar por tenant" para exibir a lista de aplicações — sem isso a lista não aparece.',
      'Clique em "Criar aplicação", escolha o "Tenant" e informe o "Nome da aplicação" (mínimo 2 caracteres).',
      'Para configurar o webhook, clique em "Configurar webhook", informe o "ID da aplicação" e a "URL do webhook (https, vazio para remover)".',
    ],
    notes: [
      { severity: 'info', text: 'O ID da aplicação não é escolhido por autocomplete no diálogo de webhook — copie-o na tela de criação ou na listagem antes de configurar o webhook.' },
    ],
  },
  {
    icon: <SmartToyOutlined />,
    title: 'Contas WhatsApp',
    purpose: 'Registra a WhatsApp Business Account (WABA) de um tenant na Meta e define de onde vêm as credenciais usadas para operar essa conta.',
    steps: [
      'Selecione um tenant em "Filtrar por tenant" (e, opcionalmente, um "Status") para ver as contas cadastradas.',
      'Clique em "Registrar conta", escolha o "Tenant", informe o "WABA ID" e a "Origem da credencial" (Padrão ou Tenant).',
      'Se a origem for "Tenant", preencha também "Access token (somente origem tenant)" e, se aplicável, "App secret (opcional)".',
      'Clique em "Detalhes" em qualquer linha para consultar os dados da conta.',
    ],
    notes: [
      { severity: 'info', text: 'Origem "Padrão" usa as credenciais da própria plataforma; origem "Tenant" usa o token informado pelo próprio tenant, que é armazenado de forma cifrada.' },
    ],
  },
  {
    icon: <PhoneOutlined />,
    title: 'Números',
    purpose: 'Registra um número de telefone da Meta vinculado a uma conta WhatsApp já cadastrada.',
    steps: [
      'Selecione um tenant em "Filtrar por tenant" (e, opcionalmente, um "Status") para ver os números cadastrados.',
      'Clique em "Registrar número" e escolha o "Tenant" — isso habilita o campo "Conta WhatsApp".',
      'Escolha a "Conta WhatsApp" e informe o "Phone Number ID (Meta)" e o "Número de exibição" (ex.: +5511999999999).',
    ],
    notes: [
      { severity: 'warning', text: 'É preciso ter uma conta WhatsApp cadastrada para esse tenant antes de registrar um número — sem isso, o campo "Conta WhatsApp" mostra "Nenhuma conta encontrada".' },
    ],
  },
  {
    icon: <VpnKeyOutlined />,
    title: 'API keys',
    purpose: 'Gera e revoga as chaves usadas por outras aplicações (integrações externas) para consumir a API de mensagens e templates. O próprio console não usa essas chaves — as telas de Mensagens e Templates operam com a sua sessão administrativa.',
    steps: [
      'Selecione "Filtrar por tenant" e depois "Filtrar por aplicação" para ver as chaves de uma aplicação.',
      'Clique em "Gerar API key", escolha "Tenant" e "Aplicação", o "Tipo" (Plataforma ou Tenant) e, se quiser, uma data em "Expira em (opcional)".',
      'Copie o valor completo da chave exibido no alerta imediatamente após a criação.',
      'Para desativar uma chave, clique em "Revogar" na linha correspondente — chaves já revogadas não podem ser revogadas de novo.',
    ],
    notes: [
      { severity: 'warning', text: 'A chave completa (wh_live_...) só aparece uma única vez, no momento em que é criada. Depois disso, a listagem mostra apenas o "Prefixo" — a chave não pode ser recuperada.' },
    ],
  },
  {
    icon: <PeopleOutlined />,
    title: 'Usuários',
    purpose: 'Cria usuários administrativos que poderão fazer login no console, opcionalmente vinculados a um tenant.',
    steps: [
      'Clique em "Criar usuário" e informe "Nome", "E-mail" e "Senha" (mínimo 12 caracteres).',
      'Escolha o "Papel": Administrador da plataforma, Administrador do tenant ou Operador.',
      'Se o papel escolhido não for "Administrador da plataforma", selecione também o "Tenant" — o campo aparece automaticamente e é obrigatório para papéis não globais.',
    ],
    notes: [
      { severity: 'info', text: 'Esta tela ainda não lista os usuários já criados — apenas permite criar novos.' },
    ],
  },
  {
    icon: <ChatOutlined />,
    title: 'Mensagens',
    purpose: 'Envia mensagens de texto avulsas a partir de um número cadastrado e acompanha o status do processamento e da entrega.',
    steps: [
      'Selecione "Tenant" e "Aplicação" no topo da tela — esses filtros definem de onde as mensagens são listadas e em nome de qual aplicação uma nova mensagem é enviada. Quando só existe uma opção, ela é selecionada automaticamente.',
      'Para consultar uma mensagem específica, informe o "ID da mensagem" e clique em "Consultar status".',
      'Use o filtro "Status" para navegar pela lista (Pendente, Processando, Enviada, Entregue, Lida, Falhou, Repetindo).',
      'Clique em "Enviar mensagem", escolha o número de origem, informe o "Destinatário" (ex.: +5511999999999) e o texto em "Mensagem" (até 4096 caracteres).',
      'Clique em "Tentativas" em qualquer linha para ver o histórico de tentativas de entrega daquela mensagem.',
    ],
    notes: [
      { severity: 'info', text: 'O status muda automaticamente conforme o processamento avança (Pendente → Processando → Enviada/Entregue/Lida, ou Falhou/Repetindo em caso de erro). Use "Consultar status" para acompanhar a evolução.' },
    ],
  },
  {
    icon: <SettingsOutlined />,
    title: 'Templates',
    purpose: 'Cadastra, edita, sincroniza e publica os templates de mensagem (modelos pré-aprovados pela Meta) de uma conta WhatsApp.',
    steps: [
      'Selecione "Filtrar por tenant" e depois "Filtrar por conta WhatsApp" para ver os templates dessa conta. Refine com os filtros "Status" e "Categoria" se necessário.',
      'Use "Sincronizar com Meta" para atualizar o status dos templates a partir da Meta, ou "Publicar pendentes" para reenviar os que ainda estão como rascunho.',
      'Clique em "Criar template" e informe Tenant, Conta WhatsApp, Nome, Idioma, Categoria e o "Texto do corpo".',
      'Use "Editar" em uma linha para alterar Categoria e Texto do corpo (nome, idioma e conta não podem mais ser alterados), ou "Excluir" para remover o template.',
    ],
    notes: [
      { severity: 'warning', text: 'O status de aprovação (Rascunho, Pendente, Aprovado, Rejeitado, Pausado, Desativado) é definido pela Meta e pode mudar sem ação do usuário — sincronize periodicamente para manter o console atualizado.' },
    ],
  },
  {
    icon: <IntegrationInstructionsOutlined />,
    title: 'Documentação da API',
    purpose: 'Referência de endpoints para times que vão integrar sistemas externos ao Hub via API (envio de mensagens e gestão de templates), com exemplos de requisição prontos para copiar.',
    steps: [
      'Gere ou copie uma API key na tela "API keys" antes de testar os exemplos.',
      'Use o botão "Copiar" em cada bloco de código para copiar o comando de exemplo.',
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
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{section.title}</Typography>
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
                    <Chip label={index + 1} size="small" sx={{ minWidth: 24, height: 24, fontWeight: 700 }} />
                  </ListItemIcon>
                  <ListItemText primary={step} />
                </ListItem>
              ))}
            </List>
          )}
          {section.notes?.map((note) => (
            <Alert key={note.text} severity={note.severity}>{note.text}</Alert>
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
        description="Como usar o console do Message Hub para configurar tenants, contas WhatsApp e enviar mensagens."
      />

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={1.5}>
            <Typography variant="h6">Ordem recomendada de configuração</Typography>
            <Typography color="text.secondary">
              Cada cadastro depende do anterior. Siga esta ordem na primeira configuração de um tenant:
            </Typography>
            <List dense disablePadding>
              {[
                'Tenants — crie o tenant que vai usar o Hub.',
                'Aplicações — vincule a aplicação consumidora ao tenant.',
                'Contas WhatsApp — registre a WABA da Meta para o tenant.',
                'Números — registre os números de telefone dessa conta.',
                'Templates — cadastre e publique os modelos de mensagem, se for enviar templates.',
                'Mensagens — envie mensagens e acompanhe o status de entrega.',
                'API keys — gere uma chave apenas se outra aplicação for integrar com o Hub via API.',
              ].map((step, index) => (
                <ListItem key={step} disableGutters alignItems="flex-start">
                  <ListItemIcon sx={{ minWidth: 32, mt: '2px' }}>
                    <Chip label={index + 1} size="small" color="primary" sx={{ minWidth: 24, height: 24, fontWeight: 700 }} />
                  </ListItemIcon>
                  <ListItemText primary={step} />
                </ListItem>
              ))}
            </List>
            <Divider />
            <Alert severity="info" icon={<AdminPanelSettingsOutlined fontSize="small" />}>
              Todas as telas de administração exigem login com um usuário que tenha papel administrativo, inclusive
              Mensagens e Templates. A API key de aplicação (wh_live_...) só é necessária para integrações externas
              que chamam a API diretamente — veja "Documentação da API".
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
