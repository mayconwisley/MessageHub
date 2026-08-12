import { isAxiosError } from 'axios';
import { ProviderUnavailableError } from '@modules/messages/domain/errors/provider-unavailable.error';
import { MetaErrorResponseDto } from '../dto/meta-send-message-response.dto';

/** Converte falhas da Graph API em erro interno - nunca expoe o payload bruto da Meta (secao 36). */
export class MetaErrorMapper {
  static toProviderError(error: unknown): ProviderUnavailableError {
    if (isAxiosError<MetaErrorResponseDto>(error) && error.response?.data?.error) {
      const metaError = error.response.data.error;
      return new ProviderUnavailableError(`Meta error ${metaError.code}: ${metaError.type}`);
    }

    return new ProviderUnavailableError('Meta WhatsApp provider unavailable.');
  }
}
