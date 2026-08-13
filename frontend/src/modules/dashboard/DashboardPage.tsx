import {
  CheckCircleOutlineOutlined,
  ErrorOutlineOutlined,
  HubOutlined,
  InboxOutlined,
  PhoneIphoneOutlined,
  RefreshOutlined,
  ScheduleOutlined,
  SendOutlined,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Card,
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
import { PageHeader } from "../../components/ui/PageHeader";
import {
  dashboardApi,
  type DeliveryStatus,
  type MessageVolumePoint,
  type OperationalHealth,
  type RecentMessage,
  type ResourceSummary,
} from "./dashboard.api";

const numberFormatter = new Intl.NumberFormat("pt-BR");
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

function DashboardCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card sx={{ height: "100%", minHeight: 250 }}>
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
  if (query.isPending)
    return (
      <Skeleton variant="rounded" height={skeletonHeight} animation="wave" />
    );
  if (query.isError)
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
  return <>{children(query.data)}</>;
}

function ResourceSummaryCard() {
  const query = useQuery({
    queryKey: ["dashboard", "resource-summary"],
    queryFn: dashboardApi.getResourceSummary,
    staleTime: 30_000,
  });
  const items: Array<{
    key: keyof ResourceSummary;
    label: string;
    icon: ReactNode;
  }> = [
    { key: "tenants", label: "Tenants", icon: <HubOutlined /> },
    { key: "applications", label: "Aplicações", icon: <InboxOutlined /> },
    {
      key: "whatsAppAccounts",
      label: "Contas",
      icon: <CheckCircleOutlineOutlined />,
    },
    { key: "phoneNumbers", label: "Números", icon: <PhoneIphoneOutlined /> },
  ];
  return (
    <DashboardCard
      title="Recursos cadastrados"
      subtitle="Estrutura disponível para operação"
    >
      <QueryContent query={query} skeletonHeight={126}>
        {(data) => (
          <Grid container spacing={2}>
            {items.map((item) => (
              <Grid key={item.key} size={{ xs: 6, sm: 3 }}>
                <Stack spacing={0.5}>
                  <Box color="primary.main">{item.icon}</Box>
                  <Typography variant="h5" fontWeight={700}>
                    {numberFormatter.format(data[item.key])}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {item.label}
                  </Typography>
                </Stack>
              </Grid>
            ))}
          </Grid>
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
    staleTime: 30_000,
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
                valueFormatter: (value) =>
                  dateFormatter.format(new Date(`${value}T12:00:00`)),
              },
            ]}
            yAxis={[
              { valueFormatter: (value) => numberFormatter.format(value) },
            ]}
            series={[
              {
                data: data.map((item) => item.messages),
                area: true,
                color: theme.palette.primary.main,
                curve: "linear",
                valueFormatter: (value) =>
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

const statusLabels: Record<string, string> = {
  PENDING: "Pendente",
  PROCESSING: "Processando",
  SENT: "Enviada",
  DELIVERED: "Entregue",
  READ: "Lida",
  FAILED: "Falhou",
  RETRY: "Em nova tentativa",
};

function DeliveryStatusCard() {
  const theme = useTheme();
  const query = useQuery({
    queryKey: ["dashboard", "delivery-status"],
    queryFn: dashboardApi.getDeliveryStatus,
    staleTime: 30_000,
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
    <DashboardCard
      title="Status de entrega"
      subtitle="Distribuição dos últimos 30 dias"
    >
      <QueryContent query={query} skeletonHeight={220}>
        {(data: DeliveryStatus) =>
          data.total === 0 ? (
            <Stack
              height={220}
              alignItems="center"
              justifyContent="center"
              color="text.secondary"
            >
              <SendOutlined />
              <Typography variant="body2" mt={1}>
                Ainda não há mensagens no período.
              </Typography>
            </Stack>
          ) : (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              alignItems="center"
              justifyContent="space-between"
            >
              <PieChart
                height={210}
                width={220}
                hideLegend
                series={[
                  {
                    data: data.items.map((item, index) => ({
                      id: item.status,
                      value: item.total,
                      label: statusLabels[item.status] ?? item.status,
                      color: palette[index % palette.length],
                    })),
                    innerRadius: 56,
                    paddingAngle: 2,
                    cornerRadius: 4,
                  },
                ]}
              />
              <Stack spacing={1} width={{ xs: "100%", sm: 180 }}>
                {data.items.map((item, index) => (
                  <Stack
                    key={item.status}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    spacing={1}
                  >
                    <Stack direction="row" alignItems="center" spacing={0.75}>
                      <Box
                        width={8}
                        height={8}
                        borderRadius="50%"
                        bgcolor={palette[index % palette.length]}
                      />
                      <Typography variant="caption">
                        {statusLabels[item.status] ?? item.status}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" fontWeight={700}>
                      {numberFormatter.format(item.total)}
                    </Typography>
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

function OperationalHealthCard() {
  const theme = useTheme();
  const query = useQuery({
    queryKey: ["dashboard", "operational-health"],
    queryFn: dashboardApi.getOperationalHealth,
    staleTime: 30_000,
  });
  return (
    <DashboardCard
      title="Saúde operacional"
      subtitle="Fila, falhas e disponibilidade"
    >
      <QueryContent query={query} skeletonHeight={150}>
        {(data: OperationalHealth) => (
          <Stack spacing={2.25}>
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
                  inset={0}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Typography variant="body2" fontWeight={700}>
                    {data.successRate}%
                  </Typography>
                </Box>
              </Box>
              <Box>
                <Typography fontWeight={700}>Taxa de sucesso</Typography>
                <Typography variant="body2" color="text.secondary">
                  Mensagens concluídas sem falha
                </Typography>
              </Box>
            </Stack>
            <Divider />
            <Stack direction="row" justifyContent="space-between">
              <Metric
                label="Na fila"
                value={data.pendingMessages}
                color={theme.palette.warning.main}
              />
              <Metric
                label="Falhas em 24h"
                value={data.failedLast24Hours}
                color={theme.palette.error.main}
              />
              <Metric
                label="Números ativos"
                value={data.activePhoneNumbers}
                color={theme.palette.success.main}
              />
            </Stack>
          </Stack>
        )}
      </QueryContent>
    </DashboardCard>
  );
}

function Metric({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Box>
      <Typography variant="h6" color={color}>
        {numberFormatter.format(value)}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
    </Box>
  );
}

function RecentMessagesCard() {
  const query = useQuery({
    queryKey: ["dashboard", "recent-messages"],
    queryFn: dashboardApi.getRecentMessages,
    staleTime: 15_000,
  });
  return (
    <DashboardCard
      title="Atividade recente"
      subtitle="Últimas mensagens registradas"
    >
      <QueryContent query={query} skeletonHeight={270}>
        {(items: RecentMessage[]) =>
          items.length === 0 ? (
            <Stack
              height={250}
              alignItems="center"
              justifyContent="center"
              color="text.secondary"
            >
              <ScheduleOutlined />
              <Typography variant="body2" mt={1}>
                Nenhuma atividade recente.
              </Typography>
            </Stack>
          ) : (
            <List disablePadding>
              {items.map((item, index) => (
                <Box key={item.id}>
                  <ListItem
                    disableGutters
                    secondaryAction={
                      <Chip
                        size="small"
                        label={statusLabels[item.status] ?? item.status}
                        color={
                          item.status === "FAILED"
                            ? "error"
                            : item.status === "DELIVERED" ||
                                item.status === "READ"
                              ? "success"
                              : "default"
                        }
                        variant="outlined"
                      />
                    }
                  >
                    <ListItemText
                      primary={
                        <Typography variant="body2" fontWeight={600}>
                          •••• {item.recipientLastFour}
                        </Typography>
                      }
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

export function DashboardPage() {
  const theme = useTheme();
  return (
    <Stack spacing={3.5}>
      <PageHeader
        title="Console operacional"
        description="Acompanhe os indicadores do Message Hub em tempo real, sem expor credenciais da Meta."
      />
      <Box
        sx={{
          p: { xs: 2, md: 3 },
          borderRadius: 4,
          background: `linear-gradient(115deg, ${alpha(theme.palette.primary.main, 0.16)}, ${alpha(theme.palette.secondary.main, 0.06)})`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ sm: "center" }}
          spacing={1}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              p={1}
              borderRadius={2}
              bgcolor={alpha(theme.palette.primary.main, 0.18)}
              color="primary.main"
            >
              <CheckCircleOutlineOutlined />
            </Box>
            <Box>
              <Typography fontWeight={700}>Operação monitorada</Typography>
              <Typography variant="body2" color="text.secondary">
                Cada indicador é carregado de forma independente.
              </Typography>
            </Box>
          </Stack>
          <Tooltip title="Os dados são atualizados automaticamente a cada acesso">
            <Chip
              icon={<ScheduleOutlined />}
              label="Atualização independente"
              color="primary"
              variant="outlined"
            />
          </Tooltip>
        </Stack>
      </Box>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12 }}>
          <ResourceSummaryCard />
        </Grid>
        <Grid size={{ xs: 12, lg: 7 }}>
          <MessageVolumeCard />
        </Grid>
        <Grid size={{ xs: 12, lg: 5 }}>
          <DeliveryStatusCard />
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <OperationalHealthCard />
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <RecentMessagesCard />
        </Grid>
      </Grid>
    </Stack>
  );
}
