import { Alert, Box, Divider, Stack, Typography } from '@mui/material';

export function EntityResult({ title, data }: { title: string; data: Record<string, unknown> | null }) {
  if (!data) return <Alert severity="info">Informe um identificador para consultar um registro.</Alert>;
  return <Box><Typography variant="h6" gutterBottom>{title}</Typography><Stack divider={<Divider flexItem />}>{Object.entries(data).filter(([, value]) => typeof value !== 'object').map(([key, value]) => <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 1 }}><Typography color="text.secondary">{key}</Typography><Typography sx={{ overflowWrap: 'anywhere', textAlign: 'right' }}>{String(value ?? '—')}</Typography></Box>)}</Stack></Box>;
}
