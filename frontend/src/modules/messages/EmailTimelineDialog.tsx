import { Alert, Chip, Divider, Skeleton, Stack, Typography } from '@mui/material';
import { FormDialog } from '../../components/shared/FormDialog';
import { toPresentationValue } from '../../lib/presentation';
import type { EmailMessage, EmailTimelineEvent } from './emails.api';

interface EmailTimelineDialogProps {
  open: boolean;
  email: EmailMessage | null;
  timeline?: EmailTimelineEvent[];
  isLoading: boolean;
  error: Error | null;
  onClose: () => void;
}

export function EmailTimelineDialog({
  open,
  email,
  timeline,
  isLoading,
  error,
  onClose,
}: EmailTimelineDialogProps) {
  return (
    <FormDialog open={open} onClose={onClose} title="Linha do tempo do e-mail" maxWidth="sm">
      {isLoading ? (
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Skeleton height={36} />
          <Skeleton height={80} />
          <Skeleton height={80} />
        </Stack>
      ) : error ? (
        <Alert severity="error" sx={{ mt: 1 }}>
          Não foi possível carregar a linha do tempo. {error.message}
        </Alert>
      ) : email ? (
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Stack spacing={0.5}>
            <Typography variant="subtitle1">{email.subject}</Typography>
            <Typography variant="body2" color="text.secondary">
              Para: {email.to}
            </Typography>
            <Chip
              label={toPresentationValue('status', email.status)}
              size="small"
              sx={{ alignSelf: 'flex-start' }}
            />
          </Stack>
          <Divider />
          {timeline?.length ? (
            timeline.map((event) => (
              <Stack key={event.id} spacing={0.5}>
                <Typography variant="subtitle2">{event.eventType.replaceAll('_', ' ')}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {event.errorMessage ?? toPresentationValue('status', event.status)}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {new Date(event.occurredAt).toLocaleString('pt-BR')}
                </Typography>
              </Stack>
            ))
          ) : (
            <Typography color="text.secondary">
              Nenhum evento operacional foi registrado para este e-mail.
            </Typography>
          )}
        </Stack>
      ) : null}
    </FormDialog>
  );
}
