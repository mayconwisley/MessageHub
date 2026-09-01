import { Alert, Snackbar } from '@mui/material';
import type { Feedback } from '../../hooks/useFeedback';

export function FeedbackSnackbar({
  feedback,
  onClose,
}: {
  feedback: Feedback | null;
  onClose: () => void;
}) {
  return (
    <Snackbar
      open={!!feedback}
      autoHideDuration={8000}
      onClose={(_, reason) => {
        if (reason !== 'clickaway') onClose();
      }}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert severity={feedback?.severity ?? 'success'} variant="filled" onClose={onClose}>
        {feedback?.message}
      </Alert>
    </Snackbar>
  );
}
