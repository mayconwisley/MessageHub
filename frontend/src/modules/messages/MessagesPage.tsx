import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Card, CardContent, Chip, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AsyncState } from '../../components/shared/AsyncState';
import { EntityResult } from '../../components/shared/EntityResult';
import { FormDialog } from '../../components/shared/FormDialog';
import { PaginatedTable } from '../../components/shared/PaginatedTable';
import { PageHeader } from '../../components/ui/PageHeader';
import { usePagination } from '../../hooks/usePagination';
import { messagesApi, type Message } from './messages.api';

const schema = z.object({ phoneNumberId: z.string().uuid(), to: z.string().min(8), content: z.string().min(1).max(4096) });
type FormData = z.infer<typeof schema>;

export function MessagesPage() {
  const { page, pageSize, setPage, setPageSize } = usePagination();
  const [status, setStatus] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sendOpen, setSendOpen] = useState(false);
  const form = useForm<FormData>({ resolver: zodResolver(schema) });
  const send = useMutation({ mutationFn: messagesApi.send });
  const get = useMutation({ mutationFn: messagesApi.get });
  const list = useQuery({
    queryKey: ['messages', page, pageSize, status],
    queryFn: () => messagesApi.list({ page, pageSize, status: status || undefined }),
  });
  const attempts = useQuery({
    queryKey: ['message-attempts', selectedId],
    queryFn: () => messagesApi.listAttempts(selectedId as string),
    enabled: !!selectedId,
  });

  const openSend = () => {
    form.reset();
    send.reset();
    setSendOpen(true);
  };
  const closeSend = () => setSendOpen(false);

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Mensagens"
        description="Envie uma mensagem de texto e acompanhe o estado assíncrono do processamento."
        action={
          <Button variant="contained" onClick={openSend} sx={{ mt: 2 }}>
            Enviar mensagem
          </Button>
        }
      />
      <Card variant="outlined">
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} component="form" spacing={2} onSubmit={(event) => { event.preventDefault(); const id = new FormData(event.currentTarget).get('id'); if (typeof id === 'string' && id) get.mutate(id); }}>
            <TextField name="id" label="ID da mensagem" fullWidth />
            <Button type="submit" variant="outlined" sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>Consultar status</Button>
          </Stack>
          {get.error && <Alert severity="error" sx={{ mt: 2 }}>{get.error.message}</Alert>}
          {get.data && (
            <Stack sx={{ mt: 2 }}>
              <EntityResult title="Resultado da consulta" data={get.data} />
            </Stack>
          )}
        </CardContent>
      </Card>
      <Stack spacing={2}>
        <FormControl size="small" sx={{ width: 220 }}>
          <InputLabel id="message-status-filter">Status</InputLabel>
          <Select
            labelId="message-status-filter"
            label="Status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <MenuItem value="">Todos</MenuItem>
            {['PENDING', 'PROCESSING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'RETRY'].map((value) => (
              <MenuItem key={value} value={value}>{value}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <AsyncState isLoading={list.isLoading} error={list.error}>
          <PaginatedTable<Message>
            columns={[
              { key: 'to', label: 'Destinatário' },
              { key: 'type', label: 'Tipo' },
              { key: 'status', label: 'Status', render: (row) => <Chip label={row.status} size="small" /> },
              { key: 'attemptCount', label: 'Tentativas' },
              { key: 'createdAt', label: 'Criado em', render: (row) => new Date(row.createdAt).toLocaleString('pt-BR') },
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
              <Button size="small" onClick={() => setSelectedId(row.id)}>Tentativas</Button>
            )}
          />
        </AsyncState>
      </Stack>

      <FormDialog open={sendOpen} onClose={closeSend} title="Enviar mensagem">
        <Stack spacing={2} sx={{ mt: 1 }}>
          {send.isSuccess ? (
            <>
              <Alert severity="success">Mensagem enviada com sucesso.</Alert>
              <EntityResult title="Última mensagem" data={send.data ?? null} />
              <Button variant="contained" onClick={closeSend}>
                Fechar
              </Button>
            </>
          ) : (
            <Stack component="form" spacing={2} onSubmit={form.handleSubmit((data) => send.mutate(data))}>
              {send.error && <Alert severity="error">{send.error.message}</Alert>}
              <TextField label="ID do número remetente" {...form.register('phoneNumberId')} error={!!form.formState.errors.phoneNumberId} helperText={form.formState.errors.phoneNumberId?.message} fullWidth autoFocus />
              <TextField label="Destinatário" placeholder="+5511999999999" {...form.register('to')} fullWidth />
              <TextField label="Mensagem" multiline minRows={4} {...form.register('content')} fullWidth />
              <Button type="submit" variant="contained" disabled={send.isPending}>{send.isPending ? 'Enviando...' : 'Enviar mensagem'}</Button>
            </Stack>
          )}
        </Stack>
      </FormDialog>

      <FormDialog open={!!selectedId} onClose={() => setSelectedId(null)} title="Tentativas de entrega">
        <Stack sx={{ mt: 1 }}>
          <AsyncState isLoading={attempts.isLoading} error={attempts.error} emptyMessage={attempts.data?.length === 0 ? 'Nenhuma tentativa registrada.' : undefined}>
            <Stack spacing={1}>
              {attempts.data?.map((attempt) => (
                <Stack key={attempt.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Typography>#{attempt.attemptNumber} · {new Date(attempt.occurredAt).toLocaleString('pt-BR')}</Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {attempt.errorMessage && <Typography color="error" variant="body2">{attempt.errorMessage}</Typography>}
                    <Chip label={attempt.status} size="small" />
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </AsyncState>
        </Stack>
      </FormDialog>
    </Stack>
  );
}
