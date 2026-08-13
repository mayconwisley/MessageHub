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
import { systemLogsApi, type SystemLog } from './system-logs.api';

const levelColors: Record<string, 'default' | 'info' | 'warning' | 'error'> = {
  trace: 'default',
  debug: 'default',
  info: 'info',
  warn: 'warning',
  error: 'error',
  fatal: 'error',
};

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export function SystemLogsTab() {
  const { page, pageSize, setPage, setPageSize } = usePagination();
  const [level, setLevel] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<SystemLog | null>(null);
  const systemLogs = useQuery({
    queryKey: ['system-logs', page, pageSize, level, search],
    queryFn: () =>
      systemLogsApi.list({ page, pageSize, level: level || undefined, search: search || undefined }),
    refetchInterval: 30_000,
  });

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <FormControl size="small" sx={{ width: 210 }}>
          <InputLabel id="log-level-filter">Nível</InputLabel>
          <Select
            labelId="log-level-filter"
            label="Nível"
            value={level}
            onChange={(event) => {
              setLevel(event.target.value);
              setPage(1);
            }}
          >
            <MenuItem value="">Todos</MenuItem>
            <MenuItem value="trace">Trace</MenuItem>
            <MenuItem value="debug">Debug</MenuItem>
            <MenuItem value="info">Info</MenuItem>
            <MenuItem value="warn">Warning</MenuItem>
            <MenuItem value="error">Error</MenuItem>
            <MenuItem value="fatal">Fatal</MenuItem>
          </Select>
        </FormControl>
        <TextField
          size="small"
          label="Buscar na mensagem"
          placeholder="ex.: falha ao processar"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          sx={{ width: 260 }}
        />
      </Stack>
      <AsyncState isLoading={systemLogs.isLoading} error={systemLogs.error}>
        <PaginatedTable<SystemLog>
          columns={[
            {
              key: 'occurredAt',
              label: 'Ocorrido em',
              render: (row) => new Date(row.occurredAt).toLocaleString('pt-BR'),
            },
            {
              key: 'level',
              label: 'Nível',
              render: (row) => (
                <Chip size="small" label={row.level} color={levelColors[row.level] ?? 'default'} />
              ),
            },
            { key: 'context', label: 'Contexto', render: (row) => row.context ?? '—' },
            { key: 'message', label: 'Mensagem', render: (row) => truncate(row.message, 100) },
          ]}
          rows={systemLogs.data?.items ?? []}
          total={systemLogs.data?.total ?? 0}
          page={systemLogs.data?.page ?? page}
          pageSize={systemLogs.data?.pageSize ?? pageSize}
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
        <DialogTitle>{selected?.message || '(sem mensagem)'}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {selected?.level.toUpperCase()} · {selected?.context ?? 'sem contexto'}
            {selected?.requestId ? ` · requestId ${selected.requestId}` : ''}
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
            {JSON.stringify(selected?.metadata, null, 2)}
          </Typography>
        </DialogContent>
      </Dialog>
    </Stack>
  );
}
