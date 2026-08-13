import {
  CheckCircleOutline,
  ErrorOutline,
  HourglassEmpty,
  MarkEmailRead,
  Schedule,
  Send,
  Sync,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Chip,
  Divider,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { FormDialog } from "../../components/shared/FormDialog";
import type { Message, MessageAttempt, MessageTimelineEvent } from "./messages.api";

type TimelineColor = "success" | "error" | "warning" | "info" | "default";

interface TimelineEvent {
  id: string;
  title: string;
  description: string;
  occurredAt: string | null;
  color: TimelineColor;
  icon: typeof Schedule;
  errorCode?: string | null;
}

const statusDetails: Record<
  string,
  Pick<TimelineEvent, "title" | "description" | "color" | "icon">
> = {
  PENDING: {
    title: "Aguardando processamento",
    description: "A mensagem foi registrada e aguarda consumo pela fila.",
    color: "warning",
    icon: HourglassEmpty,
  },
  PROCESSING: {
    title: "Processando envio",
    description: "O worker iniciou o processamento da mensagem.",
    color: "info",
    icon: Sync,
  },
  SENT: {
    title: "Enviada",
    description: "O provedor aceitou a mensagem para entrega.",
    color: "info",
    icon: Send,
  },
  DELIVERED: {
    title: "Entregue",
    description: "A mensagem foi entregue ao destinatário.",
    color: "success",
    icon: CheckCircleOutline,
  },
  READ: {
    title: "Lida",
    description: "O destinatário confirmou a leitura da mensagem.",
    color: "success",
    icon: MarkEmailRead,
  },
  FAILED: {
    title: "Falha no envio",
    description: "O envio não foi concluído pelo provedor.",
    color: "error",
    icon: ErrorOutline,
  },
  RETRY: {
    title: "Novo envio agendado",
    description: "Uma nova tentativa será feita conforme a política de retry.",
    color: "warning",
    icon: Sync,
  },
};

function formatDateTime(value: string | null): string {
  return value ? new Date(value).toLocaleString("pt-BR") : "Horário não informado";
}

function buildEvents(
  message: Message,
  attempts: MessageAttempt[],
  persistedEvents?: MessageTimelineEvent[],
): TimelineEvent[] {
  if (persistedEvents?.length) {
    return persistedEvents.map((event) => {
      const detail = statusDetails[event.status] ?? {
        title: event.eventType.replaceAll("_", " "),
        description: "Evento operacional persistido pelo Message Hub.",
        color: "info" as TimelineColor,
        icon: Schedule,
      };
      return {
        id: event.id,
        ...detail,
        title: event.eventType.replaceAll("_", " "),
        description: event.errorMessage ?? detail.description,
        occurredAt: event.occurredAt,
        errorCode: event.errorCode,
      };
    });
  }
  const events: TimelineEvent[] = [
    {
      id: "created",
      title: "Mensagem criada",
      description: "Mensagem registrada e enviada para a fila de processamento.",
      occurredAt: message.createdAt,
      color: "info",
      icon: Schedule,
    },
  ];

  attempts.forEach((attempt) => {
    if (attempt.status === "SUCCEEDED") {
      events.push({
        id: attempt.id,
        title: `Tentativa ${attempt.attemptNumber} concluída`,
        description: "O provedor aceitou a mensagem para entrega.",
        occurredAt: attempt.occurredAt,
        color: "success",
        icon: Send,
      });
      return;
    }

    events.push({
      id: attempt.id,
      title: `Tentativa ${attempt.attemptNumber} falhou`,
      description: attempt.errorMessage ?? "O provedor não concluiu o envio.",
      occurredAt: attempt.occurredAt,
      color: "error",
      icon: ErrorOutline,
      errorCode: attempt.errorCode,
    });
  });

  const status = statusDetails[message.status];
  const hasEquivalentAttempt =
    message.status === "SENT" && attempts.some((attempt) => attempt.status === "SUCCEEDED");
  const hasEquivalentFailure =
    message.status === "FAILED" && attempts.some((attempt) => attempt.status === "FAILED");

  if (message.status === "READ") {
    events.push({
      id: "delivered-before-read",
      title: "Entregue",
      description: "A entrega ocorreu antes da confirmação de leitura.",
      occurredAt: null,
      color: "success",
      icon: CheckCircleOutline,
    });
  }

  if (status && !hasEquivalentAttempt && !hasEquivalentFailure) {
    events.push({
      id: `status-${message.status}-${message.updatedAt}`,
      ...status,
      description:
        message.status === "FAILED" && message.lastError?.message
          ? message.lastError.message
          : status.description,
      occurredAt: message.updatedAt,
      errorCode: message.status === "FAILED" ? message.lastError?.code : undefined,
    });
  }

  return events;
}

export function MessageTimelineDialog({
  open,
  message,
  attempts,
  timeline,
  isLoading,
  error,
  onClose,
}: {
  open: boolean;
  message: Message | null;
  attempts: MessageAttempt[] | undefined;
  timeline: MessageTimelineEvent[] | undefined;
  isLoading: boolean;
  error: Error | null;
  onClose: () => void;
}) {
  const events = message ? buildEvents(message, attempts ?? [], timeline) : [];

  return (
    <FormDialog open={open} onClose={onClose} title="Linha do tempo da mensagem" maxWidth="md">
      <Stack spacing={2} sx={{ mt: 1 }}>
        {isLoading && Array.from({ length: 4 }, (_, index) => <Skeleton key={index} height={58} />)}
        {error && <Alert severity="error">Não foi possível carregar o histórico da mensagem.</Alert>}
        {!isLoading && !error && message && (
          <>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={0.5}>
                <Typography variant="subtitle2" color="text.secondary">Destinatário</Typography>
                <Typography fontWeight={700}>{message.to}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                  {message.content}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ pt: 0.5 }}>
                  <Chip label={statusDetails[message.status]?.title ?? message.status} size="small" />
                  <Chip label={`${message.attemptCount} tentativa(s)`} size="small" variant="outlined" />
                </Stack>
              </Stack>
            </Paper>
            <Typography variant="subtitle1" fontWeight={700}>Eventos</Typography>
            <Stack>
              {events.map((event, index) => {
                const Icon = event.icon;
                return (
                  <Stack key={event.id} direction="row" spacing={1.5} sx={{ alignItems: "stretch" }}>
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: 30 }}>
                      <Box sx={{ display: "grid", placeItems: "center", width: 30, height: 30, borderRadius: "50%", border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
                        <Icon color={event.color === "default" ? "action" : event.color} fontSize="small" />
                      </Box>
                      {index < events.length - 1 && <Box sx={{ flex: 1, borderLeft: "1px solid", borderColor: "divider" }} />}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0, pb: index < events.length - 1 ? 2 : 0 }}>
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={0.75} sx={{ alignItems: { xs: "flex-start", sm: "center" } }}>
                        <Typography variant="subtitle2" fontWeight={700}>{event.title}</Typography>
                        <Chip label={formatDateTime(event.occurredAt)} size="small" color={event.color} variant="outlined" />
                      </Stack>
                      <Typography variant="body2" color="text.secondary">{event.description}</Typography>
                      {event.errorCode && <Typography variant="caption" color="error">Código: {event.errorCode}</Typography>}
                    </Box>
                  </Stack>
                );
              })}
            </Stack>
            <Divider />
            <Typography variant="caption" color="text.secondary">
              A linha do tempo é persistida pelo Hub; ela registra aceite, tentativas, retries e atualizações recebidas da Meta.
            </Typography>
          </>
        )}
      </Stack>
    </FormDialog>
  );
}
