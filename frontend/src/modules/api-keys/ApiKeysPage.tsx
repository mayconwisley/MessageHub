import { zodResolver } from '@hookform/resolvers/zod';
import { Block } from '@mui/icons-material';
import { Alert, Button, Chip, MenuItem, Stack, TextField } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { ApplicationAutocomplete } from '../../components/shared/ApplicationAutocomplete';
import { AsyncState } from '../../components/shared/AsyncState';
import { CodeBlock } from '../../components/shared/CodeBlock';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { FeedbackSnackbar } from '../../components/shared/FeedbackSnackbar';
import { FormDialog } from '../../components/shared/FormDialog';
import { PaginatedTable } from '../../components/shared/PaginatedTable';
import { TableActionsMenu } from '../../components/shared/TableActionsMenu';
import { TenantAutocomplete } from '../../components/shared/TenantAutocomplete';
import { PageHeader } from '../../components/ui/PageHeader';
import { useFeedback } from '../../hooks/useFeedback';
import { usePagination } from '../../hooks/usePagination';
import { useSort } from '../../hooks/useSort';
import { apiKeysApi, type ApiKey } from './api-keys.api';

const schema = z.object({
  tenantId: z.string().uuid('Selecione um tenant.'),
  applicationId: z.string().uuid('Selecione uma aplicação.'),
  type: z.enum(['platform', 'tenant']),
  expiresAt: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function normalizeStatus(status: string): string {
  return status.toUpperCase();
}
const statusLabels: Record<string, string> = { ACTIVE: 'Ativa', REVOKED: 'Revogada' };
const typeLabels: Record<string, string> = { platform: 'Plataforma', tenant: 'Tenant' };

export function ApiKeysPage() {
  const { page, pageSize, setPage, setPageSize } = usePagination();
  const { sort, onSortChange, sortBy, sortDirection } = useSort(() => setPage(1));
  const [tenantIdFilter, setTenantIdFilter] = useState('');
  const [applicationIdFilter, setApplicationIdFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [revoking, setRevoking] = useState<ApiKey | null>(null);
  const client = useQueryClient();
  const { feedback, notifySuccess, notifyError, clear } = useFeedback();
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
      void client.invalidateQueries({ queryKey: ['api-keys', variables.applicationId] });
    },
  });
  const revoke = useMutation({
    mutationFn: ({ applicationId, apiKeyId }: { applicationId: string; apiKeyId: string }) =>
      apiKeysApi.revoke(applicationId, apiKeyId),
    onSuccess: (_, variables) => {
      setRevoking(null);
      notifySuccess('Chave de API revogada.');
      void client.invalidateQueries({ queryKey: ['api-keys', variables.applicationId] });
    },
    onError: (error) => notifyError('Não foi possível revogar a chave.', error),
  });

  const validApplicationFilter = z.string().uuid().safeParse(applicationIdFilter).success;
  const list = useQuery({
    queryKey: ['api-keys', applicationIdFilter, page, pageSize, sortBy, sortDirection],
    queryFn: () => apiKeysApi.list(applicationIdFilter, { page, pageSize, sortBy, sortDirection }),
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
                sortable: true,
                render: (row) => (
                  <Chip
                    label={statusLabels[normalizeStatus(row.status)] ?? row.status}
                    size="small"
                  />
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
                    label: 'Revogar chave',
                    icon: <Block fontSize="small" />,
                    color: 'error',
                    disabled: normalizeStatus(row.status) !== 'ACTIVE',
                    onClick: () => setRevoking(row),
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
                Copie a chave agora, ela não poderá ser recuperada depois.
              </Alert>
              <CodeBlock code={create.data?.plainTextKey ?? ''} />
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

      <ConfirmDialog
        open={Boolean(revoking)}
        title="Revogar chave de API"
        description="A chave deixará de autenticar requisições imediatamente. Esta ação não pode ser desfeita."
        confirmLabel="Revogar"
        isPending={revoke.isPending}
        onConfirm={() =>
          revoking && revoke.mutate({ applicationId: applicationIdFilter, apiKeyId: revoking.id })
        }
        onClose={() => setRevoking(null)}
      />

      <FeedbackSnackbar feedback={feedback} onClose={clear} />
    </Stack>
  );
}
