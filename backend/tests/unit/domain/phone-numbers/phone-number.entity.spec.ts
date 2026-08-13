import { Result } from '@shared/result';
import { UniqueId } from '@shared/domain';
import { PhoneNumber } from '@modules/phone-numbers/domain/entities/phone-number.entity';
import { PhoneNumberStatus } from '@modules/phone-numbers/domain/enums/phone-number-status.enum';
import { InvalidPhoneNumberError } from '@modules/phone-numbers/domain/errors/invalid-phone-number.error';

function expectOk<T, E>(result: Result<T, E>): T {
  if (result.isFailure)
    throw new Error(`esperava sucesso, obteve falha: ${JSON.stringify(result.error)}`);
  return result.value;
}

function createPhoneNumber(): PhoneNumber {
  return expectOk(
    PhoneNumber.create({
      whatsAppAccountId: UniqueId.create(),
      phoneNumberId: 'meta-phone-1',
      displayNumber: '+5511999999999',
    }),
  );
}

describe('PhoneNumber', () => {
  it('cria um número de telefone ativo', () => {
    const phoneNumber = createPhoneNumber();

    expect(phoneNumber.isActive()).toBe(true);
    expect(phoneNumber.status).toBe(PhoneNumberStatus.ACTIVE);
    expect(phoneNumber.phoneNumberId).toBe('meta-phone-1');
    expect(phoneNumber.displayNumber).toBe('+5511999999999');
    expect(phoneNumber.createdAt).toBeInstanceOf(Date);
  });

  it('falha ao criar com phoneNumberId vazio', () => {
    const result = PhoneNumber.create({
      whatsAppAccountId: UniqueId.create(),
      phoneNumberId: '   ',
      displayNumber: '+5511999999999',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(InvalidPhoneNumberError);
  });

  it('falha ao criar com displayNumber vazio', () => {
    const result = PhoneNumber.create({
      whatsAppAccountId: UniqueId.create(),
      phoneNumberId: 'meta-phone-1',
      displayNumber: '   ',
    });

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(InvalidPhoneNumberError);
  });

  it('suspende o número, tornando-o inativo', () => {
    const phoneNumber = createPhoneNumber();

    phoneNumber.suspend();

    expect(phoneNumber.isActive()).toBe(false);
    expect(phoneNumber.status).toBe(PhoneNumberStatus.SUSPENDED);
  });

  it('sincroniza dados a partir do canal padrão e reativa o número', () => {
    const phoneNumber = createPhoneNumber();
    phoneNumber.suspend();

    const result = phoneNumber.synchronizeFromDefaultChannel('meta-phone-2', '+5511988888888');

    expect(result.isFailure).toBe(false);
    expect(phoneNumber.phoneNumberId).toBe('meta-phone-2');
    expect(phoneNumber.displayNumber).toBe('+5511988888888');
    expect(phoneNumber.isActive()).toBe(true);
  });

  it('falha ao sincronizar com phoneNumberId vazio', () => {
    const phoneNumber = createPhoneNumber();

    const result = phoneNumber.synchronizeFromDefaultChannel('   ', '+5511988888888');

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(InvalidPhoneNumberError);
  });

  it('falha ao sincronizar com displayNumber vazio', () => {
    const phoneNumber = createPhoneNumber();

    const result = phoneNumber.synchronizeFromDefaultChannel('meta-phone-2', '   ');

    expect(result.isFailure).toBe(true);
    expect(result.error).toBeInstanceOf(InvalidPhoneNumberError);
  });
});
