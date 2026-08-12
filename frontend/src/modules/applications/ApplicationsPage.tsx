import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Chip, Stack, TextField } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { AsyncState } from '../../components/shared/AsyncState';
import { EntityResult } from '../../components/shared/EntityResult';
import { FormDialog } from '../../components/shared/FormDialog';
import { PaginatedTable } from '../../components/shared/PaginatedTable';
import { TenantAutocomplete } from '../../components/shared/TenantAutocomplete';
import { PageHeader } from '../../components/ui/PageHeader';
import { usePagination } from '../../hooks/usePagination';
import { applicationsApi, type Application } from './applications.api';

const createSchema = z.object({ tenantId: z.string().uuid('Informe um UUID válido.'), name: z.string().min(2) });
type CreateFormData = z.infer<typeof createSchema>;

const webhookSchema = z.object({ applicationId: z.string().uuid('Informe um UUID válido.'), webhookUrl: z.string().url('Informe uma URL https válida.').or(z.literal('')) });
type WebhookFormData = z.infer<typeof webhookSchema>;

export function ApplicationsPage() {
  const { page, pageSize, setPage, setPageSize } = usePagination();
  const [tenantIdFilter, setTenantIdFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [webhookOpen, setWebhookOpen] = useState(false);
  const client = useQueryClient();
  const createForm = useForm<CreateFormData>({ resolver: zodResolver(createSchema) });
  const webhookForm = useForm<WebhookFormData>({ resolver: zodResolver(webhookSchema) });

  const create = useMutation({
    mutationFn: applicationsApi.create,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['applications'] });
    },
  });
  const configureWebhook = useMutation({
    mutationFn: ({ applicationId, webhookUrl }: WebhookFormData) => applicationsApi.configureWebhook(applicationId, webhookUrl || null),
  });

  const validTenantFilter = z.string().uuid().safeParse(tenantIdFilter).success;
  const list = useQuery({
    queryKey: ['applications', tenantIdFilter, page, pageSize],
    queryFn: () => applicationsApi.list({ tenantId: tenantIdFilter, page, pageSize }),
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
    setWebhookOpen(true);
  };
  const closeWebhook = () => setWebhookOpen(false);

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
        <AsyncState isLoading={validTenantFilter && list.isLoading} error={list.error} emptyMessage={validTenantFilter ? undefined : 'Selecione um tenant para listar as aplicações.'}>
          <PaginatedTable<Application>
            columns={[
              { key: 'name', label: 'Nome' },
              { key: 'status', label: 'Status', render: (row) => <Chip label={row.status} size="small" /> },
              { key: 'createdAt', label: 'Criado em', render: (row) => new Date(row.createdAt).toLocaleString('pt-BR') },
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
            <Stack component="form" spacing={2} onSubmit={createForm.handleSubmit((data) => create.mutate(data))}>
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
              <TextField label="Nome da aplicação" {...createForm.register('name')} error={!!createForm.formState.errors.name} helperText={createForm.formState.errors.name?.message} fullWidth />
              <Button type="submit" variant="contained" disabled={create.isPending}>
                {create.isPending ? 'Salvando...' : 'Criar aplicação'}
              </Button>
            </Stack>
          )}
        </Stack>
      </FormDialog>

      <FormDialog open={webhookOpen} onClose={closeWebhook} title="Configurar webhook">
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Stack component="form" spacing={2} onSubmit={webhookForm.handleSubmit((data) => configureWebhook.mutate(data))}>
            {configureWebhook.error && <Alert severity="error">{configureWebhook.error.message}</Alert>}
            <TextField label="ID da aplicação" {...webhookForm.register('applicationId')} error={!!webhookForm.formState.errors.applicationId} helperText={webhookForm.formState.errors.applicationId?.message} fullWidth autoFocus />
            <TextField label="URL do webhook (https, vazio para remover)" {...webhookForm.register('webhookUrl')} error={!!webhookForm.formState.errors.webhookUrl} helperText={webhookForm.formState.errors.webhookUrl?.message} fullWidth />
            <Button type="submit" variant="contained" disabled={configureWebhook.isPending}>
              {configureWebhook.isPending ? 'Salvando...' : 'Salvar webhook'}
            </Button>
          </Stack>
          {configureWebhook.data && (
            <Alert severity="success">Webhook atual: {configureWebhook.data.webhookUrl ?? 'nenhum configurado'}</Alert>
          )}
        </Stack>
      </FormDialog>
    </Stack>
  );
}
