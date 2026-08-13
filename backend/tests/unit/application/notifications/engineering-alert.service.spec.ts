import axios from 'axios';
import { EngineeringAlertService } from '@modules/notifications/application/services/engineering-alert.service';

jest.mock('axios');

describe('EngineeringAlertService', () => {
  const post = axios.post as jest.Mock;
  const repository = {
    create: jest
      .fn()
      .mockResolvedValue({
        id: 'alert-1',
        type: 'MESSAGE_DLQ',
        severity: 'CRITICAL',
        title: 'DLQ',
        message: 'Falha',
        metadata: { messageId: 'message-1' },
        occurredAt: new Date('2026-08-13T00:00:00.000Z'),
        dispatchedAt: null,
      }),
    markDispatched: jest.fn().mockResolvedValue(undefined),
  };
  const config = {
    slackWebhookUrl: 'https://hooks.slack.test/x',
    teamsWebhookUrl: 'https://teams.test/x',
    emailWebhookUrl: 'https://mail-gateway.test/x',
  };
  const logger = { setContext: jest.fn(), error: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    post.mockResolvedValue({ status: 200 });
  });

  it('persiste e entrega o alerta nos três canais sem payload de conteúdo de mensagem', async () => {
    const service = new EngineeringAlertService(repository, config as never, logger as never);
    await service.notify({
      type: 'MESSAGE_DLQ',
      severity: 'CRITICAL',
      title: 'DLQ',
      message: 'Falha',
      metadata: { messageId: 'message-1' },
    });
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(post).toHaveBeenCalledTimes(3);
    expect(JSON.stringify(post.mock.calls)).not.toContain('accessToken');
    expect(repository.markDispatched).toHaveBeenCalledWith('alert-1');
  });
});
