import { Alert, Button, Chip, MenuItem, Stack, TextField } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { sandboxApi } from './sandbox.api';

export function SandboxPage() {
  const [messageId, setMessageId] = useState('');
  const [status, setStatus] = useState<'DELIVERED' | 'READ' | 'FAILED'>('DELIVERED');
  const configuration = useQuery({
    queryKey: ['sandbox-configuration'],
    queryFn: sandboxApi.configuration,
  });
  const simulate = useMutation({ mutationFn: () => sandboxApi.simulateStatus(messageId, status) });
  const isEnabled = configuration.data?.enabled && configuration.data.activeProvider === 'sandbox';
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
        <TextField
          label="Message ID"
          value={messageId}
          onChange={(event) => setMessageId(event.target.value)}
          helperText="Envie uma mensagem pelo fluxo normal antes de simular o status."
          fullWidth
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
          disabled={!isEnabled || !messageId || simulate.isPending}
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
