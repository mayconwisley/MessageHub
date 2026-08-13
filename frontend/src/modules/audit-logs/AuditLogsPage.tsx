import { Stack, Tab, Tabs } from '@mui/material';
import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { EventsTab } from './EventsTab';
import { SystemLogsTab } from './SystemLogsTab';

export function AuditLogsPage() {
  const [tab, setTab] = useState<'events' | 'logs'>('events');

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Eventos e logs"
        description="Trilha de auditoria das ações administrativas e logs técnicos de execução registrados pela ferramenta."
      />
      <Tabs value={tab} onChange={(_, value) => setTab(value)}>
        <Tab value="events" label="Eventos" />
        <Tab value="logs" label="Logs" />
      </Tabs>
      {tab === 'events' ? <EventsTab /> : <SystemLogsTab />}
    </Stack>
  );
}
