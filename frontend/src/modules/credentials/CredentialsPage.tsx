import { CheckCircleOutline, ContentCopyOutlined } from '@mui/icons-material';
import { Alert, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { authStorage } from '../../services/auth-storage';

export function CredentialsPage() {
  const [apiKey, setApiKey] = useState(authStorage.getApiKey() ?? '');
  const [saved, setSaved] = useState(false);
  const save = () => { authStorage.setApiKey(apiKey.trim()); setSaved(true); };
  return <Stack spacing={3}><PageHeader title="Credenciais de aplicação" description="A API key é usada apenas pelos recursos operacionais. Ela não substitui a sessão administrativa." /><Alert severity="warning">A chave fica somente na sessão atual do navegador. A chave em texto puro gerada pelo backend não poderá ser recuperada depois.</Alert><Card variant="outlined"><CardContent><Stack spacing={2}><Typography variant="h6">API key</Typography><TextField label="Bearer wh_live_..." value={apiKey} onChange={(event) => { setApiKey(event.target.value); setSaved(false); }} type="password" autoComplete="off" fullWidth /><Button variant="contained" startIcon={<ContentCopyOutlined />} onClick={save} disabled={!apiKey.trim()}>Usar nesta sessão</Button>{saved && <Alert icon={<CheckCircleOutline />} severity="success">API key configurada para esta sessão.</Alert>}</Stack></CardContent></Card></Stack>;
}
