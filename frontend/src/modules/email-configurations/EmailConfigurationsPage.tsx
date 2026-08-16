import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { AsyncState } from '../../components/shared/AsyncState';
import { TenantAutocomplete } from '../../components/shared/TenantAutocomplete';
import { PageHeader } from '../../components/ui/PageHeader';
import { emailConfigurationsApi } from './email-configurations.api';

const schema = z.object({
  tenantId: z.string().uuid('Selecione um tenant.'),
  host: z.string().min(1, 'Informe o servidor SMTP.'),
  port: z.coerce.number().int().min(1).max(65535),
  secure: z.boolean(),
  username: z.string().min(1, 'Informe o usuário SMTP.'),
  password: z.string().min(1, 'Informe a senha SMTP.'),
  fromEmail: z.string().email('Informe um e-mail de remetente válido.'),
  fromName: z.string().min(1, 'Informe o nome do remetente.'),
});
type FormData = z.infer<typeof schema>;

export function EmailConfigurationsPage() {
  const [tenantId, setTenantId] = useState('');
  const client = useQueryClient();
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { port: 587, secure: false, fromName: 'Message Hub' },
  });
  const validTenant = z.string().uuid().safeParse(tenantId).success;
  const configuration = useQuery({
    queryKey: ['email-smtp-configuration', tenantId],
    queryFn: () => emailConfigurationsApi.getSmtp(tenantId),
    enabled: validTenant,
  });
  const save = useMutation({
    mutationFn: emailConfigurationsApi.configureSmtp,
    onSuccess: (value) => {
      form.reset({
        tenantId,
        host: value.host ?? '',
        port: value.port ?? 587,
        secure: value.secure ?? false,
        username: value.username ?? '',
        password: '',
        fromEmail: value.fromEmail ?? '',
        fromName: value.fromName ?? 'Message Hub',
      });
      void client.invalidateQueries({ queryKey: ['email-smtp-configuration', tenantId] });
    },
  });
  const remove = useMutation({
    mutationFn: emailConfigurationsApi.removeSmtp,
    onSuccess: () => {
      form.reset({
        tenantId,
        host: '',
        port: 587,
        secure: false,
        username: '',
        password: '',
        fromEmail: '',
        fromName: 'Message Hub',
      });
      void client.invalidateQueries({ queryKey: ['email-smtp-configuration', tenantId] });
    },
  });

  const selectTenant = (value: string) => {
    setTenantId(value);
    form.reset({
      tenantId: value,
      host: '',
      port: 587,
      secure: false,
      username: '',
      password: '',
      fromEmail: '',
      fromName: 'Message Hub',
    });
    save.reset();
    remove.reset();
  };

  return (
    <Stack spacing={3}>
      <PageHeader
        title="E-mail SMTP"
        description="Configure o SMTP específico do tenant. Sem override, os envios usam o SMTP padrão da plataforma quando habilitado."
      />
      <TenantAutocomplete label="Tenant" value={tenantId} onChange={selectTenant} />
      {!validTenant ? (
        <Alert severity="info">Selecione um tenant para consultar ou configurar o SMTP.</Alert>
      ) : (
        <AsyncState isLoading={configuration.isLoading} error={configuration.error}>
          <>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="subtitle2">Origem atual:</Typography>
                <Chip
                  size="small"
                  color={configuration.data?.source === 'tenant' ? 'primary' : 'default'}
                  label={
                    configuration.data?.source === 'tenant'
                      ? 'SMTP do tenant'
                      : configuration.data?.source === 'default'
                        ? 'SMTP padrão da plataforma'
                        : 'Não configurado'
                  }
                />
              </Stack>
              {configuration.data?.source === 'default' && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  O SMTP padrão será usado. Seus detalhes permanecem restritos à plataforma.
                </Typography>
              )}
            </Paper>
            <Box component="form" onSubmit={form.handleSubmit((data) => save.mutate(data))}>
              <Stack spacing={2} sx={{ maxWidth: 640 }}>
                {save.isError && <Alert severity="error">{save.error.message}</Alert>}
                {remove.isError && <Alert severity="error">{remove.error.message}</Alert>}
                <TextField
                  label="Servidor SMTP"
                  {...form.register('host')}
                  error={!!form.formState.errors.host}
                  helperText={form.formState.errors.host?.message}
                />
                <TextField
                  label="Porta"
                  type="number"
                  {...form.register('port')}
                  error={!!form.formState.errors.port}
                  helperText={form.formState.errors.port?.message}
                />
                <Controller
                  name="secure"
                  control={form.control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          onChange={(_, checked) => field.onChange(checked)}
                        />
                      }
                      label="SMTPS direto (normalmente porta 465)"
                    />
                  )}
                />
                <TextField
                  label="Usuário SMTP"
                  {...form.register('username')}
                  error={!!form.formState.errors.username}
                  helperText={form.formState.errors.username?.message}
                />
                <TextField
                  label="Senha SMTP"
                  type="password"
                  autoComplete="new-password"
                  {...form.register('password')}
                  error={!!form.formState.errors.password}
                  helperText={
                    form.formState.errors.password?.message ??
                    'A senha é cifrada e não é exibida novamente.'
                  }
                />
                <TextField
                  label="E-mail remetente"
                  {...form.register('fromEmail')}
                  error={!!form.formState.errors.fromEmail}
                  helperText={form.formState.errors.fromEmail?.message}
                />
                <TextField
                  label="Nome remetente"
                  {...form.register('fromName')}
                  error={!!form.formState.errors.fromName}
                  helperText={form.formState.errors.fromName?.message}
                />
                <Stack direction="row" spacing={1}>
                  <Button type="submit" variant="contained" disabled={save.isPending}>
                    Salvar SMTP do tenant
                  </Button>
                  {configuration.data?.source === 'tenant' && (
                    <Button
                      color="inherit"
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(tenantId)}
                    >
                      Usar SMTP padrão
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Box>
          </>
        </AsyncState>
      )}
    </Stack>
  );
}
