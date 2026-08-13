import { Alert, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ApplicationAutocomplete } from '../../components/shared/ApplicationAutocomplete';
import { AsyncState } from '../../components/shared/AsyncState';
import { PaginatedTable } from '../../components/shared/PaginatedTable';
import { TenantAutocomplete } from '../../components/shared/TenantAutocomplete';
import { PageHeader } from '../../components/ui/PageHeader';
import { monitoringApi } from './monitoring.api';

export function MonitoringPage() {
  const [tenantId, setTenantId] = useState('');
  const [applicationId, setApplicationId] = useState('');
  const monitor = useQuery({
    queryKey: ['integration-monitor', applicationId],
    queryFn: () => monitoringApi.getApplication(applicationId),
    enabled: !!applicationId,
  });
  return (
    <Stack spacing={3}>
      <PageHeader
        title="Monitor de integrações"
        description="Saúde e capacidade por aplicação, credencial, número e conta WhatsApp."
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TenantAutocomplete
          value={tenantId}
          onChange={(id) => {
            setTenantId(id);
            setApplicationId('');
          }}
          sx={{ minWidth: 300 }}
        />
        <ApplicationAutocomplete
          tenantId={tenantId}
          value={applicationId}
          onChange={setApplicationId}
          sx={{ minWidth: 300 }}
        />
      </Stack>
      <AsyncState
        isLoading={monitor.isLoading}
        error={monitor.error}
        emptyMessage={
          applicationId ? undefined : 'Selecione uma aplicação para consultar o monitor.'
        }
      >
        {monitor.data && (
          <>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Card variant="outlined" sx={{ flex: 1 }}>
                <CardContent>
                  <Typography variant="h6">Quotas</Typography>
                  <Typography>
                    {monitor.data.application.usedLastMinute} /{' '}
                    {monitor.data.application.quotaPerMinute} por minuto
                  </Typography>
                  <Typography>
                    {monitor.data.application.usedLastDay} / {monitor.data.application.quotaPerDay}{' '}
                    por dia
                  </Typography>
                  <Chip
                    label={monitor.data.application.quotaStatus}
                    color={
                      monitor.data.application.quotaStatus === 'HEALTHY' ? 'success' : 'warning'
                    }
                    size="small"
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
              <Card variant="outlined" sx={{ flex: 1 }}>
                <CardContent>
                  <Typography variant="h6">Entrega (24h)</Typography>
                  <Typography>
                    {monitor.data.delivery.sentLast24Hours} concluídas ·{' '}
                    {monitor.data.delivery.failedLast24Hours} falhas
                  </Typography>
                  <Typography color="text.secondary">
                    Taxa de falha: {monitor.data.delivery.failureRate}%
                  </Typography>
                </CardContent>
              </Card>
            </Stack>
            {monitor.data.delivery.failureRate >= 10 && (
              <Alert severity="warning">
                A taxa de falha está acima de 10%. Verifique a DLQ e as credenciais.
              </Alert>
            )}
            <Typography variant="h6">Credenciais de API</Typography>
            <PaginatedTable
              columns={[
                { key: 'prefix', label: 'Chave' },
                {
                  key: 'health',
                  label: 'Saúde',
                  render: (row) => (
                    <Chip
                      size="small"
                      label={row.health}
                      color={row.health === 'HEALTHY' ? 'success' : 'warning'}
                    />
                  ),
                },
                {
                  key: 'expiresInDays',
                  label: 'Expira em',
                  render: (row) =>
                    row.expiresInDays === null ? 'Sem expiração' : `${row.expiresInDays} dias`,
                },
                {
                  key: 'lastUsedAt',
                  label: 'Último uso',
                  render: (row) =>
                    row.lastUsedAt ? new Date(row.lastUsedAt).toLocaleString('pt-BR') : 'Nunca',
                },
              ]}
              rows={monitor.data.apiKeys}
              total={monitor.data.apiKeys.length}
              page={1}
              pageSize={100}
              onPageChange={() => undefined}
              onPageSizeChange={() => undefined}
            />
            <Typography variant="h6">Números e credenciais Meta</Typography>
            <PaginatedTable
              columns={[
                { key: 'displayNumber', label: 'Número' },
                {
                  key: 'health',
                  label: 'Canal',
                  render: (row) => (
                    <Chip
                      size="small"
                      label={row.health}
                      color={row.health === 'HEALTHY' ? 'success' : 'error'}
                    />
                  ),
                },
                {
                  key: 'credentialHealth',
                  label: 'Credencial',
                  render: (row) => (
                    <Chip
                      size="small"
                      label={row.credentialHealth}
                      color={row.credentialHealth === 'HEALTHY' ? 'success' : 'warning'}
                    />
                  ),
                },
                {
                  key: 'credentialExpiresAt',
                  label: 'Expira em',
                  render: (row) =>
                    row.credentialExpiresAt
                      ? new Date(row.credentialExpiresAt).toLocaleString('pt-BR')
                      : 'Não informado',
                },
              ]}
              rows={monitor.data.phoneNumbers}
              total={monitor.data.phoneNumbers.length}
              page={1}
              pageSize={100}
              onPageChange={() => undefined}
              onPageSizeChange={() => undefined}
            />
          </>
        )}
      </AsyncState>
    </Stack>
  );
}
