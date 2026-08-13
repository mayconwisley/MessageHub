import { VisibilityOutlined } from '@mui/icons-material';
import {
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { AsyncState } from '../../components/shared/AsyncState';
import { PaginatedTable } from '../../components/shared/PaginatedTable';
import { TableActionsMenu } from '../../components/shared/TableActionsMenu';
import { usePagination } from '../../hooks/usePagination';
import { auditLogsApi, type AuditLog } from './audit-logs.api';

const methodColors: Record<string, 'success' | 'info' | 'warning' | 'error'> = {
  POST: 'success',
  PUT: 'info',
  PATCH: 'info',
  DELETE: 'error',
};

export function EventsTab() {
  const { page, pageSize, setPage, setPageSize } = usePagination();
  const [httpMethod, setHttpMethod] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [selected, setSelected] = useState<AuditLog | null>(null);
  const auditLogs = useQuery({
    queryKey: ['audit-logs', page, pageSize, httpMethod, resourceType],
    queryFn: () =>
      auditLogsApi.list({
        page,
        pageSize,
        httpMethod: httpMethod || undefined,
        resourceType: resourceType || undefined,
      }),
    refetchInterval: 30_000,
  });

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <FormControl size="small" sx={{ width: 210 }}>
          <InputLabel id="audit-method-filter">Método</InputLabel>
          <Select
            labelId="audit-method-filter"
            label="Método"
            value={httpMethod}
            onChange={(event) => {
              setHttpMethod(event.target.value);
              setPage(1);
            }}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="POST">POST</MenuItem>
            <MenuItem value="PUT">PUT</MenuItem>
            <MenuItem value="PATCH">PATCH</MenuItem>
            <MenuItem value="DELETE">DELETE</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small"
          label="Tipo de recurso"
          placeholder="ex.: tenants, users"
          value={resourceType}
          onChange={(event) => {
            setResourceType(event.target.value);
            setPage(1);
          }}
          sx={{ width: 240 }}
        />
      </Stack>
      <AsyncState isLoading={auditLogs.isLoading} error={auditLogs.error}>
        <PaginatedTable<AuditLog>
          columns={[
            {
              key: 'occurredAt',
              label: 'Ocorrido em',
              render: (row) => new Date(row.occurredAt).toLocaleString('pt-BR'),
            },
            { key: 'actorEmail', label: 'Ator', render: (row) => row.actorEmail ?? '—' },
            {
              key: 'httpMethod',
              label: 'Método',
              render: (row) => (
                <Chip
                  size="small"
                  label={row.httpMethod}
                  color={methodColors[row.httpMethod] ?? 'default'}
                />
              ),
            },
            { key: 'resourceType', label: 'Recurso' },
            { key: 'httpPath', label: 'Rota' },
            {
              key: 'httpStatus',
              label: 'Status',
              render: (row) => (
                <Chip
                  size="small"
                  label={row.httpStatus}
                  color={row.httpStatus >= 400 ? 'error' : 'success'}
                />
              ),
            },
          ]}
          rows={auditLogs.data?.items ?? []}
          total={auditLogs.data?.total ?? 0}
          page={auditLogs.data?.page ?? page}
          pageSize={auditLogs.data?.pageSize ?? pageSize}
          onPageChange={setPage}
          onPageSizeChange={(value) => {
            setPageSize(value);
            setPage(1);
          }}
          rowActions={(row) => (
            <TableActionsMenu
              actions={[
                {
                  label: 'Ver detalhes',
                  icon: <VisibilityOutlined fontSize="small" />,
                  onClick: () => setSelected(row),
                },
              ]}
            />
          )}
        />
      </AsyncState>
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="md" fullWidth>
        <DialogTitle>{selected?.action}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {selected?.httpMethod} {selected?.httpPath} · status {selected?.httpStatus}
          </Typography>
          <Typography
            component="pre"
            sx={{
              mt: 2,
              p: 2,
              overflow: 'auto',
              bgcolor: 'action.hover',
              borderRadius: 1,
              fontSize: 12,
            }}
          >
            {JSON.stringify(
              {
                requestId: selected?.requestId,
                tenantId: selected?.tenantId,
                resourceId: selected?.resourceId,
                metadata: selected?.metadata,
              },
              null,
              2,
            )}
          </Typography>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
