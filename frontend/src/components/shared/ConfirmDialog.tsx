import { Alert, Button, Stack } from '@mui/material';
import { FormDialog } from './FormDialog';

/** Diálogo de confirmação padrão para ações destrutivas/irreversíveis, no mesmo padrão usado em TemplatesPage. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  severity = 'warning',
  isPending,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  severity?: 'warning' | 'error';
  isPending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <FormDialog open={open} title={title} onClose={onClose}>
      <Stack spacing={2} sx={{ mt: 1 }}>
        <Alert severity={severity}>{description}</Alert>
        <Stack direction="row" spacing={2}>
          <Button color="error" variant="contained" disabled={isPending} onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button onClick={onClose}>Cancelar</Button>
        </Stack>
      </Stack>
    </FormDialog>
  );
}
