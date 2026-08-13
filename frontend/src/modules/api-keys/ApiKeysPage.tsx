import { zodResolver } from '@hookform/resolvers/zod';
import { Block } from '@mui/icons-material';
import { Alert, Button, Chip, MenuItem, Stack, TextField } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { ApplicationAutocomplete } from '../../components/shared/ApplicationAutocomplete';
import { AsyncState } from '../../components/shared/AsyncState';
import { FormDialog } from '../../components/shared/FormDialog';
import { PaginatedTable } from '../../components/shared/PaginatedTable';
import { TableActionsMenu } from '../../components/shared/TableActionsMenu';
import { TenantAutocomplete } from '../../components/shared/TenantAutocomplete';
import { PageHeader } from '../../components/ui/PageHeader';
import { usePagination } from '../../hooks/usePagination';
import { apiKeysApi, type ApiKey } from './api-keys.api';

const schema = z.object({
  tenantId: z.string().uuid('Selecione um tenant.'),
  applicationId: z.string().uuid('Selecione uma aplicação.'),
  type: z.enum(['platform', 'tenant']),
  expiresAt: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const statusLabels: Record<string, string> = {
  ACTIVE: 'Ativa',
  active: 'Ativa',
  REVOKED: 'Revogada',
  revoked: 'Revogada',
};
const typeLabels: Record<string, string> = { platform: 'Plataforma', tenant: 'Tenant' };

export function ApiKeysPage() {
  const { page, pageSize, setPage, setPageSize } = usePagination();
  const [tenantIdFilter, setTenantIdFilter] = useState('');
  const [applicationIdFilter, setApplicationIdFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const client = useQueryClient();
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'platform' },
  });
  const create = useMutation({
    mutationFn: ({ applicationId, type, expiresAt }: FormData) =>
      apiKeysApi.create(applicationId, { type, ...(expiresAt ? { expiresAt } : {}) }),
    onSuccess: (_, variables) => {
      setTenantIdFilter(variables.tenantId);
      setApplicationIdFilter(variables.applicationId);
      client.invalidateQueries({ queryKey: ['api-keys', variables.applicationId] });
    },
  });
  const revoke = useMutation({
    mutationFn: ({ applicationId, apiKeyId }: { applicationId: string; apiKeyId: string }) =>
      apiKeysApi.revoke(applicationId, apiKeyId),
    onSuccess: (_, variables) =>
      client.invalidateQueries({ queryKey: ['api-keys', variables.applicationId] }),
  });

  const validApplicationFilter = z.string().uuid().safeParse(applicationIdFilter).success;
  const list = useQuery({
    queryKey: ['api-keys', applicationIdFilter, page, pageSize],
    queryFn: () => apiKeysApi.list(applicationIdFilter, { page, pageSize }),
    enabled: validApplicationFilter,
  });

  const openCreate = () => {
    form.reset({ type: 'platform', tenantId: undefined, applicationId: undefined });
    create.reset();
    setCreateOpen(true);
  };
  const closeCreate = () => setCreateOpen(false);
  const createTenantId = form.watch('tenantId');

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Chaves de API"
        description="Gere ou revogue chaves para uma aplicação. O valor completo é exibido apenas uma vez."
        action={
          <Button variant="contained" onClick={openCreate} sx={{ mt: 2 }}>
            Gerar chave de API
          </Button>
        }
      />
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TenantAutocomplete
            label="Filtrar por tenant"
            value={tenantIdFilter}
            onChange={(id) => {
              setTenantIdFilter(id);
              setApplicationIdFilter('');
              setPage(1);
            }}
            sx={{ maxWidth: 320, flexGrow: 1 }}
          />
          <ApplicationAutocomplete
            label="Filtrar por aplicação"
            tenantId={tenantIdFilter}
            value={applicationIdFilter}
            onChange={(id) => {
              setApplicationIdFilter(id);
              setPage(1);
            }}
            sx={{ maxWidth: 320, flexGrow: 1 }}
          />
        </Stack>
        <AsyncState
          isLoading={validApplicationFilter && list.isLoading}
          error={list.error}
          emptyMessage={
            validApplicationFilter ? undefined : 'Selecione uma aplicação para listar suas chaves.'
          }
        >
          <PaginatedTable<ApiKey>
            columns={[
              { key: 'prefix', label: 'Prefixo' },
              { key: 'type', label: 'Tipo', render: (row) => typeLabels[row.type] ?? row.type },
              {
                key: 'status',
                label: 'Status',
                render: (row) => (
                  <Chip label={statusLabels[row.status] ?? row.status} size="small" />
                ),
              },
              {
                key: 'expiresAt',
                label: 'Expira em',
                render: (row) =>
                  row.expiresAt ? new Date(row.expiresAt).toLocaleString('pt-BR') : 'Sem expiração',
              },
              { key: 'scopes', label: 'Escopos', render: (row) => row.scopes.join(', ') || '—' },
              {
                key: 'lastUsedAt',
                label: 'Último uso',
                render: (row) =>
                  row.lastUsedAt ? new Date(row.lastUsedAt).toLocaleString('pt-BR') : 'Nunca',
              },
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
                    label: 'Revogar chave',
                    icon: <Block fontSize="small" />,
                    color: 'error',
                    disabled: row.status !== 'active' && row.status !== 'ACTIVE',
                    onClick: () =>
                      revoke.mutate({ applicationId: applicationIdFilter, apiKeyId: row.id }),
                  },
                ]}
              />
            )}
          />
        </AsyncState>
      </Stack>

      <FormDialog open={createOpen} onClose={closeCreate} title="Gerar chave de API">
        <Stack spacing={2} sx={{ mt: 1 }}>
          {create.isSuccess ? (
            <>
              <Alert severity="warning">
                Copie a chave agora, ela não poderá ser recuperada depois:{' '}
                <strong>{create.data?.plainTextKey}</strong>
              </Alert>
              <Button variant="contained" onClick={closeCreate}>
                Fechar
              </Button>
            </>
          ) : (
            <Stack
              component="form"
              spacing={2}
              onSubmit={form.handleSubmit((data) => create.mutate(data))}
            >
              {create.error && <Alert severity="error">{create.error.message}</Alert>}
              <Controller
                name="tenantId"
                control={form.control}
                render={({ field }) => (
                  <TenantAutocomplete
                    label="Tenant"
                    value={field.value ?? ''}
                    onChange={(id) => {
                      field.onChange(id);
                      form.setValue('applicationId', '');
                    }}
                    error={!!form.formState.errors.tenantId}
                    helperText={form.formState.errors.tenantId?.message}
                  />
                )}
              />
              <Controller
                name="applicationId"
                control={form.control}
                render={({ field }) => (
                  <ApplicationAutocomplete
                    tenantId={createTenantId ?? ''}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    error={!!form.formState.errors.applicationId}
                    helperText={form.formState.errors.applicationId?.message}
                  />
                )}
              />
              <TextField label="Tipo" select {...form.register('type')} fullWidth>
                <MenuItem value="platform">{typeLabels.platform}</MenuItem>
                <MenuItem value="tenant">{typeLabels.tenant}</MenuItem>
              </TextField>
              <TextField
                label="Expira em (opcional)"
                type="datetime-local"
                InputLabelProps={{ shrink: true }}
                {...form.register('expiresAt')}
                fullWidth
              />
              <Button type="submit" variant="contained" disabled={create.isPending}>
                {create.isPending ? 'Gerando...' : 'Gerar chave de API'}
              </Button>
            </Stack>
          )}
        </Stack>
      </FormDialog>
    </Stack>
  );
}
