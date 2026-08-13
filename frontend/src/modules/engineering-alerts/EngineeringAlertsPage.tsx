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
  Typography,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { AsyncState } from '../../components/shared/AsyncState';
import { PaginatedTable } from '../../components/shared/PaginatedTable';
import { TableActionsMenu } from '../../components/shared/TableActionsMenu';
import { PageHeader } from '../../components/ui/PageHeader';
import { usePagination } from '../../hooks/usePagination';
import { engineeringAlertsApi, type EngineeringAlert } from './engineering-alerts.api';

export function EngineeringAlertsPage() {
  const { page, pageSize, setPage, setPageSize } = usePagination();
  const [severity, setSeverity] = useState('');
  const [selected, setSelected] = useState<EngineeringAlert | null>(null);
  const alerts = useQuery({
    queryKey: ['engineering-alerts', page, pageSize, severity],
    queryFn: () => engineeringAlertsApi.list({ page, pageSize, severity: severity || undefined }),
    refetchInterval: 30_000,
  });
  return (
    <Stack spacing={3}>
      <PageHeader
        title="Alertas de engenharia"
        description="Falhas persistentes, DLQs e degradações registradas para entrega nos canais técnicos."
      />
      <FormControl size="small" sx={{ width: 210 }}>
        <InputLabel id="alert-severity-filter">Severidade</InputLabel>
        <Select
          labelId="alert-severity-filter"
          label="Severidade"
          value={severity}
          onChange={(event) => {
            setSeverity(event.target.value);
            setPage(1);
          }}
        >
          <MenuItem value="">Todas</MenuItem>
          <MenuItem value="CRITICAL">Crítica</MenuItem>
          <MenuItem value="WARNING">Alerta</MenuItem>
        </Select>
      </FormControl>
      <AsyncState isLoading={alerts.isLoading} error={alerts.error}>
        <PaginatedTable<EngineeringAlert>
          columns={[
            {
              key: 'severity',
              label: 'Severidade',
              render: (row) => (
                <Chip
                  size="small"
                  label={row.severity}
                  color={row.severity === 'CRITICAL' ? 'error' : 'warning'}
                />
              ),
            },
            { key: 'title', label: 'Alerta' },
            {
              key: 'occurredAt',
              label: 'Ocorrido em',
              render: (row) => new Date(row.occurredAt).toLocaleString('pt-BR'),
            },
            {
              key: 'dispatchedAt',
              label: 'Entrega externa',
              render: (row) =>
                row.dispatchedAt
                  ? `Enviado ${new Date(row.dispatchedAt).toLocaleString('pt-BR')}`
                  : 'Pendente ou sem canal configurado',
            },
          ]}
          rows={alerts.data?.items ?? []}
          total={alerts.data?.total ?? 0}
          page={alerts.data?.page ?? page}
          pageSize={alerts.data?.pageSize ?? pageSize}
          onPageChange={setPage}
          onPageSizeChange={(value) => {
            setPageSize(value);
            setPage(1);
          }}
          rowActions={(row) => (
            <TableActionsMenu
              actions={[
                {
                  label: 'Ver dados técnicos',
                  icon: <VisibilityOutlined fontSize="small" />,
                  onClick: () => setSelected(row),
                },
              ]}
            />
          )}
        />
      </AsyncState>
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="md" fullWidth>
        <DialogTitle>{selected?.title}</DialogTitle>
        <DialogContent>
          <Typography>{selected?.message}</Typography>
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
