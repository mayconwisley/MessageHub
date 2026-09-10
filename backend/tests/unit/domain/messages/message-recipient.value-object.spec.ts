import { MessageRecipient } from '@modules/messages/domain/value-objects/message-recipient.value-object';

describe('MessageRecipient', () => {
  it.each([
    ['5544984491569', '+5544984491569'],
    ['+5544984491569', '+5544984491569'],
    ['55 (44) 98449-1569', '+5544984491569'],
  ])('normaliza o telefone %s para E.164', (input, expected) => {
    const result = MessageRecipient.create(input);

    expect(result.isSuccess).toBe(true);
    expect(result.value.value).toBe(expected);
  });

  it('preserva o BSUID exatamente como recebido', () => {
    const result = MessageRecipient.create('BR.13491208655302741918');

    expect(result.isSuccess).toBe(true);
    expect(result.value.value).toBe('BR.13491208655302741918');
  });

  it.each(['', '5511ABC9999', '05544984491569', '1234567'])(
    'rejeita o destinatário inválido %s',
    (input) => {
      expect(MessageRecipient.create(input).isFailure).toBe(true);
    },
  );
});
