import { Alert, Button, Chip, MenuItem, Stack, TextField } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { ApplicationAutocomplete } from '../../components/shared/ApplicationAutocomplete';
import { MessageAutocomplete } from '../../components/shared/MessageAutocomplete';
import { TenantAutocomplete } from '../../components/shared/TenantAutocomplete';
import { PageHeader } from '../../components/ui/PageHeader';
import { applicationsApi } from '../applications/applications.api';
import { tenantsApi } from '../tenants/tenants.api';
import { sandboxApi } from './sandbox.api';

export function SandboxPage() {
  const [tenantId, setTenantId] = useState('');
  const [applicationId, setApplicationId] = useState('');
  const [messageId, setMessageId] = useState('');
  const [status, setStatus] = useState<'DELIVERED' | 'READ' | 'FAILED'>('DELIVERED');
  const configuration = useQuery({
    queryKey: ['sandbox-configuration'],
    queryFn: sandboxApi.configuration,
  });
  const simulate = useMutation({ mutationFn: () => sandboxApi.simulateStatus(messageId, status) });
  const isEnabled = configuration.data?.enabled && configuration.data.activeProvider === 'sandbox';

  const validTenantId = z.string().uuid().safeParse(tenantId).success;
  const validApplicationId = z.string().uuid().safeParse(applicationId).success;

  const tenants = useQuery({
    queryKey: ['tenants-select'],
    queryFn: () => tenantsApi.list({ page: 1, pageSize: 100 }),
    staleTime: 60_000,
  });
  const applications = useQuery({
    queryKey: ['applications-select', tenantId],
    queryFn: () => applicationsApi.list({ tenantId, page: 1, pageSize: 100 }),
    enabled: validTenantId,
    staleTime: 60_000,
  });

  // Reduz cliques: seleciona automaticamente quando só existe uma opção disponível.
  useEffect(() => {
    if (!tenantId && tenants.data?.items.length === 1) {
      setTenantId(tenants.data.items[0].id);
    }
  }, [tenantId, tenants.data]);
  useEffect(() => {
    if (validTenantId && !applicationId && applications.data?.items.length === 1) {
      setApplicationId(applications.data.items[0].id);
    }
  }, [validTenantId, applicationId, applications.data]);

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Ambiente sandbox"
        description="Execute integrações previsíveis sem usar a Meta e simule callbacks de entrega."
      />
      <Alert severity={isEnabled ? 'success' : 'warning'}>
        Provider ativo: <strong>{configuration.data?.activeProvider ?? 'carregando'}</strong>.{' '}
        {isEnabled
          ? 'O sandbox está pronto para simulação.'
          : 'Defina MESSAGE_PROVIDER=sandbox e SANDBOX_ENABLED=true para habilitar os testes.'}
      </Alert>
      <Stack direction="row" spacing={1}>
        <Chip label="Final 0000: rejeição permanente" variant="outlined" />
        <Chip label="Final 0001: falha transitória" variant="outlined" />
        <Chip label="Outros: aceito" variant="outlined" />
      </Stack>
      <Stack spacing={2} sx={{ maxWidth: 560 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TenantAutocomplete
            label="Tenant"
            value={tenantId}
            onChange={(id) => {
              setTenantId(id);
              setApplicationId('');
              setMessageId('');
            }}
            sx={{ flexGrow: 1 }}
          />
          <ApplicationAutocomplete
            tenantId={tenantId}
            value={applicationId}
            onChange={(id) => {
              setApplicationId(id);
              setMessageId('');
            }}
            sx={{ flexGrow: 1 }}
          />
        </Stack>
        <MessageAutocomplete
          applicationId={applicationId}
          value={messageId}
          onChange={setMessageId}
          helperText={
            validApplicationId
              ? 'Busque a mensagem enviada pelo fluxo normal antes de simular o status.'
              : undefined
          }
        />
        <TextField
          select
          label="Webhook simulado"
          value={status}
          onChange={(event) => setStatus(event.target.value as typeof status)}
          fullWidth
        >
          <MenuItem value="DELIVERED">DELIVERED</MenuItem>
          <MenuItem value="READ">READ</MenuItem>
          <MenuItem value="FAILED">FAILED</MenuItem>
        </TextField>
        <Button
          variant="contained"
          disabled={!isEnabled || !validApplicationId || !messageId || simulate.isPending}
          onClick={() => simulate.mutate()}
        >
          {simulate.isPending ? 'Simulando...' : 'Simular webhook'}
        </Button>
        {simulate.isSuccess && <Alert severity="success">Webhook simulado com sucesso.</Alert>}
        {simulate.error && <Alert severity="error">{simulate.error.message}</Alert>}
      </Stack>
    </Stack>
  );
}
