import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { EntityResult } from '../../components/shared/EntityResult';
import { FormDialog } from '../../components/shared/FormDialog';
import { TenantAutocomplete } from '../../components/shared/TenantAutocomplete';
import { PageHeader } from '../../components/ui/PageHeader';
import { usersApi } from './users.api';

const schema = z.object({
  name: z.string().min(2, 'Informe ao menos 2 caracteres.'),
  email: z.string().email('Informe um e-mail válido.'),
  password: z.string().min(12, 'A senha deve ter ao menos 12 caracteres.'),
  role: z.enum(['platform_admin', 'tenant_admin', 'operator']),
  tenantId: z.string().uuid('Informe um UUID válido.').optional().or(z.literal('')),
});
type FormData = z.infer<typeof schema>;

export function UsersPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { role: 'tenant_admin' } });
  const create = useMutation({
    mutationFn: (data: FormData) => usersApi.create({ ...data, tenantId: data.tenantId || undefined }),
  });
  const role = form.watch('role');

  const openCreate = () => {
    form.reset({ role: 'tenant_admin' });
    create.reset();
    setCreateOpen(true);
  };
  const closeCreate = () => setCreateOpen(false);

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Usuários"
        description="Crie usuários administrativos do Message Hub e vincule-os a um tenant quando necessário."
        action={
          <Button variant="contained" onClick={openCreate} sx={{ mt: 2 }}>
            Criar usuário
          </Button>
        }
      />
      <Typography color="text.secondary">A listagem de usuários ainda não está disponível na API.</Typography>

      <FormDialog open={createOpen} onClose={closeCreate} title="Criar usuário">
        <Stack spacing={2} sx={{ mt: 1 }}>
          {create.isSuccess ? (
            <>
              <Alert severity="success">Usuário criado com sucesso.</Alert>
              <EntityResult title="Usuário criado" data={create.data ?? null} />
              <Button variant="contained" onClick={closeCreate}>
                Fechar
              </Button>
            </>
          ) : (
            <Stack component="form" spacing={2} onSubmit={form.handleSubmit((data) => create.mutate(data))}>
              {create.error && <Alert severity="error">{create.error.message}</Alert>}
              <TextField label="Nome" {...form.register('name')} error={!!form.formState.errors.name} helperText={form.formState.errors.name?.message} fullWidth autoFocus />
              <TextField label="E-mail" type="email" autoComplete="off" {...form.register('email')} error={!!form.formState.errors.email} helperText={form.formState.errors.email?.message} fullWidth />
              <TextField label="Senha" type="password" autoComplete="new-password" {...form.register('password')} error={!!form.formState.errors.password} helperText={form.formState.errors.password?.message} fullWidth />
              <TextField label="Papel" select {...form.register('role')} fullWidth>
                <MenuItem value="platform_admin">platform_admin</MenuItem>
                <MenuItem value="tenant_admin">tenant_admin</MenuItem>
                <MenuItem value="operator">operator</MenuItem>
              </TextField>
              {role !== 'platform_admin' && (
                <Controller
                  name="tenantId"
                  control={form.control}
                  render={({ field }) => (
                    <TenantAutocomplete
                      label="Tenant"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      error={!!form.formState.errors.tenantId}
                      helperText={form.formState.errors.tenantId?.message ?? 'Obrigatório para usuários não globais.'}
                    />
                  )}
                />
              )}
              <Button type="submit" variant="contained" disabled={create.isPending}>
                {create.isPending ? 'Criando...' : 'Criar usuário'}
              </Button>
            </Stack>
          )}
        </Stack>
      </FormDialog>
    </Stack>
  );
}
