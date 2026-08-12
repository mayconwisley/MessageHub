import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Box, Button, Paper, TextField, Typography } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { authStorage } from '../../services/auth-storage';
import { login } from './auth.api';

const schema = z.object({ email: z.string().email('Informe um e-mail válido.'), password: z.string().min(1, 'Informe a senha.') });
type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const form = useForm<FormData>({ resolver: zodResolver(schema) });
  const mutation = useMutation({ mutationFn: login, onSuccess: (session) => { authStorage.setSessionToken(session.token); navigate('/'); } });
  return <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2, bgcolor: '#eaf4ef' }}><Paper component="main" elevation={0} sx={{ width: '100%', maxWidth: 440, p: 4, borderRadius: 3 }}><Typography variant="h4" component="h1">Message Hub</Typography><Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>Acesse o console administrativo.</Typography>{mutation.error && <Alert severity="error" sx={{ mb: 2 }}>{mutation.error.message}</Alert>}<Box component="form" onSubmit={form.handleSubmit((data) => mutation.mutate(data))} noValidate sx={{ display: 'grid', gap: 2 }}><TextField label="E-mail" autoComplete="email" {...form.register('email')} error={!!form.formState.errors.email} helperText={form.formState.errors.email?.message} /><TextField label="Senha" type="password" autoComplete="current-password" {...form.register('password')} error={!!form.formState.errors.password} helperText={form.formState.errors.password?.message} /><Button type="submit" variant="contained" size="large" disabled={mutation.isPending}>{mutation.isPending ? 'Entrando...' : 'Entrar'}</Button></Box></Paper></Box>;
}
