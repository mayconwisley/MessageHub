import { zodResolver } from '@hookform/resolvers/zod';
import { Visibility } from '@mui/icons-material';
import {
  Alert,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { AsyncState } from '../../components/shared/AsyncState';
import { EntityResult } from '../../components/shared/EntityResult';
import { FormDialog } from '../../components/shared/FormDialog';
import { PaginatedTable } from '../../components/shared/PaginatedTable';
import { TableActionsMenu } from '../../components/shared/TableActionsMenu';
import { TenantAutocomplete } from '../../components/shared/TenantAutocomplete';
import { PageHeader } from '../../components/ui/PageHeader';
import { usePagination } from '../../hooks/usePagination';
import { whatsAppAccountsApi, type WhatsAppAccount } from './whatsapp-accounts.api';

const schema = z.object({
  tenantId: z.string().uuid('Informe um UUID válido.'),
  wabaId: z.string().min(1, 'Informe o ID da conta WhatsApp (WABA).'),
  accessToken: z.string().optional(),
  appSecret: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

const statusLabels: Record<string, string> = {
  ACTIVE: 'Ativo',
  SUSPENDED: 'Suspenso',
};
const credentialSourceLabels: Record<string, string> = {
  default: 'Padrão',
  tenant: 'Tenant',
};

export function WhatsAppAccountsPage() {
  const { page, pageSize, setPage, setPageSize } = usePagination();
  const [tenantIdFilter, setTenantIdFilter] = useState('');
  const [status, setStatus] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const client = useQueryClient();
  const form = useForm<FormData>({ resolver: zodResolver(schema) });
  const create = useMutation({
    mutationFn: whatsAppAccountsApi.create,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['whatsapp-accounts'] });
    },
  });
  const details = useQuery({
    queryKey: ['whatsapp-account', selectedId],
    queryFn: () => whatsAppAccountsApi.getById(selectedId as string),
    enabled: !!selectedId,
  });

  const validTenantFilter = z.string().uuid().safeParse(tenantIdFilter).success;
  const list = useQuery({
    queryKey: ['whatsapp-accounts', tenantIdFilter, status, page, pageSize],
    queryFn: () =>
      whatsAppAccountsApi.list({
        tenantId: tenantIdFilter,
        page,
        pageSize,
        status: status || undefined,
      }),
    enabled: validTenantFilter,
  });

  const openCreate = () => {
    form.reset();
    create.reset();
    setCreateOpen(true);
  };
  const closeCreate = () => setCreateOpen(false);

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Contas WhatsApp"
        description="Registre a conta WhatsApp (WABA) e a origem segura das credenciais de cada tenant."
        action={
          <Button variant="contained" onClick={openCreate} sx={{ mt: 2 }}>
            Registrar conta
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
              setPage(1);
            }}
            sx={{ maxWidth: 400, flexGrow: 1 }}
          />
          <FormControl size="small" sx={{ width: 220 }}>
            <InputLabel id="account-status-filter">Status</InputLabel>
            <Select
              labelId="account-status-filter"
              label="Status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="ACTIVE">Ativo</MenuItem>
              <MenuItem value="SUSPENDED">Suspenso</MenuItem>
            </Select>
          </FormControl>
        </Stack>
        <AsyncState
          isLoading={validTenantFilter && list.isLoading}
          error={list.error}
          emptyMessage={
            validTenantFilter ? undefined : 'Selecione um tenant para listar as contas.'
          }
        >
          <PaginatedTable<WhatsAppAccount>
            columns={[
              { key: 'wabaId', label: 'ID da conta WhatsApp (WABA)' },
              {
                key: 'credentialSource',
                label: 'Origem',
                render: (row) =>
                  credentialSourceLabels[row.credentialSource] ?? row.credentialSource,
              },
              {
                key: 'status',
                label: 'Status',
                render: (row) => (
                  <Chip label={statusLabels[row.status] ?? row.status} size="small" />
                ),
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
                    label: 'Ver detalhes',
                    icon: <Visibility fontSize="small" />,
                    onClick: () => setSelectedId(row.id),
                  },
                ]}
              />
            )}
          />
        </AsyncState>
      </Stack>

      <FormDialog open={createOpen} onClose={closeCreate} title="Registrar conta WhatsApp">
        <Stack spacing={2} sx={{ mt: 1 }}>
          {create.isSuccess ? (
            <>
              <Alert severity="success">Conta registrada com sucesso.</Alert>
              <EntityResult title="Detalhes" data={create.data ?? null} />
              <Button variant="contained" onClick={closeCreate}>
                Fechar
              </Button>
            </>
          ) : (
            <Stack
              component="form"
              spacing={2}
              onSubmit={form.handleSubmit((data) =>
                create.mutate({ ...data, credentialSource: 'tenant' }),
              )}
            >
              {create.error && <Alert severity="error">{create.error.message}</Alert>}
              <Controller
                name="tenantId"
                control={form.control}
                render={({ field }) => (
                  <TenantAutocomplete
                    label="Tenant"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    error={!!form.formState.errors.tenantId}
                    helperText={form.formState.errors.tenantId?.message}
                  />
                )}
              />
              <TextField
                label="ID da conta WhatsApp (WABA)"
                {...form.register('wabaId')}
                error={!!form.formState.errors.wabaId}
                helperText={form.formState.errors.wabaId?.message}
                fullWidth
              />
              <TextField
                label="Token de acesso"
                type="password"
                autoComplete="off"
                {...form.register('accessToken')}
                fullWidth
              />
              <TextField
                label="Segredo do aplicativo (opcional)"
                type="password"
                autoComplete="off"
                {...form.register('appSecret')}
                fullWidth
              />
              <Button type="submit" variant="contained" disabled={create.isPending}>
                {create.isPending ? 'Salvando...' : 'Registrar conta'}
              </Button>
            </Stack>
          )}
        </Stack>
      </FormDialog>

      <FormDialog open={!!selectedId} onClose={() => setSelectedId(null)} title="Detalhes da conta">
        <Stack spacing={2} sx={{ mt: 1 }}>
          <AsyncState isLoading={details.isLoading} error={details.error}>
            <EntityResult title="Detalhes" data={details.data ?? null} />
          </AsyncState>
        </Stack>
      </FormDialog>
    </Stack>
  );
}
