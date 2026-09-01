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
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
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
import { TemplateAutocomplete } from '../../components/shared/TemplateAutocomplete';
import { TenantAutocomplete } from '../../components/shared/TenantAutocomplete';
import { WhatsAppAccountAutocomplete } from '../../components/shared/WhatsAppAccountAutocomplete';
import { PageHeader } from '../../components/ui/PageHeader';
import { usePagination } from '../../hooks/usePagination';
import { useSort } from '../../hooks/useSort';
import { applicationsApi } from '../applications/applications.api';
import { tenantsApi } from '../tenants/tenants.api';
import type { Template } from '../templates/templates.api';
import { emailsApi } from './emails.api';
import type { EmailMessage } from './emails.api';
import { messagesApi, type Message } from './messages.api';
import { ApiError } from '../../services/http-client';
import { toPresentationValue } from '../../lib/presentation';
import { MessageTimelineDialog } from './MessageTimelineDialog';
import { EmailTimelineDialog } from './EmailTimelineDialog';

type SendMode = 'text' | 'template' | 'email';
type CommunicationChannel = 'whatsapp' | 'email';

const textSchema = z.object({
  phoneNumberId: z.string().uuid('Informe um UUID válido.'),
  to: z.string().min(8, 'Informe um número de telefone válido.'),
  content: z
    .string()
    .min(1, 'Informe o conteúdo da mensagem.')
    .max(4096, 'A mensagem deve ter no máximo 4096 caracteres.'),
});
type TextFormData = z.infer<typeof textSchema>;

const templateSchema = z.object({
  phoneNumberId: z.string().uuid('Informe um UUID válido.'),
  to: z.string().min(8, 'Informe um número de telefone válido.'),
  templateId: z.string().uuid('Selecione um modelo aprovado.'),
});
type TemplateFormData = z.infer<typeof templateSchema>;

const emailSchema = z.object({
  to: z.string().email('Informe um e-mail válido.'),
  subject: z
    .string()
    .min(1, 'Informe o assunto.')
    .max(255, 'O assunto deve ter no máximo 255 caracteres.'),
  textBody: z.string().min(1, 'Informe o conteúdo do e-mail.'),
});
type EmailFormData = z.infer<typeof emailSchema>;

function countTemplateParameters(template: Template | null): number {
  const body = template?.components.find((component) => component.type === 'BODY');
  if (!body?.text) return 0;
  const matches = body.text.match(/\{\{\d+\}\}/g) ?? [];
  return new Set(matches).size;
}

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
  const { sort, onSortChange, sortBy, sortDirection } = useSort(() => setPage(1));
  const [tenantId, setTenantId] = useState('');
  const [applicationId, setApplicationId] = useState('');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [timelineMessageId, setTimelineMessageId] = useState<string | null>(null);
  const [timelineEmailId, setTimelineEmailId] = useState<string | null>(null);
  const [channel, setChannel] = useState<CommunicationChannel>('whatsapp');
  const [sendOpen, setSendOpen] = useState(false);
  const [sendMode, setSendMode] = useState<SendMode>('text');
  const [templateAccountId, setTemplateAccountId] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [parameterValues, setParameterValues] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{
    severity: 'success' | 'error';
    message: string;
  } | null>(null);
  const client = useQueryClient();

  const textForm = useForm<TextFormData>({ resolver: zodResolver(textSchema) });
  const templateForm = useForm<TemplateFormData>({ resolver: zodResolver(templateSchema) });
  const emailForm = useForm<EmailFormData>({ resolver: zodResolver(emailSchema) });

  const sendText = useMutation({
    mutationFn: (data: TextFormData) => messagesApi.send({ ...data, applicationId }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['messages', applicationId] });
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

  const sendTemplate = useMutation({
    mutationFn: (data: TemplateFormData) =>
      messagesApi.sendTemplate({ ...data, applicationId, parameters: parameterValues }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['messages', applicationId] });
      setFeedback({
        severity: 'success',
        message: 'Mensagem de modelo enfileirada para envio. Acompanhe o status na lista abaixo.',
      });
    },
    onError: (error) => {
      const requestId =
        error instanceof ApiError && error.requestId ? ` Protocolo: ${error.requestId}.` : '';
      setFeedback({
        severity: 'error',
        message: `Não foi possível enviar a mensagem de modelo. ${error.message}${requestId}`,
      });
    },
  });

  const sendEmail = useMutation({
    mutationFn: (data: EmailFormData) => emailsApi.send({ ...data, applicationId }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['emails', applicationId] });
      setChannel('email');
      setFeedback({
        severity: 'success',
        message: 'E-mail enfileirado para envio.',
      });
    },
    onError: (error) => {
      const requestId =
        error instanceof ApiError && error.requestId ? ` Protocolo: ${error.requestId}.` : '';
      setFeedback({
        severity: 'error',
        message: `Não foi possível enviar o e-mail. ${error.message}${requestId}`,
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

  // Redimensiona os campos de parâmetro conforme o modelo selecionado muda.
  useEffect(() => {
    setParameterValues((current) => {
      const count = countTemplateParameters(selectedTemplate);
      const next = current.slice(0, count);
      while (next.length < count) next.push('');
      return next;
    });
  }, [selectedTemplate]);

  const list = useQuery({
    queryKey: ['messages', applicationId, page, pageSize, status, search, sortBy, sortDirection],
    queryFn: () =>
      messagesApi.list({
        applicationId,
        page,
        pageSize,
        status: status || undefined,
        search: search || undefined,
        sortBy,
        sortDirection,
      }),
    enabled: validApplicationId,
  });
  const emails = useQuery({
    queryKey: ['emails', applicationId, page, pageSize, status, search, sortBy, sortDirection],
    queryFn: () =>
      emailsApi.list({
        applicationId,
        page,
        pageSize,
        status: status || undefined,
        search: search || undefined,
        sortBy,
        sortDirection,
      }),
    enabled: validApplicationId && channel === 'email',
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
  const emailTimeline = useQuery({
    queryKey: ['email-timeline', timelineEmailId, applicationId],
    queryFn: () => emailsApi.listTimeline(timelineEmailId as string, applicationId),
    enabled: !!timelineEmailId && validApplicationId,
  });

  const openSend = () => {
    setSendMode('text');
    setTemplateAccountId('');
    setSelectedTemplate(null);
    setParameterValues([]);
    textForm.reset();
    templateForm.reset();
    emailForm.reset();
    sendText.reset();
    sendTemplate.reset();
    sendEmail.reset();
    setSendOpen(true);
  };
  const closeSend = () => setSendOpen(false);

  const templateParametersInvalid =
    countTemplateParameters(selectedTemplate) > 0 &&
    parameterValues.some((value) => value.trim().length === 0);

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Mensagens"
        description="Envie uma mensagem de texto, um modelo aprovado ou um e-mail, e acompanhe o estado assíncrono do processamento."
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
        <Tabs
          value={channel}
          onChange={(_, value: CommunicationChannel) => {
            setChannel(value);
            setStatus('');
            setSearch('');
            setPage(1);
          }}
          aria-label="Canal de comunicação"
        >
          <Tab value="whatsapp" label="WhatsApp" />
          <Tab value="email" label="E-mails" />
        </Tabs>
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
              {(channel === 'email'
                ? ['PENDING', 'PROCESSING', 'SENT', 'FAILED', 'RETRY']
                : ['PENDING', 'PROCESSING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'RETRY']
              ).map((value) => (
                <MenuItem key={value} value={value}>
                  {statusLabels[value] ?? value}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            label={channel === 'email' ? 'Rastrear e-mail' : 'Rastrear mensagem'}
            placeholder={
              channel === 'email'
                ? 'ID, provider ID, request ID, chave, assunto ou destinatário'
                : 'ID, provider ID, request ID, chave ou destinatário'
            }
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            sx={{ minWidth: { sm: 360 }, flexGrow: 1 }}
          />
        </Stack>
        <AsyncState
          isLoading={
            validApplicationId && (channel === 'email' ? emails.isLoading : list.isLoading)
          }
          error={channel === 'email' ? emails.error : list.error}
          emptyMessage={
            validApplicationId
              ? undefined
              : 'Selecione um tenant e uma aplicação para listar as comunicações.'
          }
        >
          {channel === 'whatsapp' ? (
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
                  sortable: true,
                  render: (row) => (
                    <Chip label={toPresentationValue('status', row.status)} size="small" />
                  ),
                },
                { key: 'attemptCount', label: 'Tentativas' },
                {
                  key: 'createdAt',
                  label: 'Criado em',
                  sortable: true,
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
              sort={sort}
              onSortChange={onSortChange}
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
          ) : (
            <PaginatedTable<EmailMessage>
              columns={[
                { key: 'to', label: 'Destinatário' },
                { key: 'subject', label: 'Assunto' },
                {
                  key: 'status',
                  label: 'Status',
                  sortable: true,
                  render: (row) => (
                    <Chip label={toPresentationValue('status', row.status)} size="small" />
                  ),
                },
                { key: 'attemptCount', label: 'Tentativas' },
                {
                  key: 'createdAt',
                  label: 'Criado em',
                  sortable: true,
                  render: (row) => new Date(row.createdAt).toLocaleString('pt-BR'),
                },
              ]}
              rows={emails.data?.items ?? []}
              total={emails.data?.total ?? 0}
              page={emails.data?.page ?? page}
              pageSize={emails.data?.pageSize ?? pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              sort={sort}
              onSortChange={onSortChange}
              rowActions={(row) => (
                <TableActionsMenu
                  actions={[
                    {
                      label: 'Ver linha do tempo',
                      icon: <History fontSize="small" />,
                      onClick: () => setTimelineEmailId(row.id),
                    },
                  ]}
                />
              )}
            />
          )}
        </AsyncState>
      </Stack>

      <FormDialog open={sendOpen} onClose={closeSend} title="Enviar mensagem">
        <Stack spacing={2} sx={{ mt: 1 }}>
          <ToggleButtonGroup
            value={sendMode}
            exclusive
            fullWidth
            size="small"
            onChange={(_, value: SendMode | null) => value && setSendMode(value)}
          >
            <ToggleButton value="text">Texto livre</ToggleButton>
            <ToggleButton value="template">Modelo</ToggleButton>
            <ToggleButton value="email">E-mail</ToggleButton>
          </ToggleButtonGroup>

          {sendMode === 'text' &&
            (sendText.isSuccess ? (
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
                onSubmit={textForm.handleSubmit((data) => sendText.mutate(data))}
              >
                {sendText.error && <Alert severity="error">{sendText.error.message}</Alert>}
                <Controller
                  name="phoneNumberId"
                  control={textForm.control}
                  render={({ field }) => (
                    <PhoneNumberAutocomplete
                      tenantId={tenantId}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      error={!!textForm.formState.errors.phoneNumberId}
                      helperText={textForm.formState.errors.phoneNumberId?.message}
                    />
                  )}
                />
                <TextField
                  label="Destinatário"
                  placeholder="+5511999999999 ou BSUID"
                  {...textForm.register('to')}
                  error={!!textForm.formState.errors.to}
                  helperText={
                    textForm.formState.errors.to?.message ??
                    'Informe o telefone ou o identificador BSUID retornado pela Meta.'
                  }
                  fullWidth
                />
                <TextField
                  label="Mensagem"
                  multiline
                  minRows={4}
                  {...textForm.register('content')}
                  error={!!textForm.formState.errors.content}
                  helperText={textForm.formState.errors.content?.message}
                  fullWidth
                />
                <Button type="submit" variant="contained" disabled={sendText.isPending}>
                  {sendText.isPending ? 'Enviando...' : 'Enviar mensagem'}
                </Button>
              </Stack>
            ))}

          {sendMode === 'template' &&
            (sendTemplate.isSuccess ? (
              <>
                <Alert severity="success">Mensagem de modelo enviada com sucesso.</Alert>
                <Button variant="contained" onClick={closeSend}>
                  Fechar
                </Button>
              </>
            ) : (
              <Stack
                component="form"
                spacing={2}
                onSubmit={templateForm.handleSubmit((data) => sendTemplate.mutate(data))}
              >
                {sendTemplate.error && <Alert severity="error">{sendTemplate.error.message}</Alert>}
                <WhatsAppAccountAutocomplete
                  tenantId={tenantId}
                  value={templateAccountId}
                  onChange={(id) => {
                    setTemplateAccountId(id);
                    templateForm.setValue('templateId', '');
                    setSelectedTemplate(null);
                  }}
                />
                <Controller
                  name="templateId"
                  control={templateForm.control}
                  render={({ field }) => (
                    <TemplateAutocomplete
                      tenantId={tenantId}
                      whatsAppAccountId={templateAccountId}
                      value={field.value ?? ''}
                      onChange={(id, template) => {
                        field.onChange(id);
                        setSelectedTemplate(template);
                      }}
                      error={!!templateForm.formState.errors.templateId}
                      helperText={templateForm.formState.errors.templateId?.message}
                    />
                  )}
                />
                <Controller
                  name="phoneNumberId"
                  control={templateForm.control}
                  render={({ field }) => (
                    <PhoneNumberAutocomplete
                      tenantId={tenantId}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      error={!!templateForm.formState.errors.phoneNumberId}
                      helperText={templateForm.formState.errors.phoneNumberId?.message}
                    />
                  )}
                />
                <TextField
                  label="Destinatário"
                  placeholder="+5511999999999 ou BSUID"
                  {...templateForm.register('to')}
                  error={!!templateForm.formState.errors.to}
                  helperText={
                    templateForm.formState.errors.to?.message ??
                    'Informe o telefone ou o identificador BSUID retornado pela Meta.'
                  }
                  fullWidth
                />
                {parameterValues.length > 0 && (
                  <Stack spacing={2}>
                    <Typography variant="body2" color="text.secondary">
                      Valores dos parâmetros do corpo do modelo, na ordem {'{{1}}, {{2}}, ...'}
                    </Typography>
                    {parameterValues.map((paramValue, index) => (
                      <TextField
                        key={index}
                        label={`Parâmetro ${index + 1}`}
                        value={paramValue}
                        onChange={(event) => {
                          const next = [...parameterValues];
                          next[index] = event.target.value;
                          setParameterValues(next);
                        }}
                        fullWidth
                      />
                    ))}
                  </Stack>
                )}
                <Button
                  type="submit"
                  variant="contained"
                  disabled={sendTemplate.isPending || templateParametersInvalid}
                >
                  {sendTemplate.isPending ? 'Enviando...' : 'Enviar modelo'}
                </Button>
              </Stack>
            ))}

          {sendMode === 'email' &&
            (sendEmail.isSuccess ? (
              <>
                <Alert severity="success">E-mail enviado com sucesso.</Alert>
                <Button variant="contained" onClick={closeSend}>
                  Fechar
                </Button>
              </>
            ) : (
              <Stack
                component="form"
                spacing={2}
                onSubmit={emailForm.handleSubmit((data) => sendEmail.mutate(data))}
              >
                {sendEmail.error && <Alert severity="error">{sendEmail.error.message}</Alert>}
                <TextField
                  label="Destinatário"
                  placeholder="cliente@exemplo.com"
                  {...emailForm.register('to')}
                  error={!!emailForm.formState.errors.to}
                  helperText={emailForm.formState.errors.to?.message}
                  fullWidth
                />
                <TextField
                  label="Assunto"
                  {...emailForm.register('subject')}
                  error={!!emailForm.formState.errors.subject}
                  helperText={emailForm.formState.errors.subject?.message}
                  fullWidth
                />
                <TextField
                  label="Mensagem"
                  multiline
                  minRows={4}
                  {...emailForm.register('textBody')}
                  error={!!emailForm.formState.errors.textBody}
                  helperText={
                    emailForm.formState.errors.textBody?.message ??
                    'Usa o SMTP configurado para o tenant, ou o SMTP padrão da plataforma.'
                  }
                  fullWidth
                />
                <Button type="submit" variant="contained" disabled={sendEmail.isPending}>
                  {sendEmail.isPending ? 'Enviando...' : 'Enviar e-mail'}
                </Button>
              </Stack>
            ))}
        </Stack>
      </FormDialog>

      <MessageTimelineDialog
        open={!!timelineMessageId}
        message={details.data ?? null}
        attempts={attempts.data}
        timeline={timeline.data}
        isLoading={details.isLoading || attempts.isLoading || timeline.isLoading}
        error={details.error ?? attempts.error ?? timeline.error}
        onClose={() => setTimelineMessageId(null)}
      />
      <EmailTimelineDialog
        open={!!timelineEmailId}
        email={emails.data?.items.find((email) => email.id === timelineEmailId) ?? null}
        timeline={emailTimeline.data}
        isLoading={emailTimeline.isLoading}
        error={emailTimeline.error}
        onClose={() => setTimelineEmailId(null)}
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
