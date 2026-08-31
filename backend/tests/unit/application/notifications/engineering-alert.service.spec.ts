import { EngineeringAlertService } from '@modules/notifications/application/services/engineering-alert.service';

describe('EngineeringAlertService', () => {
  const repository = {
    create: jest.fn().mockResolvedValue({
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
    list: jest.fn(),
  };
  const dispatcher = { dispatch: jest.fn().mockResolvedValue(true) };

  beforeEach(() => {
    jest.clearAllMocks();
    dispatcher.dispatch.mockResolvedValue(true);
  });

  it('persiste e marca o alerta como entregue quando o dispatcher confirma a entrega', async () => {
    const service = new EngineeringAlertService(repository, dispatcher);
    await service.notify({
      type: 'MESSAGE_DLQ',
      severity: 'CRITICAL',
      title: 'DLQ',
      message: 'Falha',
      metadata: { messageId: 'message-1' },
    });
    expect(repository.create).toHaveBeenCalledTimes(1);
    expect(dispatcher.dispatch).toHaveBeenCalledWith(expect.objectContaining({ id: 'alert-1' }));
    expect(repository.markDispatched).toHaveBeenCalledWith('alert-1');
  });
});
