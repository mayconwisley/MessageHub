import { zodResolver } from '@hookform/resolvers/zod';
import { Visibility } from '@mui/icons-material';
import { Alert, Button, Chip, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { ApplicationAutocomplete } from '../../components/shared/ApplicationAutocomplete';
import { AsyncState } from '../../components/shared/AsyncState';
import { CodeBlock } from '../../components/shared/CodeBlock';
import { EntityResult } from '../../components/shared/EntityResult';
import { FeedbackSnackbar } from '../../components/shared/FeedbackSnackbar';
import { FormDialog } from '../../components/shared/FormDialog';
import { PaginatedTable } from '../../components/shared/PaginatedTable';
import { PhoneNumberMultiAutocomplete } from '../../components/shared/PhoneNumberMultiAutocomplete';
import { TableActionsMenu } from '../../components/shared/TableActionsMenu';
import { TenantAutocomplete } from '../../components/shared/TenantAutocomplete';
import { PageHeader } from '../../components/ui/PageHeader';
import { useFeedback } from '../../hooks/useFeedback';
import { usePagination } from '../../hooks/usePagination';
import { useSort } from '../../hooks/useSort';
import { applicationsApi, type Application } from './applications.api';

const createSchema = z.object({
  tenantId: z.string().uuid('Informe um UUID válido.'),
  name: z.string().min(2, 'Informe ao menos 2 caracteres.'),
});
type CreateFormData = z.infer<typeof createSchema>;

const webhookSchema = z.object({
  applicationId: z.string().uuid('Selecione uma aplicação.'),
  webhookUrl: z.string().url('Informe uma URL https válida.').or(z.literal('')),
});
type WebhookFormData = z.infer<typeof webhookSchema>;

const statusLabels: Record<string, string> = { ACTIVE: 'Ativo', SUSPENDED: 'Suspenso' };

export function ApplicationsPage() {
  const { page, pageSize, setPage, setPageSize } = usePagination();
  const { sort, onSortChange, sortBy, sortDirection } = useSort(() => setPage(1));
  const [tenantIdFilter, setTenantIdFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [webhookOpen, setWebhookOpen] = useState(false);
  const [webhookTenantId, setWebhookTenantId] = useState('');
  const [phoneNumbersOpen, setPhoneNumbersOpen] = useState(false);
  const [linkTenantId, setLinkTenantId] = useState('');
  const [linkApplicationId, setLinkApplicationId] = useState('');
  const [linkPhoneNumberIds, setLinkPhoneNumberIds] = useState<string[]>([]);
  const [detailsApplication, setDetailsApplication] = useState<Application | null>(null);
  const client = useQueryClient();
  const { feedback, notifySuccess, notifyError, clear } = useFeedback();
  const createForm = useForm<CreateFormData>({ resolver: zodResolver(createSchema) });
  const webhookForm = useForm<WebhookFormData>({ resolver: zodResolver(webhookSchema) });

  const create = useMutation({
    mutationFn: applicationsApi.create,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['applications'] });
    },
  });
  const configureWebhook = useMutation({
    mutationFn: ({ applicationId, webhookUrl }: WebhookFormData) =>
      applicationsApi.configureWebhook(applicationId, webhookUrl || null),
    onSuccess: () => {
      notifySuccess('Webhook salvo.');
      void client.invalidateQueries({ queryKey: ['applications'] });
    },
    onError: (error) => notifyError('Não foi possível salvar o webhook.', error),
  });

  const validLinkApplicationId = z.string().uuid().safeParse(linkApplicationId).success;
  const linkedPhoneNumbers = useQuery({
    queryKey: ['application-phone-numbers', linkApplicationId],
    queryFn: () => applicationsApi.listLinkedPhoneNumbers(linkApplicationId),
    enabled: validLinkApplicationId,
  });
  useEffect(() => {
    if (linkedPhoneNumbers.data) {
      setLinkPhoneNumberIds(linkedPhoneNumbers.data.map((phoneNumber) => phoneNumber.id));
    }
  }, [linkedPhoneNumbers.data]);
  const setPhoneNumbers = useMutation({
    mutationFn: () => applicationsApi.setLinkedPhoneNumbers(linkApplicationId, linkPhoneNumberIds),
    onSuccess: () => {
      notifySuccess('Vínculos de número atualizados.');
      void client.invalidateQueries({ queryKey: ['application-phone-numbers', linkApplicationId] });
    },
    onError: (error) => notifyError('Não foi possível salvar os vínculos.', error),
  });

  const detailsPhoneNumbers = useQuery({
    queryKey: ['application-phone-numbers', detailsApplication?.id],
    queryFn: () => applicationsApi.listLinkedPhoneNumbers(detailsApplication!.id),
    enabled: !!detailsApplication,
  });

  const validTenantFilter = z.string().uuid().safeParse(tenantIdFilter).success;
  const list = useQuery({
    queryKey: ['applications', tenantIdFilter, page, pageSize, sortBy, sortDirection],
    queryFn: () =>
      applicationsApi.list({ tenantId: tenantIdFilter, page, pageSize, sortBy, sortDirection }),
    enabled: validTenantFilter,
  });

  const openCreate = () => {
    createForm.reset();
    create.reset();
    setCreateOpen(true);
  };
  const closeCreate = () => setCreateOpen(false);

  const openWebhook = () => {
    webhookForm.reset();
    configureWebhook.reset();
    setWebhookTenantId(tenantIdFilter);
    setWebhookOpen(true);
  };
  const closeWebhook = () => setWebhookOpen(false);

  const openPhoneNumbers = () => {
    setLinkTenantId(tenantIdFilter);
    setLinkApplicationId('');
    setLinkPhoneNumberIds([]);
    setPhoneNumbers.reset();
    setPhoneNumbersOpen(true);
  };
  const closePhoneNumbers = () => setPhoneNumbersOpen(false);
  const closeDetails = () => setDetailsApplication(null);

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Aplicações"
        description="Vincule aplicações consumidoras a um tenant e configure o webhook de status de mensagens."
        action={
          <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
            <Button variant="contained" onClick={openCreate}>
              Criar aplicação
            </Button>
            <Button variant="outlined" onClick={openWebhook}>
              Configurar webhook
            </Button>
            <Button variant="outlined" onClick={openPhoneNumbers}>
              Vincular números
            </Button>
          </Stack>
        }
      />
      <Stack spacing={2}>
        <TenantAutocomplete
          label="Filtrar por tenant"
          value={tenantIdFilter}
          onChange={(id) => {
            setTenantIdFilter(id);
            setPage(1);
          }}
          sx={{ maxWidth: 400 }}
        />
        <AsyncState
          isLoading={validTenantFilter && list.isLoading}
          error={list.error}
          emptyMessage={
            validTenantFilter ? undefined : 'Selecione um tenant para listar as aplicações.'
          }
        >
          <PaginatedTable<Application>
            columns={[
              { key: 'name', label: 'Nome' },
              {
                key: 'status',
                label: 'Status',
                sortable: true,
                render: (row) => (
                  <Chip label={statusLabels[row.status] ?? row.status} size="small" />
                ),
              },
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
                    label: 'Ver detalhes',
                    icon: <Visibility fontSize="small" />,
                    onClick: () => setDetailsApplication(row),
                  },
                ]}
              />
            )}
          />
        </AsyncState>
      </Stack>

      <FormDialog open={createOpen} onClose={closeCreate} title="Nova aplicação">
        <Stack spacing={2} sx={{ mt: 1 }}>
          {create.isSuccess ? (
            <>
              <Alert severity="success">Aplicação criada com sucesso.</Alert>
              <EntityResult title="Resultado" data={create.data ?? null} />
              <Button variant="contained" onClick={closeCreate}>
                Fechar
              </Button>
            </>
          ) : (
            <Stack
              component="form"
              spacing={2}
              onSubmit={createForm.handleSubmit((data) => create.mutate(data))}
            >
              {create.error && <Alert severity="error">{create.error.message}</Alert>}
              <Controller
                name="tenantId"
                control={createForm.control}
                render={({ field }) => (
                  <TenantAutocomplete
                    label="Tenant"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    error={!!createForm.formState.errors.tenantId}
                    helperText={createForm.formState.errors.tenantId?.message}
                  />
                )}
              />
              <TextField
                label="Nome da aplicação"
                {...createForm.register('name')}
                error={!!createForm.formState.errors.name}
                helperText={createForm.formState.errors.name?.message}
                fullWidth
              />
              <Button type="submit" variant="contained" disabled={create.isPending}>
                {create.isPending ? 'Salvando...' : 'Criar aplicação'}
              </Button>
            </Stack>
          )}
        </Stack>
      </FormDialog>

      <FormDialog open={webhookOpen} onClose={closeWebhook} title="Configurar webhook">
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Stack
            component="form"
            spacing={2}
            onSubmit={webhookForm.handleSubmit((data) => configureWebhook.mutate(data))}
          >
            <TenantAutocomplete
              label="Tenant"
              value={webhookTenantId}
              onChange={(id) => {
                setWebhookTenantId(id);
                webhookForm.setValue('applicationId', '');
              }}
            />
            <Controller
              name="applicationId"
              control={webhookForm.control}
              render={({ field }) => (
                <ApplicationAutocomplete
                  tenantId={webhookTenantId}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  error={!!webhookForm.formState.errors.applicationId}
                  helperText={webhookForm.formState.errors.applicationId?.message}
                />
              )}
            />
            <TextField
              label="URL do webhook (https, vazio para remover)"
              {...webhookForm.register('webhookUrl')}
              error={!!webhookForm.formState.errors.webhookUrl}
              helperText={webhookForm.formState.errors.webhookUrl?.message}
              fullWidth
            />
            <Button type="submit" variant="contained" disabled={configureWebhook.isPending}>
              {configureWebhook.isPending ? 'Salvando...' : 'Salvar webhook'}
            </Button>
          </Stack>
          {configureWebhook.data && (
            <>
              <Alert severity="success">
                Webhook atual: {configureWebhook.data.webhookUrl ?? 'nenhum configurado'}
              </Alert>
              {configureWebhook.data.webhookSecret && (
                <>
                  <Alert severity="warning">
                    Copie o segredo agora para validar a assinatura dos webhooks recebidos - ele não
                    será exibido novamente nesta tela.
                  </Alert>
                  <CodeBlock code={configureWebhook.data.webhookSecret} />
                </>
              )}
            </>
          )}
        </Stack>
      </FormDialog>

      <FormDialog open={phoneNumbersOpen} onClose={closePhoneNumbers} title="Vincular números">
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TenantAutocomplete
            label="Tenant"
            value={linkTenantId}
            onChange={(id) => {
              setLinkTenantId(id);
              setLinkApplicationId('');
            }}
          />
          <ApplicationAutocomplete
            tenantId={linkTenantId}
            value={linkApplicationId}
            onChange={setLinkApplicationId}
          />
          <PhoneNumberMultiAutocomplete
            tenantId={linkTenantId}
            value={linkPhoneNumberIds}
            onChange={setLinkPhoneNumberIds}
          />
          {!validLinkApplicationId && (
            <Alert severity="info">Selecione uma aplicação para salvar os vínculos.</Alert>
          )}
          <Button
            variant="contained"
            disabled={!validLinkApplicationId || setPhoneNumbers.isPending}
            onClick={() => setPhoneNumbers.mutate()}
          >
            {setPhoneNumbers.isPending ? 'Salvando...' : 'Salvar vínculos'}
          </Button>
        </Stack>
      </FormDialog>

      <FormDialog
        open={Boolean(detailsApplication)}
        onClose={closeDetails}
        title={`Detalhes: ${detailsApplication?.name ?? ''}`}
      >
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="subtitle2">Webhook configurado</Typography>
          <Typography color="text.secondary">
            {detailsApplication?.webhookUrl ?? 'Nenhum webhook configurado.'}
          </Typography>
          <Typography variant="subtitle2">Números vinculados</Typography>
          <AsyncState
            isLoading={detailsPhoneNumbers.isLoading}
            error={detailsPhoneNumbers.error}
            emptyMessage={
              detailsPhoneNumbers.data?.length === 0 ? 'Nenhum número vinculado.' : undefined
            }
          >
            <Stack spacing={0.5}>
              {detailsPhoneNumbers.data?.map((phoneNumber) => (
                <Typography key={phoneNumber.id}>{phoneNumber.displayNumber}</Typography>
              ))}
            </Stack>
          </AsyncState>
        </Stack>
      </FormDialog>

      <FeedbackSnackbar feedback={feedback} onClose={clear} />
    </Stack>
  );
}
