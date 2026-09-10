import { E164_PHONE_NUMBER_REGEX } from '@shared/constants';
import { ValueObject } from '@shared/domain';
import { Result } from '@shared/result';
import { InvalidMessageError } from '../errors/invalid-message.error';

interface MessageRecipientProps {
  value: string;
}

const MIN_PHONE_DIGITS = 8;
const MAX_RECIPIENT_LENGTH = 256;
const PHONE_INPUT_REGEX = /^\+?[\d\s().-]+$/;
const BSUID_REGEX = /^[A-Za-z]{2}\.[A-Za-z0-9]{1,128}$/;

export class MessageRecipient extends ValueObject<MessageRecipientProps> {
  private constructor(props: MessageRecipientProps) {
    super(props);
  }

  static create(rawValue: string): Result<MessageRecipient, InvalidMessageError> {
    const value = rawValue?.trim();
    if (!value) {
      return Result.fail(new InvalidMessageError('to não deve estar vazio.'));
    }
    if (value.length > MAX_RECIPIENT_LENGTH) {
      return Result.fail(
        new InvalidMessageError(`to deve ter no máximo ${MAX_RECIPIENT_LENGTH} caracteres.`),
      );
    }

    // BSUID é um identificador opaco da Meta e deve ser enviado exatamente como recebido.
    if (BSUID_REGEX.test(value)) {
      return Result.ok(new MessageRecipient({ value }));
    }

    if (!PHONE_INPUT_REGEX.test(value)) {
      return Result.fail(
        new InvalidMessageError('to deve ser um telefone internacional ou BSUID válido.'),
      );
    }

    const digits = value.replace(/\D/g, '');
    const normalized = `+${digits}`;
    if (digits.length < MIN_PHONE_DIGITS || !E164_PHONE_NUMBER_REGEX.test(normalized)) {
      return Result.fail(
        new InvalidMessageError('to deve conter DDI, DDD e número, com no máximo 15 dígitos.'),
      );
    }

    return Result.ok(new MessageRecipient({ value: normalized }));
  }

  get value(): string {
    return this.props.value;
  }
}
