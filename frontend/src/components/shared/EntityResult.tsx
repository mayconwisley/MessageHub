import { Alert, Box, Divider, Stack, Typography } from '@mui/material';
import { toPresentationLabel, toPresentationValue } from '../../lib/presentation';

export function EntityResult({
  title,
  data,
}: {
  title: string;
  data: Record<string, unknown> | null;
}) {
  if (!data) return <Alert severity="info">Nenhum dado disponível para exibição.</Alert>;
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Stack divider={<Divider flexItem />}>
        {Object.entries(data)
          .filter(([, value]) => typeof value !== 'object')
          .map(([key, value]) => (
            <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 1 }}>
              <Typography color="text.secondary">{toPresentationLabel(key)}</Typography>
              <Typography sx={{ overflowWrap: 'anywhere', textAlign: 'right' }}>
                {toPresentationValue(key, value)}
              </Typography>
            </Box>
          ))}
      </Stack>
    </Box>
  );
}
