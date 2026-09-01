import { zodResolver } from '@hookform/resolvers/zod';
import { Visibility } from '@mui/icons-material';
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AsyncState } from '../../components/shared/AsyncState';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { EntityResult } from '../../components/shared/EntityResult';
import { FeedbackSnackbar } from '../../components/shared/FeedbackSnackbar';
import { FormDialog } from '../../components/shared/FormDialog';
import { PaginatedTable } from '../../components/shared/PaginatedTable';
import { TableActionsMenu } from '../../components/shared/TableActionsMenu';
import { PageHeader } from '../../components/ui/PageHeader';
import { useFeedback } from '../../hooks/useFeedback';
import { usePagination } from '../../hooks/usePagination';
import { useSort } from '../../hooks/useSort';
import { tenantsApi, type Tenant } from './tenants.api';

const schema = z.object({ name: z.string().min(2, 'Informe ao menos 2 caracteres.') });
type FormData = z.infer<typeof schema>;

const statusLabels: Record<string, string> = { ACTIVE: 'Ativo', SUSPENDED: 'Suspenso' };

export function TenantsPage() {
  const { page, pageSize, setPage, setPageSize } = usePagination();
  const { sort, onSortChange, sortBy, sortDirection } = useSort(() => setPage(1));
  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const client = useQueryClient();
  const { feedback, notifySuccess, notifyError, clear } = useFeedback();
  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput, setPage]);

  const list = useQuery({
    queryKey: ['tenants', page, pageSize, status, search, sortBy, sortDirection],
    queryFn: () =>
      tenantsApi.list({
        page,
        pageSize,
        status: status || undefined,
        search: search || undefined,
        sortBy,
        sortDirection,
      }),
  });
  const create = useMutation({
    mutationFn: tenantsApi.create,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['tenants'] });
    },
  });
  const details = useQuery({
    queryKey: ['tenant', selectedId],
    queryFn: () => tenantsApi.getById(selectedId as string),
    enabled: !!selectedId,
  });
  const updateStatus = useMutation({
    mutationFn: (status: 'ACTIVE' | 'SUSPENDED') =>
      tenantsApi.updateStatus(selectedId as string, status),
    onSuccess: (_, status) => {
      setConfirmSuspend(false);
      notifySuccess(status === 'SUSPENDED' ? 'Tenant suspenso.' : 'Tenant ativado.');
      void client.invalidateQueries({ queryKey: ['tenant', selectedId] });
      void client.invalidateQueries({ queryKey: ['tenants'] });
    },
    onError: (error) => notifyError('Não foi possível alterar o status do tenant.', error),
  });

  const closeDetails = () => {
    setSelectedId(null);
    updateStatus.reset();
  };

  const openCreate = () => {
    form.reset();
    create.reset();
    setCreateOpen(true);
  };

  const closeCreate = () => setCreateOpen(false);

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Tenants"
        description="Cadastre tenants e acompanhe os já existentes."
        action={
          <Button variant="contained" onClick={openCreate} sx={{ mt: 2 }}>
            Criar tenant
          </Button>
        }
      />
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Buscar por nome"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            sx={{ maxWidth: 320, flexGrow: 1 }}
          />
          <FormControl size="small" sx={{ width: 220 }}>
            <InputLabel id="tenant-status-filter">Status</InputLabel>
            <Select
              labelId="tenant-status-filter"
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
        <AsyncState isLoading={list.isLoading} error={list.error}>
          <PaginatedTable<Tenant>
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
                    onClick: () => setSelectedId(row.id),
                  },
                ]}
              />
            )}
          />
        </AsyncState>
      </Stack>

      <FormDialog open={createOpen} onClose={closeCreate} title="Criar tenant">
        <Stack spacing={2} sx={{ mt: 1 }}>
          {create.isSuccess ? (
            <>
              <Alert severity="success">Tenant criado com sucesso.</Alert>
              <EntityResult title="Tenant criado" data={create.data ?? null} />
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
              <TextField
                label="Nome do tenant"
                {...form.register('name')}
                error={!!form.formState.errors.name}
                helperText={form.formState.errors.name?.message}
                fullWidth
                autoFocus
              />
              <Button type="submit" variant="contained" disabled={create.isPending}>
                {create.isPending ? 'Salvando...' : 'Criar tenant'}
              </Button>
            </Stack>
          )}
        </Stack>
      </FormDialog>

      <Dialog open={!!selectedId} onClose={closeDetails} fullWidth maxWidth="sm">
        <DialogTitle>Detalhes do tenant</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <AsyncState isLoading={details.isLoading} error={details.error}>
              <EntityResult title="Detalhes" data={details.data ?? null} />
            </AsyncState>
          </Stack>
        </DialogContent>
        <DialogActions>
          {details.data?.status === 'ACTIVE' && (
            <Button
              color="warning"
              disabled={updateStatus.isPending}
              onClick={() => setConfirmSuspend(true)}
            >
              Suspender
            </Button>
          )}
          {details.data?.status === 'SUSPENDED' && (
            <Button
              color="success"
              disabled={updateStatus.isPending}
              onClick={() => updateStatus.mutate('ACTIVE')}
            >
              Ativar
            </Button>
          )}
          <Button onClick={closeDetails}>Fechar</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmSuspend}
        title="Suspender tenant"
        description="Todas as aplicações, chaves de API e integrações deste tenant deixarão de funcionar até que ele seja reativado."
        confirmLabel="Suspender"
        isPending={updateStatus.isPending}
        onConfirm={() => updateStatus.mutate('SUSPENDED')}
        onClose={() => setConfirmSuspend(false)}
      />

      <FeedbackSnackbar feedback={feedback} onClose={clear} />
    </Stack>
  );
}
