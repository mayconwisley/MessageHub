import { Block, CheckCircle, Edit } from '@mui/icons-material';
import {
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
import { useEffect, useState } from 'react';
import { AsyncState } from '../../components/shared/AsyncState';
import { ConfirmDialog } from '../../components/shared/ConfirmDialog';
import { FeedbackSnackbar } from '../../components/shared/FeedbackSnackbar';
import { PaginatedTable } from '../../components/shared/PaginatedTable';
import { TableActionsMenu } from '../../components/shared/TableActionsMenu';
import { PageHeader } from '../../components/ui/PageHeader';
import { useFeedback } from '../../hooks/useFeedback';
import { usePagination } from '../../hooks/usePagination';
import { useSort } from '../../hooks/useSort';
import { UserFormDialog, type UserFormData } from './UserFormDialog';
import { usersApi, type User } from './users.api';

const roleLabels: Record<string, string> = {
  platform_admin: 'Administrador da plataforma',
  tenant_admin: 'Administrador do tenant',
  operator: 'Operador',
};

const statusLabels: Record<string, string> = { active: 'Ativo', suspended: 'Suspenso' };

export function UsersPage() {
  const { page, pageSize, setPage, setPageSize } = usePagination();
  const { sort, onSortChange, sortBy, sortDirection } = useSort(() => setPage(1));
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deactivating, setDeactivating] = useState<User | null>(null);
  const client = useQueryClient();
  const { feedback, notifySuccess, notifyError, clear } = useFeedback();

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput, setPage]);

  const list = useQuery({
    queryKey: ['users', page, pageSize, role, status, search, sortBy, sortDirection],
    queryFn: () =>
      usersApi.list({
        page,
        pageSize,
        role: role || undefined,
        status: status || undefined,
        search: search || undefined,
        sortBy,
        sortDirection,
      }),
  });
  const invalidate = () => client.invalidateQueries({ queryKey: ['users'] });

  const create = useMutation({
    mutationFn: (data: UserFormData) =>
      usersApi.create({
        ...data,
        password: data.password ?? '',
        tenantId: data.tenantId || undefined,
      }),
    onSuccess: () => {
      setCreating(false);
      void invalidate();
    },
  });
  const update = useMutation({
    mutationFn: (data: UserFormData) =>
      usersApi.update(editing!.id, {
        name: data.name,
        email: data.email,
        role: data.role,
        tenantId: data.tenantId || undefined,
      }),
    onSuccess: () => {
      setEditing(null);
      void invalidate();
    },
  });
  const updateStatus = useMutation({
    mutationFn: (params: { id: string; status: 'active' | 'suspended' }) =>
      usersApi.updateStatus(params.id, params.status),
    onSuccess: (_, variables) => {
      setDeactivating(null);
      notifySuccess(variables.status === 'suspended' ? 'Usuário desativado.' : 'Usuário ativado.');
      void invalidate();
    },
    onError: (error) => notifyError('Não foi possível alterar o status do usuário.', error),
  });

  const openCreate = () => {
    create.reset();
    setCreating(true);
  };

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Usuários"
        description="Crie usuários administrativos do Message Hub e vincule-os a um tenant quando necessário."
        action={
          <Button variant="contained" onClick={openCreate} sx={{ mt: 2 }}>
            Criar usuário
          </Button>
        }
      />
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Buscar por nome ou e-mail"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            sx={{ maxWidth: 320, flexGrow: 1 }}
          />
          <FormControl size="small" sx={{ width: 220 }}>
            <InputLabel id="user-role-filter">Papel</InputLabel>
            <Select
              labelId="user-role-filter"
              label="Papel"
              value={role}
              onChange={(event) => {
                setRole(event.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">Todos</MenuItem>
              {Object.entries(roleLabels).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ width: 180 }}>
            <InputLabel id="user-status-filter">Status</InputLabel>
            <Select
              labelId="user-status-filter"
              label="Status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="active">Ativo</MenuItem>
              <MenuItem value="suspended">Suspenso</MenuItem>
            </Select>
          </FormControl>
        </Stack>
        <AsyncState isLoading={list.isLoading} error={list.error}>
          <PaginatedTable<User>
            columns={[
              { key: 'name', label: 'Nome' },
              { key: 'email', label: 'E-mail' },
              {
                key: 'role',
                label: 'Papel',
                render: (row) => roleLabels[row.role] ?? row.role,
              },
              {
                key: 'tenantId',
                label: 'Tenant',
                render: (row) => row.tenantName ?? '—',
              },
              {
                key: 'status',
                label: 'Status',
                sortable: true,
                render: (row) => (
                  <Chip
                    label={statusLabels[row.status] ?? row.status}
                    color={row.status === 'active' ? 'success' : 'default'}
                    size="small"
                  />
                ),
              },
              {
                key: 'lastLoginAt',
                label: 'Último login',
                render: (row) =>
                  row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString('pt-BR') : '—',
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
                    label: 'Editar',
                    icon: <Edit fontSize="small" />,
                    onClick: () => setEditing(row),
                  },
                  row.status === 'active'
                    ? {
                        label: 'Desativar',
                        icon: <Block fontSize="small" />,
                        color: 'error' as const,
                        disabled: updateStatus.isPending,
                        onClick: () => setDeactivating(row),
                      }
                    : {
                        label: 'Ativar',
                        icon: <CheckCircle fontSize="small" />,
                        disabled: updateStatus.isPending,
                        onClick: () => updateStatus.mutate({ id: row.id, status: 'active' }),
                      },
                ]}
              />
            )}
          />
        </AsyncState>
      </Stack>

      <UserFormDialog
        open={creating || Boolean(editing)}
        user={editing}
        isSubmitting={create.isPending || update.isPending}
        error={creating ? create.error : update.error}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSubmit={(data) => (creating ? create.mutate(data) : update.mutate(data))}
      />

      <ConfirmDialog
        open={Boolean(deactivating)}
        title="Desativar usuário"
        description={`O usuário "${deactivating?.name ?? ''}" perderá acesso imediatamente ao console.`}
        confirmLabel="Desativar"
        isPending={updateStatus.isPending}
        onConfirm={() =>
          deactivating && updateStatus.mutate({ id: deactivating.id, status: 'suspended' })
        }
        onClose={() => setDeactivating(null)}
      />

      <FeedbackSnackbar feedback={feedback} onClose={clear} />
    </Stack>
  );
}
