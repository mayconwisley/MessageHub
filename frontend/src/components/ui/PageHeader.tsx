import { Typography } from '@mui/material';
import type { ReactNode } from 'react';

export function PageHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <header><Typography variant="h4" component="h1">{title}</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>{description}</Typography>{action}</header>;
}
