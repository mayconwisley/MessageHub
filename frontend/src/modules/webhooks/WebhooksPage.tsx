import { ReplayOutlined, VisibilityOutlined } from '@mui/icons-material';
import {
  Alert,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { AsyncState } from '../../components/shared/AsyncState';
import { CodeBlock } from '../../components/shared/CodeBlock';
import { FeedbackSnackbar } from '../../components/shared/FeedbackSnackbar';
import { PaginatedTable } from '../../components/shared/PaginatedTable';
import { TableActionsMenu } from '../../components/shared/TableActionsMenu';
import { PageHeader } from '../../components/ui/PageHeader';
import { useFeedback } from '../../hooks/useFeedback';
import { usePagination } from '../../hooks/usePagination';
import { useSort } from '../../hooks/useSort';
import { webhooksApi, type WebhookEvent } from './webhooks.api';

const statusLabels: Record<string, string> = {
  PENDING: 'Pendente',
  PROCESSED: 'Processado',
  FAILED: 'Falhou / DLQ',
};

export function WebhooksPage() {
  const { page, pageSize, setPage, setPageSize } = usePagination();
  const { sort, onSortChange, sortBy, sortDirection } = useSort(() => setPage(1));
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState<WebhookEvent | null>(null);
  const queryClient = useQueryClient();
  const { feedback, notifySuccess, notifyError, clear } = useFeedback();
  const events = useQuery({
    queryKey: ['webhook-events', page, pageSize, status, sortBy, sortDirection],
    queryFn: () =>
      webhooksApi.list({ page, pageSize, status: status || undefined, sortBy, sortDirection }),
  });
  const reprocess = useMutation({
    mutationFn: webhooksApi.reprocess,
    onSuccess: () => {
      notifySuccess('Evento reenviado para reprocessamento.');
      void queryClient.invalidateQueries({ queryKey: ['webhook-events'] });
    },
    onError: (error) => notifyError('Não foi possível reprocessar o evento.', error),
  });

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Central de webhooks"
        description="Eventos recebidos da Meta, com payload mascarado, processamento e reenvio auditável."
      />
      <Alert severity="info">
        O reprocessamento é permitido apenas para eventos que esgotaram as tentativas; a ação fica
        na auditoria técnica.
      </Alert>
      <FormControl size="small" sx={{ width: 210 }}>
        <InputLabel id="webhook-status-filter">Status</InputLabel>
        <Select
          labelId="webhook-status-filter"
          label="Status"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="PENDING">Pendente</MenuItem>
          <MenuItem value="PROCESSED">Processado</MenuItem>
          <MenuItem value="FAILED">Falhou / DLQ</MenuItem>
        </Select>
      </FormControl>
      <AsyncState isLoading={events.isLoading} error={events.error}>
        <PaginatedTable<WebhookEvent>
          columns={[
            { key: 'provider', label: 'Provedor' },
            {
              key: 'status',
              label: 'Status',
              sortable: true,
              render: (row) => (
                <Chip
                  size="small"
                  label={statusLabels[row.status] ?? row.status}
                  color={
                    row.status === 'FAILED'
                      ? 'error'
                      : row.status === 'PROCESSED'
                        ? 'success'
                        : 'warning'
                  }
                />
              ),
            },
            { key: 'attemptCount', label: 'Tentativas' },
            {
              key: 'receivedAt',
              label: 'Recebido em',
              sortable: true,
              render: (row) => new Date(row.receivedAt).toLocaleString('pt-BR'),
            },
            { key: 'failureReason', label: 'Motivo', render: (row) => row.failureReason ?? '—' },
          ]}
          rows={events.data?.items ?? []}
          total={events.data?.total ?? 0}
          page={events.data?.page ?? page}
          pageSize={events.data?.pageSize ?? pageSize}
          onPageChange={setPage}
          onPageSizeChange={(value) => {
            setPageSize(value);
            setPage(1);
          }}
          sort={sort}
          onSortChange={onSortChange}
          rowActions={(row) => (
            <TableActionsMenu
              actions={[
                {
                  label: 'Ver payload mascarado',
                  icon: <VisibilityOutlined fontSize="small" />,
                  onClick: () => setSelected(row),
                },
                {
                  label: 'Reprocessar',
                  icon: <ReplayOutlined fontSize="small" />,
                  disabled: row.status !== 'FAILED' || reprocess.isPending,
                  onClick: () => reprocess.mutate(row.id),
                },
              ]}
            />
          )}
        />
      </AsyncState>
      <Dialog open={!!selected} onClose={() => setSelected(null)} fullWidth maxWidth="md">
        <DialogTitle>Payload mascarado do webhook</DialogTitle>
        <DialogContent>
          <CodeBlock code={JSON.stringify(selected?.payload, null, 2)} />
          <Button sx={{ mt: 2 }} onClick={() => setSelected(null)}>
            Fechar
          </Button>
        </DialogContent>
      </Dialog>

      <FeedbackSnackbar feedback={feedback} onClose={clear} />
    </Stack>
  );
}
