import { Response } from 'express';
import { AuthContextDto } from '@modules/applications/application/dto/api-key.dto';
import { SendTemplateMessageCommand } from '@modules/messages/application/commands/send-template-message.command';
import { MessageDto } from '@modules/messages/application/dto/message.dto';
import { MessagesController } from '@modules/messages/presentation/controllers/messages.controller';
import { Result } from '@shared/result';

describe('MessagesController', () => {
  it('converte o contrato de autenticação em BODY e botão sensíveis', async () => {
    const message: MessageDto = {
      id: '019c0000-0000-7000-8000-000000000001',
      tenantId: '019c0000-0000-7000-8000-000000000002',
      applicationId: '019c0000-0000-7000-8000-000000000003',
      phoneNumberId: '019c0000-0000-7000-8000-000000000004',
      to: '+5511999999999',
      content: 'Template: folhabox_codigo_acesso',
      type: 'TEMPLATE',
      template: {
        metaTemplateId: 'meta-1',
        name: 'folhabox_codigo_acesso',
        language: 'pt_BR',
        parameters: [],
      },
      status: 'PENDING',
      idempotencyKey: 'otp-1',
      requestId: 'request-1',
      providerMessageId: null,
      attemptCount: 0,
      lastError: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const send = jest.fn().mockResolvedValue(Result.ok({ message, isReplay: false }));
    const controller = new MessagesController({ send, query: jest.fn() });
    const response = { status: jest.fn(), setHeader: jest.fn() } as unknown as Response;
    const auth: AuthContextDto = {
      apiKeyId: 'api-key-1',
      applicationId: message.applicationId,
      tenantId: message.tenantId,
      type: 'platform',
    };

    await controller.sendAuthentication(
      { to: '5511999999999', templateName: 'folhabox_codigo_acesso', code: '391827' },
      response,
      auth,
      undefined,
      'otp-1',
    );

    const command = send.mock.calls[0]?.[0] as SendTemplateMessageCommand;
    expect(command.parameters).toEqual([
      { component: 'body', values: ['391827'] },
      { component: 'button', index: 0, action: 'url', values: ['391827'] },
    ]);
    expect(command.requiredTemplateCategory).toBe('AUTHENTICATION');
    expect(command.sensitive).toBe(true);
  });
});
