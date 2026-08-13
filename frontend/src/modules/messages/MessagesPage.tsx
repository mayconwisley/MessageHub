import { zodResolver } from '@hookform/resolvers/zod';
import { History } from '@mui/icons-material';
import {
  Alert,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  TextField,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { AsyncState } from '../../components/shared/AsyncState';
import { FormDialog } from '../../components/shared/FormDialog';
import { PaginatedTable } from '../../components/shared/PaginatedTable';
import { TableActionsMenu } from '../../components/shared/TableActionsMenu';
import { ApplicationAutocomplete } from '../../components/shared/ApplicationAutocomplete';
import { PhoneNumberAutocomplete } from '../../components/shared/PhoneNumberAutocomplete';
import { TenantAutocomplete } from '../../components/shared/TenantAutocomplete';
import { PageHeader } from '../../components/ui/PageHeader';
import { usePagination } from '../../hooks/usePagination';
import { applicationsApi } from '../applications/applications.api';
import { tenantsApi } from '../tenants/tenants.api';
import { messagesApi, type Message } from './messages.api';
import { ApiError } from '../../services/http-client';
import { toPresentationValue } from '../../lib/presentation';
import { MessageTimelineDialog } from './MessageTimelineDialog';

const schema = z.object({
  phoneNumberId: z.string().uuid('Informe um UUID válido.'),
  to: z.string().min(8, 'Informe um número de telefone válido.'),
  content: z
    .string()
    .min(1, 'Informe o conteúdo da mensagem.')
    .max(4096, 'A mensagem deve ter no máximo 4096 caracteres.'),
});
type FormData = z.infer<typeof schema>;

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  PROCESSING: 'Processando',
  SENT: 'Enviada',
  DELIVERED: 'Entregue',
  READ: 'Lida',
  FAILED: 'Falhou',
  RETRY: 'Repetindo',
};

export function MessagesPage() {
  const { page, pageSize, setPage, setPageSize } = usePagination();
  const [tenantId, setTenantId] = useState('');
  const [applicationId, setApplicationId] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [timelineMessageId, setTimelineMessageId] = useState<string | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    severity: 'success' | 'error';
    message: string;
  } | null>(null);
  const client = useQueryClient();
  const form = useForm<FormData>({ resolver: zodResolver(schema) });
  const send = useMutation({
    mutationFn: (data: FormData) => messagesApi.send({ ...data, applicationId }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['messages', applicationId] });
      setFeedback({
        severity: 'success',
        message: 'Mensagem enfileirada para envio. Acompanhe o status na lista abaixo.',
      });
    },
    onError: (error) => {
      const requestId =
        error instanceof ApiError && error.requestId ? ` Protocolo: ${error.requestId}.` : '';
      setFeedback({
        severity: 'error',
        message: `Não foi possível enviar a mensagem. ${error.message}${requestId}`,
      });
    },
  });

  const validTenantId = z.string().uuid().safeParse(tenantId).success;
  const validApplicationId = z.string().uuid().safeParse(applicationId).success;

  const tenants = useQuery({
    queryKey: ['tenants-select'],
    queryFn: () => tenantsApi.list({ page: 1, pageSize: 100 }),
    staleTime: 60_000,
  });
  const applications = useQuery({
    queryKey: ['applications-select', tenantId],
    queryFn: () => applicationsApi.list({ tenantId, page: 1, pageSize: 100 }),
    enabled: validTenantId,
    staleTime: 60_000,
  });
  const health = useQuery({
    queryKey: ['message-hub-health'],
    queryFn: messagesApi.health,
    refetchInterval: 15_000,
    retry: false,
  });

  // Reduz cliques: seleciona automaticamente quando só existe uma opção disponível.
  useEffect(() => {
    if (!tenantId && tenants.data?.items.length === 1) {
      setTenantId(tenants.data.items[0].id);
    }
  }, [tenantId, tenants.data]);
  useEffect(() => {
    if (validTenantId && !applicationId && applications.data?.items.length === 1) {
      setApplicationId(applications.data.items[0].id);
    }
  }, [validTenantId, applicationId, applications.data]);

  const list = useQuery({
    queryKey: ['messages', applicationId, page, pageSize, status, search],
    queryFn: () =>
      messagesApi.list({
        applicationId,
        page,
        pageSize,
        status: status || undefined,
        search: search || undefined,
      }),
    enabled: validApplicationId,
  });
  const details = useQuery({
    queryKey: ['message', timelineMessageId, applicationId],
    queryFn: () => messagesApi.get(timelineMessageId as string, applicationId),
    enabled: !!timelineMessageId && validApplicationId,
  });
  const attempts = useQuery({
    queryKey: ['message-attempts', timelineMessageId, applicationId],
    queryFn: () => messagesApi.listAttempts(timelineMessageId as string, applicationId),
    enabled: !!timelineMessageId && validApplicationId,
  });
  const timeline = useQuery({
    queryKey: ['message-timeline', timelineMessageId, applicationId],
    queryFn: () => messagesApi.listTimeline(timelineMessageId as string, applicationId),
    enabled: !!timelineMessageId && validApplicationId,
  });

  const openSend = () => {
    form.reset();
    send.reset();
    setSendOpen(true);
  };
  const closeSend = () => setSendOpen(false);

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Mensagens"
        description="Envie uma mensagem de texto e acompanhe o estado assíncrono do processamento."
        action={
          <Button
            variant="contained"
            onClick={openSend}
            disabled={!validApplicationId}
            sx={{ mt: 2 }}
          >
            Enviar mensagem
          </Button>
        }
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TenantAutocomplete
          label="Tenant"
          value={tenantId}
          onChange={(id) => {
            setTenantId(id);
            setApplicationId('');
            setPage(1);
          }}
          sx={{ maxWidth: 320, flexGrow: 1 }}
        />
        <ApplicationAutocomplete
          tenantId={tenantId}
          value={applicationId}
          onChange={(id) => {
            setApplicationId(id);
            setPage(1);
          }}
          sx={{ maxWidth: 320, flexGrow: 1 }}
        />
      </Stack>
      {health.data?.details.rabbitmq?.status === 'down' && (
        <Alert severity="warning">
          A fila RabbitMQ está indisponível. As mensagens continuarão como pendentes até a conexão
          ser restabelecida. Consulte <code>/health</code> para o diagnóstico técnico.
        </Alert>
      )}
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <FormControl size="small" sx={{ width: 220 }}>
            <InputLabel id="message-status-filter">Status</InputLabel>
            <Select
              labelId="message-status-filter"
              label="Status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">Todos</MenuItem>
              {['PENDING', 'PROCESSING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'RETRY'].map(
                (value) => (
                  <MenuItem key={value} value={value}>
                    {statusLabels[value] ?? value}
                  </MenuItem>
                ),
              )}
            </Select>
          </FormControl>
          <TextField
            size="small"
            label="Rastrear mensagem"
            placeholder="ID, provider ID, request ID, chave ou destinatário"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            sx={{ minWidth: { sm: 360 }, flexGrow: 1 }}
          />
        </Stack>
        <AsyncState
          isLoading={validApplicationId && list.isLoading}
          error={list.error}
          emptyMessage={
            validApplicationId
              ? undefined
              : 'Selecione um tenant e uma aplicação para listar as mensagens.'
          }
        >
          <PaginatedTable<Message>
            columns={[
              { key: 'to', label: 'Destinatário' },
              {
                key: 'type',
                label: 'Tipo',
                render: (row) => toPresentationValue('type', row.type),
              },
              {
                key: 'status',
                label: 'Status',
                render: (row) => (
                  <Chip label={toPresentationValue('status', row.status)} size="small" />
                ),
              },
              { key: 'attemptCount', label: 'Tentativas' },
              {
                key: 'createdAt',
                label: 'Criado em',
                render: (row) => new Date(row.createdAt).toLocaleString('pt-BR'),
              },
            ]}
            rows={list.data?.items ?? []}
            total={list.data?.total ?? 0}
            page={list.data?.page ?? page}
            pageSize={list.data?.pageSize ?? pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            rowActions={(row) => (
              <TableActionsMenu
                actions={[
                  {
                    label: 'Ver linha do tempo',
                    icon: <History fontSize="small" />,
                    onClick: () => setTimelineMessageId(row.id),
                  },
                ]}
              />
            )}
          />
        </AsyncState>
      </Stack>

      <FormDialog open={sendOpen} onClose={closeSend} title="Enviar mensagem">
        <Stack spacing={2} sx={{ mt: 1 }}>
          {send.isSuccess ? (
            <>
              <Alert severity="success">Mensagem enviada com sucesso.</Alert>
              <Button variant="contained" onClick={closeSend}>
                Fechar
              </Button>
            </>
          ) : (
            <Stack
              component="form"
              spacing={2}
              onSubmit={form.handleSubmit((data) => send.mutate(data))}
            >
              {send.error && <Alert severity="error">{send.error.message}</Alert>}
              <Controller
                name="phoneNumberId"
                control={form.control}
                render={({ field }) => (
                  <PhoneNumberAutocomplete
                    tenantId={tenantId}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    error={!!form.formState.errors.phoneNumberId}
                    helperText={form.formState.errors.phoneNumberId?.message}
                  />
                )}
              />
              <TextField
                label="Destinatário"
                placeholder="+5511999999999 ou BSUID"
                {...form.register('to')}
                error={!!form.formState.errors.to}
                helperText={
                  form.formState.errors.to?.message ??
                  'Informe o telefone ou o identificador BSUID retornado pela Meta.'
                }
                fullWidth
              />
              <TextField
                label="Mensagem"
                multiline
                minRows={4}
                {...form.register('content')}
                error={!!form.formState.errors.content}
                helperText={form.formState.errors.content?.message}
                fullWidth
              />
              <Button type="submit" variant="contained" disabled={send.isPending}>
                {send.isPending ? 'Enviando...' : 'Enviar mensagem'}
              </Button>
            </Stack>
          )}
        </Stack>
      </FormDialog>

      <MessageTimelineDialog
        open={!!timelineMessageId}
        message={details.data ?? null}
        attempts={attempts.data}
        timeline={timeline.data}
        isLoading={details.isLoading || attempts.isLoading || timeline.isLoading}
        error={(details.error ?? attempts.error ?? timeline.error) as Error | null}
        onClose={() => setTimelineMessageId(null)}
      />

      <Snackbar
        open={!!feedback}
        autoHideDuration={8000}
        onClose={(_, reason) => {
          if (reason !== 'clickaway') setFeedback(null);
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={feedback?.severity ?? 'success'}
          variant="filled"
          onClose={() => setFeedback(null)}
        >
          {feedback?.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
