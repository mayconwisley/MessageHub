import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Chip, MenuItem, Stack, TextField } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AsyncState } from '../../components/shared/AsyncState';
import { FormDialog } from '../../components/shared/FormDialog';
import { PaginatedTable } from '../../components/shared/PaginatedTable';
import { PageHeader } from '../../components/ui/PageHeader';
import { usePagination } from '../../hooks/usePagination';
import { apiKeysApi, type ApiKey } from './api-keys.api';

const schema = z.object({
  applicationId: z.string().uuid('Informe um UUID válido.'),
  type: z.enum(['platform', 'tenant']),
  expiresAt: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export function ApiKeysPage() {
  const { page, pageSize, setPage, setPageSize } = usePagination();
  const [applicationIdFilter, setApplicationIdFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const client = useQueryClient();
  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { type: 'platform' } });
  const create = useMutation({
    mutationFn: ({ applicationId, type, expiresAt }: FormData) =>
      apiKeysApi.create(applicationId, { type, ...(expiresAt ? { expiresAt } : {}) }),
    onSuccess: (_, variables) => {
      setApplicationIdFilter(variables.applicationId);
      client.invalidateQueries({ queryKey: ['api-keys', variables.applicationId] });
    },
  });
  const revoke = useMutation({
    mutationFn: ({ applicationId, apiKeyId }: { applicationId: string; apiKeyId: string }) => apiKeysApi.revoke(applicationId, apiKeyId),
    onSuccess: (_, variables) => client.invalidateQueries({ queryKey: ['api-keys', variables.applicationId] }),
  });

  const validApplicationFilter = z.string().uuid().safeParse(applicationIdFilter).success;
  const list = useQuery({
    queryKey: ['api-keys', applicationIdFilter, page, pageSize],
    queryFn: () => apiKeysApi.list(applicationIdFilter, { page, pageSize }),
    enabled: validApplicationFilter,
  });

  const openCreate = () => {
    form.reset({ type: 'platform' });
    create.reset();
    setCreateOpen(true);
  };
  const closeCreate = () => setCreateOpen(false);

  return (
    <Stack spacing={3}>
      <PageHeader
        title="API keys"
        description="Gere ou revogue chaves para uma aplicação. O valor completo é exibido apenas uma vez."
        action={
          <Button variant="contained" onClick={openCreate} sx={{ mt: 2 }}>
            Gerar API key
          </Button>
        }
      />
      <Stack spacing={2}>
        <TextField
          label="Filtrar por ID da aplicação"
          value={applicationIdFilter}
          onChange={(event) => {
            setApplicationIdFilter(event.target.value);
            setPage(1);
          }}
          sx={{ maxWidth: 400 }}
        />
        <AsyncState isLoading={validApplicationFilter && list.isLoading} error={list.error} emptyMessage={validApplicationFilter ? undefined : 'Informe o ID de uma aplicação para listar suas chaves.'}>
          <PaginatedTable<ApiKey>
            columns={[
              { key: 'prefix', label: 'Prefixo' },
              { key: 'type', label: 'Tipo' },
              { key: 'status', label: 'Status', render: (row) => <Chip label={row.status} size="small" /> },
              { key: 'expiresAt', label: 'Expira em', render: (row) => (row.expiresAt ? new Date(row.expiresAt).toLocaleString('pt-BR') : 'Sem expiração') },
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
            rowActions={(row) => (
              <Button
                size="small"
                color="error"
                disabled={row.status !== 'active' && row.status !== 'ACTIVE'}
                onClick={() => revoke.mutate({ applicationId: applicationIdFilter, apiKeyId: row.id })}
              >
                Revogar
              </Button>
            )}
          />
        </AsyncState>
      </Stack>

      <FormDialog open={createOpen} onClose={closeCreate} title="Gerar API key">
        <Stack spacing={2} sx={{ mt: 1 }}>
          {create.isSuccess ? (
            <>
              <Alert severity="warning">
                Copie a chave agora, ela não poderá ser recuperada depois: <strong>{create.data?.plainTextKey}</strong>
              </Alert>
              <Button variant="contained" onClick={closeCreate}>
                Fechar
              </Button>
            </>
          ) : (
            <Stack component="form" spacing={2} onSubmit={form.handleSubmit((data) => create.mutate(data))}>
              {create.error && <Alert severity="error">{create.error.message}</Alert>}
              <TextField label="ID da aplicação" {...form.register('applicationId')} error={!!form.formState.errors.applicationId} helperText={form.formState.errors.applicationId?.message} fullWidth autoFocus />
              <TextField label="Tipo" select {...form.register('type')} fullWidth>
                <MenuItem value="platform">platform</MenuItem>
                <MenuItem value="tenant">tenant</MenuItem>
              </TextField>
              <TextField label="Expira em (opcional)" type="datetime-local" InputLabelProps={{ shrink: true }} {...form.register('expiresAt')} fullWidth />
              <Button type="submit" variant="contained" disabled={create.isPending}>
                {create.isPending ? 'Gerando...' : 'Gerar API key'}
              </Button>
            </Stack>
          )}
        </Stack>
      </FormDialog>
    </Stack>
  );
}
