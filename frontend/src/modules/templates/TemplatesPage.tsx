import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Chip, FormControl, InputLabel, MenuItem, Select, Stack, TextField } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AsyncState } from '../../components/shared/AsyncState';
import { FormDialog } from '../../components/shared/FormDialog';
import { PaginatedTable } from '../../components/shared/PaginatedTable';
import { PageHeader } from '../../components/ui/PageHeader';
import { usePagination } from '../../hooks/usePagination';
import { templatesApi, type Template } from './templates.api';

const createSchema = z.object({ whatsAppAccountId: z.string().uuid(), name: z.string().min(1), language: z.string().min(2), category: z.string().min(1), body: z.string().min(1) });
type CreateFormData = z.infer<typeof createSchema>;

const editSchema = z.object({ category: z.string().min(1), body: z.string().min(1) });
type EditFormData = z.infer<typeof editSchema>;

function bodyTextOf(template: Template): string {
  return template.components.find((component) => component.type === 'BODY')?.text ?? '';
}

export function TemplatesPage() {
  const { page, pageSize, setPage, setPageSize } = usePagination();
  const [accountId, setAccountId] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const client = useQueryClient();

  const createForm = useForm<CreateFormData>({ resolver: zodResolver(createSchema), defaultValues: { language: 'pt_BR', category: 'UTILITY' } });
  const editForm = useForm<EditFormData>({ resolver: zodResolver(editSchema) });

  const validAccount = z.string().uuid().safeParse(accountId).success;
  const list = useQuery({
    queryKey: ['templates', accountId, page, pageSize, status, category],
    queryFn: () => templatesApi.list({ whatsAppAccountId: accountId, page, pageSize, status: status || undefined, category: category || undefined }),
    enabled: validAccount,
  });

  const invalidateList = () => client.invalidateQueries({ queryKey: ['templates', accountId] });
  const create = useMutation({ mutationFn: templatesApi.create, onSuccess: invalidateList });
  const update = useMutation({
    mutationFn: (data: EditFormData) => templatesApi.update(editing!.id, data),
    onSuccess: () => {
      setEditing(null);
      invalidateList();
    },
  });
  const remove = useMutation({ mutationFn: templatesApi.delete, onSuccess: invalidateList });
  const sync = useMutation({ mutationFn: templatesApi.sync, onSuccess: invalidateList });
  const publishPending = useMutation({ mutationFn: templatesApi.publishPending, onSuccess: invalidateList });

  const openCreate = () => {
    createForm.reset({ language: 'pt_BR', category: 'UTILITY', whatsAppAccountId: accountId || undefined });
    create.reset();
    setCreateOpen(true);
  };
  const closeCreate = () => setCreateOpen(false);

  const startEdit = (template: Template) => {
    setEditing(template);
    editForm.reset({ category: template.category, body: bodyTextOf(template) });
  };

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Templates"
        description="Cadastre, edite e sincronize templates da conta WhatsApp selecionada."
        action={
          <Button variant="contained" onClick={openCreate} sx={{ mt: 2 }}>
            Criar template
          </Button>
        }
      />
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ flexWrap: 'wrap' }}>
          <TextField
            label="ID da conta WhatsApp"
            value={accountId}
            onChange={(event) => {
              setAccountId(event.target.value);
              setPage(1);
            }}
            sx={{ minWidth: 320 }}
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
                <MenuItem key={value} value={value}>{value}</MenuItem>
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
          <Button type="button" variant="outlined" onClick={() => sync.mutate(accountId)} disabled={!validAccount || sync.isPending} sx={{ whiteSpace: 'nowrap' }}>Sincronizar com Meta</Button>
          <Button type="button" variant="outlined" onClick={() => publishPending.mutate(accountId)} disabled={!validAccount || publishPending.isPending} sx={{ whiteSpace: 'nowrap' }}>Publicar pendentes</Button>
        </Stack>
        {sync.data && <Alert severity="success">Sincronização concluída: {sync.data.total} templates processados.</Alert>}
        {publishPending.data && <Alert severity="success">Publicação concluída: {publishPending.data.total} templates processados.</Alert>}
        <AsyncState isLoading={validAccount && list.isLoading} error={list.error} emptyMessage={validAccount ? undefined : 'Informe uma conta válida para listar os templates.'}>
          <PaginatedTable<Template>
            columns={[
              { key: 'name', label: 'Nome' },
              { key: 'language', label: 'Idioma' },
              { key: 'category', label: 'Categoria' },
              { key: 'status', label: 'Status', render: (row) => <Chip label={row.status} size="small" /> },
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
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button size="small" onClick={() => startEdit(row)}>Editar</Button>
                <Button size="small" color="error" onClick={() => remove.mutate(row.id)} disabled={remove.isPending}>Excluir</Button>
              </Stack>
            )}
          />
        </AsyncState>
      </Stack>

      <FormDialog open={createOpen} onClose={closeCreate} title="Novo template">
        <Stack spacing={2} sx={{ mt: 1 }}>
          {create.isSuccess ? (
            <>
              <Alert severity="success">Template criado com sucesso.</Alert>
              <Button variant="contained" onClick={closeCreate}>
                Fechar
              </Button>
            </>
          ) : (
            <Stack component="form" spacing={2} onSubmit={createForm.handleSubmit((data) => create.mutate(data))}>
              {create.error && <Alert severity="error">{create.error.message}</Alert>}
              <TextField label="ID da conta WhatsApp" {...createForm.register('whatsAppAccountId')} error={!!createForm.formState.errors.whatsAppAccountId} helperText={createForm.formState.errors.whatsAppAccountId?.message} fullWidth autoFocus />
              <TextField label="Nome" {...createForm.register('name')} fullWidth />
              <TextField label="Idioma" {...createForm.register('language')} fullWidth />
              <TextField label="Categoria" {...createForm.register('category')} fullWidth />
              <TextField label="Texto do corpo" multiline minRows={4} {...createForm.register('body')} fullWidth />
              <Button type="submit" variant="contained" disabled={create.isPending}>Criar template</Button>
            </Stack>
          )}
        </Stack>
      </FormDialog>

      <FormDialog open={!!editing} onClose={() => setEditing(null)} title={editing ? `Editar "${editing.name}"` : 'Editar template'}>
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
