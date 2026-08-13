import { zodResolver } from '@hookform/resolvers/zod';
import { Delete, Edit } from '@mui/icons-material';
import { Alert, Button, Chip, FormControl, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { AsyncState } from '../../components/shared/AsyncState';
import { FormDialog } from '../../components/shared/FormDialog';
import { PaginatedTable } from '../../components/shared/PaginatedTable';
import { TableActionsMenu } from '../../components/shared/TableActionsMenu';
import { TenantAutocomplete } from '../../components/shared/TenantAutocomplete';
import { WhatsAppAccountAutocomplete } from '../../components/shared/WhatsAppAccountAutocomplete';
import { PageHeader } from '../../components/ui/PageHeader';
import { usePagination } from '../../hooks/usePagination';
import { templatesApi, type Template } from './templates.api';

const createSchema = z.object({
  tenantId: z.string().uuid('Selecione um tenant.'),
  whatsAppAccountId: z.string().uuid('Selecione uma conta WhatsApp.'),
  name: z.string().min(1, 'Informe o nome do template.'),
  language: z.string().min(2, 'Informe o idioma do template.'),
  category: z.string().min(1, 'Informe a categoria do template.'),
  body: z.string().min(1, 'Informe o texto do corpo do template.'),
});
type CreateFormData = z.infer<typeof createSchema>;

const editSchema = z.object({
  category: z.string().min(1, 'Informe a categoria do template.'),
  body: z.string().min(1, 'Informe o texto do corpo do template.'),
});
type EditFormData = z.infer<typeof editSchema>;

const statusLabels: Record<string, string> = {
  DRAFT: 'Rascunho',
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  PAUSED: 'Pausado',
  DISABLED: 'Desativado',
};

function bodyTextOf(template: Template): string {
  return template.components.find((component) => component.type === 'BODY')?.text ?? '';
}

export function TemplatesPage() {
  const { page, pageSize, setPage, setPageSize } = usePagination();
  const [tenantIdFilter, setTenantIdFilter] = useState('');
  const [accountId, setAccountId] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const client = useQueryClient();

  const createForm = useForm<CreateFormData>({ resolver: zodResolver(createSchema), defaultValues: { language: 'pt_BR', category: 'UTILITY' } });
  const editForm = useForm<EditFormData>({ resolver: zodResolver(editSchema) });

  const validTenant = z.string().uuid().safeParse(tenantIdFilter).success;
  const validAccount = z.string().uuid().safeParse(accountId).success;
  const list = useQuery({
    queryKey: ['templates', accountId, page, pageSize, status, category],
    queryFn: () => templatesApi.list({ tenantId: tenantIdFilter, whatsAppAccountId: accountId, page, pageSize, status: status || undefined, category: category || undefined }),
    enabled: validTenant && validAccount,
  });

  const invalidateList = () => client.invalidateQueries({ queryKey: ['templates', accountId] });
  const create = useMutation({
    mutationFn: (data: CreateFormData) =>
      templatesApi.create({
        tenantId: data.tenantId,
        whatsAppAccountId: data.whatsAppAccountId,
        name: data.name,
        language: data.language,
        category: data.category,
        body: data.body,
      }),
    onSuccess: invalidateList,
  });
  const update = useMutation({
    mutationFn: (data: EditFormData) => templatesApi.update(editing!.id, { ...data, tenantId: tenantIdFilter }),
    onSuccess: () => {
      setEditing(null);
      invalidateList();
    },
  });
  const remove = useMutation({ mutationFn: (id: string) => templatesApi.delete(id, tenantIdFilter), onSuccess: invalidateList });
  const sync = useMutation({
    mutationFn: () => templatesApi.sync(tenantIdFilter, accountId),
    onSuccess: invalidateList,
  });
  const publishPending = useMutation({
    mutationFn: () => templatesApi.publishPending(tenantIdFilter, accountId),
    onSuccess: invalidateList,
  });

  const openCreate = () => {
    createForm.reset({
      language: 'pt_BR',
      category: 'UTILITY',
      tenantId: tenantIdFilter || undefined,
      whatsAppAccountId: accountId || undefined,
    });
    create.reset();
    setCreateOpen(true);
  };
  const closeCreate = () => setCreateOpen(false);
  const createTenantId = createForm.watch('tenantId');

  const startEdit = (template: Template) => {
    setEditing(template);
    editForm.reset({ category: template.category, body: bodyTextOf(template) });
  };

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Modelos de mensagem"
        description="Cadastre, edite e sincronize os modelos de mensagem da conta WhatsApp selecionada."
        action={
          <Button variant="contained" onClick={openCreate} sx={{ mt: 2 }}>
            Criar modelo
          </Button>
        }
      />
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap' }}>
          <TenantAutocomplete
            label="Filtrar por tenant"
            value={tenantIdFilter}
            onChange={(id) => {
              setTenantIdFilter(id);
              setAccountId('');
              setPage(1);
            }}
            sx={{ minWidth: 260 }}
          />
          <WhatsAppAccountAutocomplete
            label="Filtrar por conta WhatsApp"
            tenantId={tenantIdFilter}
            value={accountId}
            onChange={(id) => {
              setAccountId(id);
              setPage(1);
            }}
            sx={{ minWidth: 260 }}
          />
          <FormControl size="small" sx={{ width: 200 }}>
            <InputLabel id="template-status-filter">Status</InputLabel>
            <Select
              labelId="template-status-filter"
              label="Status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <MenuItem value="">Todos</MenuItem>
              {['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'PAUSED', 'DISABLED'].map((value) => (
                <MenuItem key={value} value={value}>{statusLabels[value] ?? value}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Categoria"
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
            sx={{ width: 200 }}
          />
          <Button type="button" variant="outlined" onClick={() => sync.mutate()} disabled={!validAccount || sync.isPending} sx={{ whiteSpace: 'nowrap' }}>Sincronizar com a Meta</Button>
          <Button type="button" variant="outlined" onClick={() => publishPending.mutate()} disabled={!validAccount || publishPending.isPending} sx={{ whiteSpace: 'nowrap' }}>Publicar pendentes</Button>
        </Stack>
        {sync.error && <Alert severity="error">{sync.error.message}</Alert>}
        {sync.data && <Alert severity="success">Sincronização concluída: {sync.data.total} modelos processados.</Alert>}
        {publishPending.error && <Alert severity="error">{publishPending.error.message}</Alert>}
        {publishPending.data && <Alert severity="success">Publicação concluída: {publishPending.data.total} modelos processados.</Alert>}
        {remove.error && <Alert severity="error">{remove.error.message}</Alert>}
        <AsyncState isLoading={validAccount && list.isLoading} error={list.error} emptyMessage={validAccount ? undefined : 'Informe uma conta válida para listar os modelos.'}>
          <PaginatedTable<Template>
            columns={[
              { key: 'name', label: 'Nome' },
              { key: 'language', label: 'Idioma' },
              { key: 'category', label: 'Categoria' },
              { key: 'status', label: 'Status', render: (row) => <Chip label={statusLabels[row.status] ?? row.status} size="small" /> },
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
                  { label: 'Editar modelo', icon: <Edit fontSize="small" />, onClick: () => startEdit(row) },
                  { label: 'Excluir modelo', icon: <Delete fontSize="small" />, color: 'error', disabled: remove.isPending, onClick: () => remove.mutate(row.id) },
                ]}
              />
            )}
          />
        </AsyncState>
      </Stack>

      <FormDialog open={createOpen} onClose={closeCreate} title="Novo modelo de mensagem">
        <Stack spacing={2} sx={{ mt: 1 }}>
          {create.isSuccess ? (
            <>
              <Alert severity="success">Modelo criado com sucesso.</Alert>
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
                    onChange={(id) => {
                      field.onChange(id);
                      createForm.setValue('whatsAppAccountId', '');
                    }}
                    error={!!createForm.formState.errors.tenantId}
                    helperText={createForm.formState.errors.tenantId?.message}
                  />
                )}
              />
              <Controller
                name="whatsAppAccountId"
                control={createForm.control}
                render={({ field }) => (
                  <WhatsAppAccountAutocomplete
                    tenantId={createTenantId ?? ''}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    error={!!createForm.formState.errors.whatsAppAccountId}
                    helperText={createForm.formState.errors.whatsAppAccountId?.message}
                  />
                )}
              />
              <TextField label="Nome" {...createForm.register('name')} error={!!createForm.formState.errors.name} helperText={createForm.formState.errors.name?.message} fullWidth />
              <TextField label="Idioma" {...createForm.register('language')} error={!!createForm.formState.errors.language} helperText={createForm.formState.errors.language?.message} fullWidth />
              <TextField label="Categoria" {...createForm.register('category')} error={!!createForm.formState.errors.category} helperText={createForm.formState.errors.category?.message} fullWidth />
              <TextField label="Texto do corpo" multiline minRows={4} {...createForm.register('body')} error={!!createForm.formState.errors.body} helperText={createForm.formState.errors.body?.message} fullWidth />
              <Button type="submit" variant="contained" disabled={create.isPending}>Criar modelo</Button>
            </Stack>
          )}
        </Stack>
      </FormDialog>

      <FormDialog open={!!editing} onClose={() => setEditing(null)} title={editing ? `Editar "${editing.name}"` : 'Editar modelo'}>
        <Stack component="form" spacing={2} sx={{ mt: 1 }} onSubmit={editForm.handleSubmit((data) => update.mutate(data))}>
          {update.error && <Alert severity="error">{update.error.message}</Alert>}
          <TextField label="Categoria" {...editForm.register('category')} error={!!editForm.formState.errors.category} helperText={editForm.formState.errors.category?.message} fullWidth autoFocus />
          <TextField label="Texto do corpo" multiline minRows={4} {...editForm.register('body')} error={!!editForm.formState.errors.body} helperText={editForm.formState.errors.body?.message} fullWidth />
          <Stack direction="row" spacing={2}>
            <Button type="submit" variant="contained" disabled={update.isPending}>{update.isPending ? 'Salvando...' : 'Salvar alterações'}</Button>
            <Button type="button" variant="text" onClick={() => setEditing(null)}>Cancelar</Button>
          </Stack>
        </Stack>
      </FormDialog>
    </Stack>
  );
}
