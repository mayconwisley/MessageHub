import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export function AsyncState({
  isLoading,
  error,
  emptyMessage,
  children,
}: {
  isLoading: boolean;
  error?: Error | null;
  emptyMessage?: string;
  children: ReactNode;
}) {
  if (isLoading)
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress aria-label="Carregando" />
      </Box>
    );
  if (error) return <Alert severity="error">{error.message}</Alert>;
  if (emptyMessage) return <Typography color="text.secondary">{emptyMessage}</Typography>;
  return <>{children}</>;
}
