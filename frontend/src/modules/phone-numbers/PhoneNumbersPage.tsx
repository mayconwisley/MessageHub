import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Chip, FormControl, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AsyncState } from '../../components/shared/AsyncState';
import { EntityResult } from '../../components/shared/EntityResult';
import { FormDialog } from '../../components/shared/FormDialog';
import { PaginatedTable } from '../../components/shared/PaginatedTable';
import { TenantAutocomplete } from '../../components/shared/TenantAutocomplete';
import { PageHeader } from '../../components/ui/PageHeader';
import { usePagination } from '../../hooks/usePagination';
import { phoneNumbersApi, type PhoneNumber } from './phone-numbers.api';

const schema = z.object({
  whatsAppAccountId: z.string().uuid('Informe um UUID válido.'),
  phoneNumberId: z.string().min(1, 'Informe o Phone Number ID.'),
  displayNumber: z.string().min(1, 'Informe o número de exibição.'),
});
type FormData = z.infer<typeof schema>;

export function PhoneNumbersPage() {
  const { page, pageSize, setPage, setPageSize } = usePagination();
  const [tenantIdFilter, setTenantIdFilter] = useState('');
  const [status, setStatus] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const client = useQueryClient();
  const form = useForm<FormData>({ resolver: zodResolver(schema) });
  const create = useMutation({
    mutationFn: phoneNumbersApi.create,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['phone-numbers'] });
    },
  });
  const details = useQuery({
    queryKey: ['phone-number', selectedId],
    queryFn: () => phoneNumbersApi.getById(selectedId as string),
    enabled: !!selectedId,
  });

  const validTenantFilter = z.string().uuid().safeParse(tenantIdFilter).success;
  const list = useQuery({
    queryKey: ['phone-numbers', tenantIdFilter, status, page, pageSize],
    queryFn: () => phoneNumbersApi.list({ tenantId: tenantIdFilter, page, pageSize, status: status || undefined }),
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
        title="Números de telefone"
        description="Registre um número da Meta vinculado a uma conta WhatsApp."
        action={
          <Button variant="contained" onClick={openCreate} sx={{ mt: 2 }}>
            Registrar número
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
            <InputLabel id="phone-status-filter">Status</InputLabel>
            <Select
              labelId="phone-status-filter"
              label="Status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="ACTIVE">ACTIVE</MenuItem>
              <MenuItem value="SUSPENDED">SUSPENDED</MenuItem>
            </Select>
          </FormControl>
        </Stack>
        <AsyncState isLoading={validTenantFilter && list.isLoading} error={list.error} emptyMessage={validTenantFilter ? undefined : 'Selecione um tenant para listar os números.'}>
          <PaginatedTable<PhoneNumber>
            columns={[
              { key: 'displayNumber', label: 'Número' },
              { key: 'phoneNumberId', label: 'Phone Number ID' },
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
            rowActions={(row) => (
              <Button size="small" onClick={() => setSelectedId(row.id)}>
                Detalhes
              </Button>
            )}
          />
        </AsyncState>
      </Stack>

      <FormDialog open={createOpen} onClose={closeCreate} title="Registrar número">
        <Stack spacing={2} sx={{ mt: 1 }}>
          {create.isSuccess ? (
            <>
              <Alert severity="success">Número registrado com sucesso.</Alert>
              <EntityResult title="Detalhes" data={create.data ?? null} />
              <Button variant="contained" onClick={closeCreate}>
                Fechar
              </Button>
            </>
          ) : (
            <Stack component="form" spacing={2} onSubmit={form.handleSubmit((data) => create.mutate(data))}>
              {create.error && <Alert severity="error">{create.error.message}</Alert>}
              <TextField label="ID da conta WhatsApp" {...form.register('whatsAppAccountId')} error={!!form.formState.errors.whatsAppAccountId} helperText={form.formState.errors.whatsAppAccountId?.message} fullWidth autoFocus />
              <TextField label="Phone Number ID (Meta)" {...form.register('phoneNumberId')} error={!!form.formState.errors.phoneNumberId} helperText={form.formState.errors.phoneNumberId?.message} fullWidth />
              <TextField label="Número de exibição" placeholder="+5511999999999" {...form.register('displayNumber')} error={!!form.formState.errors.displayNumber} helperText={form.formState.errors.displayNumber?.message} fullWidth />
              <Button type="submit" variant="contained" disabled={create.isPending}>
                {create.isPending ? 'Salvando...' : 'Registrar número'}
              </Button>
            </Stack>
          )}
        </Stack>
      </FormDialog>

      <FormDialog open={!!selectedId} onClose={() => setSelectedId(null)} title="Detalhes do número">
        <Stack spacing={2} sx={{ mt: 1 }}>
          <AsyncState isLoading={details.isLoading} error={details.error}>
            <EntityResult title="Detalhes" data={details.data ?? null} />
          </AsyncState>
        </Stack>
      </FormDialog>
    </Stack>
  );
}
