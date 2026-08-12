import { isAxiosError } from 'axios';
import { MessageDeliveryRejectedError } from '@modules/messages/domain/errors/message-delivery-rejected.error';
import { ProviderRateLimitedError } from '@modules/messages/domain/errors/provider-rate-limited.error';
import { ProviderUnavailableError } from '@modules/messages/domain/errors/provider-unavailable.error';
import { MetaProviderError } from '@modules/messages/domain/errors/meta-provider-error.type';
import { MetaErrorResponseDto } from '../dto/meta-send-message-response.dto';

/**
 * Codigos da Graph API que indicam um erro do proprio requisitante (numero invalido, template
 * incompativel, parametro invalido, credencial invalida) - nunca devem ser reenviados
 * automaticamente, pois a tentativa seguinte falharia pelo mesmo motivo.
 */
const PERMANENT_ERROR_CODES = new Set([
  100, // Parametro invalido
  131008, // Parametro obrigatorio ausente
  131009, // Valor de parametro invalido
  131021, // Destinatario invalido
  131026, // Mensagem nao entregavel (numero nao esta no WhatsApp / bloqueou o remetente)
  131047, // Janela de 24h fechada - requer template
  131051, // Tipo de mensagem nao suportado
  132000, // Parametros do template nao correspondem
  132001, // Template nao existe
  132005, // Template nao aprovado
  132007, // Template pausado
  132012, // Formato de parametro do template invalido
  133010, // Numero de telefone nao registrado na conta
  190, // Token de acesso invalido ou expirado
]);

/** Codigos que indicam limite de taxa (da Meta ou da conta) - retentavel, porem com status 429. */
const RATE_LIMIT_ERROR_CODES = new Set([
  4, // Limite de chamadas da API atingido
  80007, // Limite de taxa da conta do WhatsApp Business
  130429, // Limite de taxa de envio de mensagens
  131056, // Muitas mensagens enviadas ao mesmo destinatario em pouco tempo
]);

/** Converte falhas da Graph API em erros de dominio tipados - nunca expoe o payload bruto da Meta (secao 36). */
export class MetaErrorMapper {
  static toProviderError(error: unknown): MetaProviderError {
    if (isAxiosError<MetaErrorResponseDto>(error) && error.response?.data?.error) {
      const metaError = error.response.data.error;
      const reason = `Meta error ${metaError.code} (${metaError.type}): ${metaError.message}`;

      if (RATE_LIMIT_ERROR_CODES.has(metaError.code)) {
        return new ProviderRateLimitedError(reason);
      }
      if (PERMANENT_ERROR_CODES.has(metaError.code)) {
        return new MessageDeliveryRejectedError(reason);
      }
      return new ProviderUnavailableError(reason);
    }

    return new ProviderUnavailableError('Meta WhatsApp provider unavailable.');
  }
}
