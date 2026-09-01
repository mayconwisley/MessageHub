import { Alert, Box, CircularProgress, Typography } from '@mui/material';
import type { ReactNode } from 'react';
import { ApiError } from '../../services/http-client';

const GENERIC_ERROR_MESSAGE =
  'Não foi possível carregar os dados. Verifique sua conexão e tente novamente.';

/** Erros de rede/infra (ex.: "Failed to fetch") vêm em inglês e não devem aparecer crus na UI em pt-BR. */
function toDisplayMessage(error: Error): string {
  if (error instanceof ApiError) return error.message;
  return GENERIC_ERROR_MESSAGE;
}

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
  if (error) return <Alert severity="error">{toDisplayMessage(error)}</Alert>;
  if (emptyMessage) return <Typography color="text.secondary">{emptyMessage}</Typography>;
  return <>{children}</>;
}
