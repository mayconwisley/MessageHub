import { zodResolver } from '@hookform/resolvers/zod';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { TenantAutocomplete } from '../../components/shared/TenantAutocomplete';
import type { User } from './users.api';

const roleLabels: Record<string, string> = {
  platform_admin: 'Administrador da plataforma',
  tenant_admin: 'Administrador do tenant',
  operator: 'Operador',
};

function buildSchema(isEditing: boolean) {
  return z
    .object({
      name: z.string().min(2, 'Informe ao menos 2 caracteres.'),
      email: z.string().email('Informe um e-mail válido.'),
      password: isEditing
        ? z.string().optional()
        : z.string().min(12, 'A senha deve ter ao menos 12 caracteres.'),
      role: z.enum(['platform_admin', 'tenant_admin', 'operator']),
      tenantId: z.string().uuid('Informe um UUID válido.').optional().or(z.literal('')),
    })
    .superRefine((value, context) => {
      if (value.role !== 'platform_admin' && !value.tenantId) {
        context.addIssue({
          code: 'custom',
          path: ['tenantId'],
          message: 'Obrigatório para usuários não globais.',
        });
      }
    });
}
export type UserFormData = z.infer<ReturnType<typeof buildSchema>>;

function formValues(user: User | null | undefined): UserFormData {
  return {
    name: user?.name ?? '',
    email: user?.email ?? '',
    password: '',
    role: user?.role ?? 'tenant_admin',
    tenantId: user?.tenantId ?? '',
  };
}

export function UserFormDialog({
  open,
  user,
  isSubmitting,
  error,
  onClose,
  onSubmit,
}: {
  open: boolean;
  user?: User | null;
  isSubmitting: boolean;
  error?: Error | null;
  onClose: () => void;
  onSubmit: (data: UserFormData) => void;
}) {
  const isEditing = Boolean(user);
  const form = useForm<UserFormData>({
    resolver: zodResolver(buildSchema(isEditing)),
    values: formValues(user),
  });
  const role = form.watch('role');

  return (
    <Dialog open={open} onClose={isSubmitting ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{isEditing ? `Editar usuário "${user?.name}"` : 'Criar usuário'}</DialogTitle>
      <DialogContent>
        <Stack
          component="form"
          id="user-form"
          spacing={2}
          sx={{ mt: 1 }}
          onSubmit={form.handleSubmit(onSubmit)}
        >
          {error && <Alert severity="error">{error.message}</Alert>}
          <TextField
            label="Nome"
            {...form.register('name')}
            error={!!form.formState.errors.name}
            helperText={form.formState.errors.name?.message}
            fullWidth
            autoFocus
          />
          <TextField
            label="E-mail"
            type="email"
            autoComplete="off"
            {...form.register('email')}
            error={!!form.formState.errors.email}
            helperText={form.formState.errors.email?.message}
            fullWidth
          />
          {!isEditing && (
            <TextField
              label="Senha"
              type="password"
              autoComplete="new-password"
              {...form.register('password')}
              error={!!form.formState.errors.password}
              helperText={form.formState.errors.password?.message}
              fullWidth
            />
          )}
          <TextField label="Papel" select {...form.register('role')} fullWidth>
            <MenuItem value="platform_admin">{roleLabels.platform_admin}</MenuItem>
            <MenuItem value="tenant_admin">{roleLabels.tenant_admin}</MenuItem>
            <MenuItem value="operator">{roleLabels.operator}</MenuItem>
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
                  helperText={
                    form.formState.errors.tenantId?.message ??
                    'Obrigatório para usuários não globais.'
                  }
                />
              )}
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" form="user-form" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar usuário'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
