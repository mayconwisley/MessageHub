import {
  ApiOutlined,
  CheckCircleOutlineOutlined,
  HubOutlined,
  InboxOutlined,
  MonitorHeartOutlined,
  OpenInNewOutlined,
  PhoneIphoneOutlined,
  QueueOutlined,
  RefreshOutlined,
  RuleOutlined,
  ScheduleOutlined,
  SendOutlined,
  StorageOutlined,
  WarningAmberOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import { LineChart, PieChart } from "@mui/x-charts";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/ui/PageHeader";
import {
  dashboardApi,
  type DeliveryStatus,
  type MessageVolumePoint,
  type OperationalHealth,
  type RecentMessage,
  type ResourceSummary,
} from "./dashboard.api";

const REFRESH_INTERVAL_MS = 30_000;
const numberFormatter = new Intl.NumberFormat("pt-BR");
const percentageFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
});
const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});
const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const statusLabels: Record<string, string> = {
  PENDING: "Pendente",
  PROCESSING: "Processando",
  SENT: "Enviada",
  DELIVERED: "Entregue",
  READ: "Lida",
  FAILED: "Falhou",
  RETRY: "Em nova tentativa",
};

function DashboardCard({
  title,
  subtitle,
  action,
  children,
  minHeight = 250,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
  children: ReactNode;
  minHeight?: number;
}) {
  return (
    <Card sx={{ height: "100%", minHeight }}>
      <CardContent
        sx={{
          height: "100%",
          boxSizing: "border-box",
          p: 3,
          "&:last-child": { pb: 3 },
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          spacing={1}
          mb={2.5}
        >
          <Box>
            <Typography variant="h6">{title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
          {action}
        </Stack>
        {children}
      </CardContent>
    </Card>
  );
}

function QueryContent<T>({
  query,
  children,
  skeletonHeight = 160,
}: {
  query: UseQueryResult<T, Error>;
  children: (data: T) => ReactNode;
  skeletonHeight?: number;
}) {
  if (query.isPending) {
    return <Skeleton variant="rounded" height={skeletonHeight} animation="wave" />;
  }
  if (query.isError) {
    return (
      <Alert
        severity="error"
        action={
          <IconButton
            aria-label="Tentar novamente"
            color="inherit"
            size="small"
            onClick={() => void query.refetch()}
          >
            <RefreshOutlined fontSize="small" />
          </IconButton>
        }
      >
        Não foi possível carregar este indicador.
      </Alert>
    );
  }
  return <>{children(query.data)}</>;
}

function PlatformStatusCard() {
  const query = useQuery({
    queryKey: ["dashboard", "health"],
    queryFn: dashboardApi.health,
    refetchInterval: REFRESH_INTERVAL_MS,
    retry: false,
  });
  const isApiAvailable = query.data?.status === "ok";
  const components = [
    { label: "API", status: isApiAvailable ? "up" : "down", icon: <ApiOutlined /> },
    {
      label: "Banco de dados",
      status: query.data?.details.database?.status ?? "down",
      icon: <StorageOutlined />,
    },
    {
      label: "RabbitMQ",
      status: query.data?.details.rabbitmq?.status ?? "down",
      icon: <QueueOutlined />,
    },
  ];

  return (
    <DashboardCard
      title="Estado da plataforma"
      subtitle="Verificação automática a cada 30 segundos"
      minHeight={190}
      action={
        <Tooltip title="Atualizar agora">
          <IconButton aria-label="Atualizar estado da plataforma" onClick={() => void query.refetch()}>
            <RefreshOutlined />
          </IconButton>
        </Tooltip>
      }
    >
      <Grid container spacing={1.5}>
        {components.map((component) => {
          const isUp = component.status === "up";
          return (
            <Grid key={component.label} size={{ xs: 12, sm: 4 }}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ p: 1.25, border: "1px solid", borderColor: "divider", borderRadius: 2 }}
              >
                <Box color={isUp ? "success.main" : "error.main"}>{component.icon}</Box>
                <Box minWidth={0}>
                  <Typography variant="body2" fontWeight={700} noWrap>
                    {component.label}
                  </Typography>
                  <Chip
                    size="small"
                    color={isUp ? "success" : "error"}
                    label={isUp ? "Disponível" : "Indisponível"}
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Stack>
            </Grid>
          );
        })}
      </Grid>
      {!isApiAvailable && (
        <Typography variant="caption" color="error.main" display="block" mt={1.5}>
          A verificação de saúde não respondeu. Consulte os logs da API para o diagnóstico.
        </Typography>
      )}
    </DashboardCard>
  );
}

function AttentionCard() {
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: ["dashboard", "operational-health"],
    queryFn: dashboardApi.getOperationalHealth,
    refetchInterval: REFRESH_INTERVAL_MS,
  });
  const theme = useTheme();

  return (
    <DashboardCard
      title="Requer atenção"
      subtitle="Itens que podem afetar integrações em andamento"
      minHeight={190}
      action={<WarningAmberOutlined color="warning" />}
    >
      <QueryContent query={query} skeletonHeight={112}>
        {(data: OperationalHealth) => {
          const alerts = [
            {
              label: "Mensagens com falha nas últimas 24h",
              value: data.failedLast24Hours,
              color: "error.main",
              action: () => navigate("/messages"),
            },
            {
              label: "Mensagens aguardando processamento",
              value: data.pendingMessages,
              color: "warning.main",
              action: () => navigate("/messages"),
            },
          ].filter((item) => item.value > 0);

          return alerts.length === 0 ? (
            <Stack direction="row" spacing={1} alignItems="center" color="success.main" py={1.5}>
              <CheckCircleOutlineOutlined />
              <Box>
                <Typography fontWeight={700}>Nenhum alerta operacional ativo</Typography>
                <Typography variant="body2" color="text.secondary">
                  Não há falhas recentes ou mensagens paradas na fila.
                </Typography>
              </Box>
            </Stack>
          ) : (
            <Stack spacing={1}>
              {alerts.map((alert) => (
                <CardActionArea
                  key={alert.label}
                  onClick={alert.action}
                  sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider" }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between" p={1.2}>
                    <Typography variant="body2">{alert.label}</Typography>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Typography fontWeight={800} color={alert.color}>
                        {numberFormatter.format(alert.value)}
                      </Typography>
                      <OpenInNewOutlined fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                    </Stack>
                  </Stack>
                </CardActionArea>
              ))}
            </Stack>
          );
        }}
      </QueryContent>
    </DashboardCard>
  );
}

function DeliveryQualityCard() {
  const query = useQuery({
    queryKey: ["dashboard", "operational-health"],
    queryFn: dashboardApi.getOperationalHealth,
    refetchInterval: REFRESH_INTERVAL_MS,
  });
  return (
    <DashboardCard title="Qualidade de entrega" subtitle="Mensagens finalizadas no período recente" minHeight={190}>
      <QueryContent query={query} skeletonHeight={112}>
        {(data: OperationalHealth) => (
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box position="relative" display="inline-flex">
              <CircularProgress
                variant="determinate"
                value={data.successRate}
                size={76}
                thickness={5}
                color={data.successRate >= 95 ? "success" : "warning"}
              />
              <Box
                position="absolute"
                display="flex"
                alignItems="center"
                justifyContent="center"
                sx={{ inset: 0 }}
              >
                <Typography variant="body2" fontWeight={800}>
                  {percentageFormatter.format(data.successRate)}%
                </Typography>
              </Box>
            </Box>
            <Box>
              <Typography fontWeight={700}>Taxa de sucesso</Typography>
              <Typography variant="body2" color="text.secondary">
                Aceite do provedor e confirmações sem falha.
              </Typography>
              <Chip
                label={`${numberFormatter.format(data.activePhoneNumbers)} número(s) ativo(s)`}
                color="success"
                size="small"
                variant="outlined"
                sx={{ mt: 1 }}
              />
            </Box>
          </Stack>
        )}
      </QueryContent>
    </DashboardCard>
  );
}

function MessageVolumeCard() {
  const theme = useTheme();
  const query = useQuery({
    queryKey: ["dashboard", "message-volume"],
    queryFn: dashboardApi.getMessageVolume,
    refetchInterval: REFRESH_INTERVAL_MS,
  });
  return (
    <DashboardCard title="Volume de mensagens" subtitle="Últimos 14 dias">
      <QueryContent query={query} skeletonHeight={220}>
        {(data: MessageVolumePoint[]) => (
          <LineChart
            height={220}
            hideLegend
            grid={{ horizontal: true }}
            xAxis={[
              {
                data: data.map((item) => item.date),
                scaleType: "point",
                valueFormatter: (value) => dateFormatter.format(new Date(`${value}T12:00:00`)),
              },
            ]}
            yAxis={[{ valueFormatter: (value: number) => numberFormatter.format(value) }]}
            series={[
              {
                data: data.map((item) => item.messages),
                area: true,
                color: theme.palette.primary.main,
                curve: "linear",
                valueFormatter: (value: number | null) =>
                  `${numberFormatter.format(value ?? 0)} mensagens`,
              },
            ]}
            margin={{ top: 12, right: 12, bottom: 24, left: 40 }}
          />
        )}
      </QueryContent>
    </DashboardCard>
  );
}

function DeliveryStatusCard() {
  const theme = useTheme();
  const query = useQuery({
    queryKey: ["dashboard", "delivery-status"],
    queryFn: dashboardApi.getDeliveryStatus,
    refetchInterval: REFRESH_INTERVAL_MS,
  });
  const palette = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    "#4fc3f7",
    "#ffb74d",
    theme.palette.error.main,
    "#9575cd",
    "#90a4ae",
  ];
  return (
    <DashboardCard title="Funil de entrega" subtitle="Distribuição dos últimos 30 dias">
      <QueryContent query={query} skeletonHeight={220}>
        {(data: DeliveryStatus) =>
          data.total === 0 ? (
            <Stack height={220} alignItems="center" justifyContent="center" color="text.secondary">
              <SendOutlined />
              <Typography variant="body2" mt={1}>Ainda não há mensagens no período.</Typography>
            </Stack>
          ) : (
            <Stack direction={{ xs: "column", sm: "row" }} alignItems="center" justifyContent="space-between">
              <PieChart
                height={210}
                width={220}
                hideLegend
                series={[{ data: data.items.map((item, index) => ({ id: item.status, value: item.total, label: statusLabels[item.status] ?? item.status, color: palette[index % palette.length] })), innerRadius: 56, paddingAngle: 2, cornerRadius: 4 }]}
              />
              <Stack spacing={1} width={{ xs: "100%", sm: 180 }}>
                {data.items.map((item, index) => (
                  <Stack key={item.status} direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                      <Box width={8} height={8} borderRadius="50%" bgcolor={palette[index % palette.length]} />
                      <Typography variant="caption">{statusLabels[item.status] ?? item.status}</Typography>
                    </Stack>
                    <Typography variant="caption" fontWeight={700}>{numberFormatter.format(item.total)}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          )
        }
      </QueryContent>
    </DashboardCard>
  );
}

function RecentMessagesCard() {
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: ["dashboard", "recent-messages"],
    queryFn: dashboardApi.getRecentMessages,
    refetchInterval: REFRESH_INTERVAL_MS,
  });
  return (
    <DashboardCard
      title="Atividade técnica recente"
      subtitle="Últimas mensagens processadas pela plataforma"
      action={<Button size="small" endIcon={<OpenInNewOutlined />} onClick={() => navigate("/messages")}>Mensagens</Button>}
    >
      <QueryContent query={query} skeletonHeight={270}>
        {(items: RecentMessage[]) =>
          items.length === 0 ? (
            <Stack height={250} alignItems="center" justifyContent="center" color="text.secondary">
              <ScheduleOutlined />
              <Typography variant="body2" mt={1}>Nenhuma atividade recente.</Typography>
            </Stack>
          ) : (
            <List disablePadding>
              {items.map((item, index) => (
                <Box key={item.id}>
                  <ListItem
                    disableGutters
                    secondaryAction={<Chip size="small" label={statusLabels[item.status] ?? item.status} color={item.status === "FAILED" ? "error" : item.status === "DELIVERED" || item.status === "READ" ? "success" : "default"} variant="outlined" />}
                  >
                    <ListItemText
                      primary={<Typography variant="body2" fontWeight={600}>•••• {item.recipientLastFour}</Typography>}
                      secondary={`${item.type} · ${dateTimeFormatter.format(new Date(item.createdAt))}`}
                    />
                  </ListItem>
                  {index < items.length - 1 && <Divider component="li" />}
                </Box>
              ))}
            </List>
          )
        }
      </QueryContent>
    </DashboardCard>
  );
}

function ResourceSummaryCard() {
  const query = useQuery({
    queryKey: ["dashboard", "resource-summary"],
    queryFn: dashboardApi.getResourceSummary,
    refetchInterval: REFRESH_INTERVAL_MS,
  });
  const items: Array<{ key: keyof ResourceSummary; label: string; icon: ReactNode }> = [
    { key: "tenants", label: "Tenants", icon: <HubOutlined /> },
    { key: "applications", label: "Aplicações", icon: <InboxOutlined /> },
    { key: "whatsAppAccounts", label: "Contas", icon: <CheckCircleOutlineOutlined /> },
    { key: "phoneNumbers", label: "Números", icon: <PhoneIphoneOutlined /> },
  ];
  return (
    <DashboardCard title="Base integrada" subtitle="Recursos registrados na plataforma" minHeight={164}>
      <QueryContent query={query} skeletonHeight={100}>
        {(data) => (
          <Grid container spacing={2}>
            {items.map((item) => (
              <Grid key={item.key} size={{ xs: 6, sm: 3 }}>
                <Stack spacing={0.5}>
                  <Box color="primary.main">{item.icon}</Box>
                  <Typography variant="h5" fontWeight={700}>{numberFormatter.format(data[item.key])}</Typography>
                  <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                </Stack>
              </Grid>
            ))}
          </Grid>
        )}
      </QueryContent>
    </DashboardCard>
  );
}

function QuickActions() {
  const navigate = useNavigate();
  const actions = [
    { label: "Consultar mensagens", description: "Status, tentativas e erros do provedor", icon: <RuleOutlined />, path: "/messages" },
    { label: "Gerenciar aplicações", description: "Chaves, callbacks e números vinculados", icon: <InboxOutlined />, path: "/applications" },
    { label: "Documentação da API", description: "Contratos e exemplos de integração", icon: <ApiOutlined />, path: "/api-docs" },
    { label: "Monitor de integrações", description: "Quotas, credenciais, números e entrega", icon: <MonitorHeartOutlined />, path: "/monitoring" },
    { label: "Alertas de engenharia", description: "DLQs e falhas persistentes", icon: <WarningAmberOutlined />, path: "/engineering-alerts" },
    { label: "Ambiente sandbox", description: "Simulador de provider e webhooks", icon: <RuleOutlined />, path: "/sandbox" },
  ];
  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
      {actions.map((action) => (
        <CardActionArea key={action.path} onClick={() => navigate(action.path)} sx={{ flex: 1, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <Stack direction="row" spacing={1.25} alignItems="center" p={1.5}>
            <Box color="primary.main">{action.icon}</Box>
            <Box minWidth={0} flexGrow={1}>
              <Typography variant="subtitle2">{action.label}</Typography>
              <Typography variant="caption" color="text.secondary">{action.description}</Typography>
            </Box>
            <OpenInNewOutlined fontSize="small" color="action" />
          </Stack>
        </CardActionArea>
      ))}
    </Stack>
  );
}

export function DashboardPage() {
  const theme = useTheme();
  return (
    <Stack spacing={3.5}>
      <PageHeader
        title="Operação da plataforma"
        description="Monitore a disponibilidade, o processamento e a qualidade das integrações do Message Hub."
      />
      <Box
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 4,
          background: `linear-gradient(115deg, ${alpha(theme.palette.primary.main, 0.16)}, ${alpha(theme.palette.secondary.main, 0.06)})`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} spacing={1}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box p={1} borderRadius={2} bgcolor={alpha(theme.palette.primary.main, 0.18)} color="primary.main"><ApiOutlined /></Box>
            <Box>
              <Typography fontWeight={700}>Painel para integração e sustentação</Typography>
              <Typography variant="body2" color="text.secondary">Indicadores técnicos consolidados e atualizados automaticamente.</Typography>
            </Box>
          </Stack>
          <Chip icon={<ScheduleOutlined />} label="Atualização a cada 30 s" color="primary" variant="outlined" />
        </Stack>
      </Box>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, lg: 5 }}><PlatformStatusCard /></Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3.5 }}><AttentionCard /></Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3.5 }}><DeliveryQualityCard /></Grid>
        <Grid size={{ xs: 12 }}><QuickActions /></Grid>
        <Grid size={{ xs: 12, lg: 7 }}><MessageVolumeCard /></Grid>
        <Grid size={{ xs: 12, lg: 5 }}><DeliveryStatusCard /></Grid>
        <Grid size={{ xs: 12, md: 7 }}><RecentMessagesCard /></Grid>
        <Grid size={{ xs: 12, md: 5 }}><ResourceSummaryCard /></Grid>
      </Grid>
    </Stack>
  );
}
