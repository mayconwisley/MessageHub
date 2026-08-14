import { Delete, Edit, Preview, Sync } from '@mui/icons-material';
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
import { AsyncState } from '../../components/shared/AsyncState';
import { FormDialog } from '../../components/shared/FormDialog';
import { PaginatedTable } from '../../components/shared/PaginatedTable';
import { TableActionsMenu } from '../../components/shared/TableActionsMenu';
import { TenantAutocomplete } from '../../components/shared/TenantAutocomplete';
import { WhatsAppAccountAutocomplete } from '../../components/shared/WhatsAppAccountAutocomplete';
import { PageHeader } from '../../components/ui/PageHeader';
import { usePagination } from '../../hooks/usePagination';
import { TemplateFormDialog } from './TemplateFormDialog';
import { bodyExampleValues } from './template-example.utils';
import { TemplateWhatsAppPreview } from './TemplateWhatsAppPreview';
import { toMutationData } from './template-form.mapper';
import type { TemplateFormData } from './template-form.schema';
import { templatesApi, type Template } from './templates.api';

const statusLabels: Record<string, string> = {
  DRAFT: 'Rascunho',
  PENDING: 'Pendente',
  APPROVED: 'Aprovado',
  REJECTED: 'Rejeitado',
  PAUSED: 'Pausado',
  DISABLED: 'Desativado',
};

function previewValues(template: Template) {
  const component = (type: string) =>
    template.components.find((item) => item.type.toUpperCase() === type);
  const button = component('BUTTONS')?.buttons?.find((item) => item.type.toUpperCase() === 'URL');
  return {
    headerText: component('HEADER')?.text,
    bodyText: component('BODY')?.text,
    footerText: component('FOOTER')?.text,
    examples: bodyExampleValues(component('BODY')).join(', '),
    buttonText: button?.text,
  };
}

export function TemplatesPage() {
  const { page, pageSize, setPage, setPageSize } = usePagination();
  const [tenantId, setTenantId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [editing, setEditing] = useState<Template | null>(null);
  const [creating, setCreating] = useState(false);
  const [previewing, setPreviewing] = useState<Template | null>(null);
  const [deleting, setDeleting] = useState<Template | null>(null);
  const client = useQueryClient();
  const isSelectionValid = Boolean(tenantId && accountId);
  const list = useQuery({
    queryKey: ['templates', tenantId, accountId, page, pageSize, status, category],
    queryFn: () =>
      templatesApi.list({
        tenantId,
        whatsAppAccountId: accountId,
        page,
        pageSize,
        status: status || undefined,
        category: category || undefined,
      }),
    enabled: isSelectionValid,
  });
  const invalidate = () =>
    client.invalidateQueries({ queryKey: ['templates', tenantId, accountId] });
  const create = useMutation({
    mutationFn: (data: TemplateFormData) => templatesApi.create(toMutationData(data)),
    onSuccess: () => {
      setCreating(false);
      void invalidate();
    },
  });
  const update = useMutation({
    mutationFn: (data: TemplateFormData) => {
      const model = toMutationData(data);
      return templatesApi.update(editing!.id, {
        tenantId: model.tenantId,
        category: model.category,
        components: model.components,
      });
    },
    onSuccess: () => {
      setEditing(null);
      void invalidate();
    },
  });
  const remove = useMutation({
    mutationFn: (template: Template) => templatesApi.delete(template.id, tenantId),
    onSuccess: () => {
      setDeleting(null);
      void invalidate();
    },
  });
  const sync = useMutation({
    mutationFn: () => templatesApi.sync(tenantId, accountId),
    onSuccess: invalidate,
  });
  const publish = useMutation({
    mutationFn: () => templatesApi.publishPending(tenantId, accountId),
    onSuccess: invalidate,
  });
  const preview = previewing ? previewValues(previewing) : null;

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Modelos de mensagem"
        description="Crie, revise, publique e sincronize modelos da Meta sem acessar o painel externo."
        action={
          <Button variant="contained" onClick={() => setCreating(true)}>
            Criar modelo
          </Button>
        }
      />
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
          <TenantAutocomplete
            label="Tenant"
            value={tenantId}
            onChange={(id) => {
              setTenantId(id);
              setAccountId('');
              setPage(1);
            }}
            sx={{ minWidth: 240 }}
          />
          <WhatsAppAccountAutocomplete
            tenantId={tenantId}
            value={accountId}
            onChange={(id) => {
              setAccountId(id);
              setPage(1);
            }}
            sx={{ minWidth: 240 }}
          />
          <FormControl size="small" sx={{ width: 180 }}>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {Object.entries(statusLabels).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            label="Categoria"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          />
          <Button
            variant="outlined"
            startIcon={<Sync />}
            disabled={!isSelectionValid || sync.isPending}
            onClick={() => sync.mutate()}
          >
            Sincronizar Meta
          </Button>
          <Button
            variant="outlined"
            disabled={!isSelectionValid || publish.isPending}
            onClick={() => publish.mutate()}
          >
            Publicar pendentes
          </Button>
        </Stack>
        {sync.error && <Alert severity="error">{sync.error.message}</Alert>}
        {sync.data && (
          <Alert severity="success">
            Sincronização concluída: {sync.data.total} modelos processados.
          </Alert>
        )}
        {publish.error && <Alert severity="error">{publish.error.message}</Alert>}
        {publish.data && (
          <Alert severity="success">
            Publicação concluída: {publish.data.total} modelos processados.
          </Alert>
        )}
        <AsyncState
          isLoading={isSelectionValid && list.isLoading}
          error={list.error}
          emptyMessage={
            isSelectionValid
              ? undefined
              : 'Selecione tenant e conta WhatsApp para gerenciar modelos.'
          }
        >
          <PaginatedTable<Template>
            columns={[
              { key: 'name', label: 'Nome' },
              { key: 'language', label: 'Idioma' },
              { key: 'category', label: 'Categoria' },
              {
                key: 'status',
                label: 'Status',
                render: (row) => (
                  <Chip label={statusLabels[row.status] ?? row.status} size="small" />
                ),
              },
              {
                key: 'lastError',
                label: 'Retorno da Meta',
                render: (row) => row.rejectedReason ?? row.lastError ?? '—',
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
                    label: 'Visualizar no WhatsApp',
                    icon: <Preview fontSize="small" />,
                    onClick: () => setPreviewing(row),
                  },
                  {
                    label: 'Editar modelo',
                    icon: <Edit fontSize="small" />,
                    onClick: () => setEditing(row),
                  },
                  {
                    label: 'Excluir modelo',
                    icon: <Delete fontSize="small" />,
                    color: 'error',
                    onClick: () => setDeleting(row),
                  },
                ]}
              />
            )}
          />
        </AsyncState>
      </Stack>
      <TemplateFormDialog
        open={creating || Boolean(editing)}
        template={editing}
        tenantId={tenantId}
        accountId={accountId}
        isSubmitting={create.isPending || update.isPending}
        error={creating ? create.error : update.error}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSubmit={(data) => (creating ? create.mutate(data) : update.mutate(data))}
      />
      <FormDialog
        open={Boolean(previewing)}
        title={previewing?.name ?? 'Visualização'}
        onClose={() => setPreviewing(null)}
      >
        <Stack alignItems="center" sx={{ mt: 1 }}>
          {preview && <TemplateWhatsAppPreview {...preview} />}
        </Stack>
      </FormDialog>
      <FormDialog open={Boolean(deleting)} title="Excluir modelo" onClose={() => setDeleting(null)}>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity="warning">
            A exclusão remove o modelo também da Meta. Esta ação não pode ser desfeita.
          </Alert>
          <Stack direction="row" spacing={2}>
            <Button
              color="error"
              variant="contained"
              disabled={remove.isPending}
              onClick={() => deleting && remove.mutate(deleting)}
            >
              Excluir
            </Button>
            <Button onClick={() => setDeleting(null)}>Cancelar</Button>
          </Stack>
        </Stack>
      </FormDialog>
    </Stack>
  );
}
