import { Close } from '@mui/icons-material';
import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import type { ReactNode } from 'react';

export function FormDialog({
  open,
  onClose,
  title,
  children,
  maxWidth = 'sm',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg';
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth={maxWidth}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {title}
        <IconButton onClick={onClose} size="small" aria-label="Fechar">
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent>{children}</DialogContent>
    </Dialog>
  );
}
