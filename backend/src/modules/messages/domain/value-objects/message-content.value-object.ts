import { ValueObject } from '@shared/domain';
import { Result } from '@shared/result';
import { InvalidMessageError } from '../errors/invalid-message.error';

interface MessageContentProps {
  body: string;
}

const MAX_LENGTH = 4096;

export class MessageContent extends ValueObject<MessageContentProps> {
  private constructor(props: MessageContentProps) {
    super(props);
  }

  static create(body: string): Result<MessageContent, InvalidMessageError> {
    const trimmed = body?.trim();
    if (!trimmed) {
      return Result.fail(new InvalidMessageError('content não deve estar vazio.'));
    }
    if (trimmed.length > MAX_LENGTH) {
      return Result.fail(
        new InvalidMessageError(`content deve ter no máximo ${MAX_LENGTH} caracteres.`),
      );
    }

    return Result.ok(new MessageContent({ body: trimmed }));
  }

  get body(): string {
    return this.props.body;
  }
}
