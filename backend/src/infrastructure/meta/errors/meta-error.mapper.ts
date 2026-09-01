import { Logger } from '@nestjs/common';
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

/** Mensagens pt-BR seguras por codigo Graph API conhecido - nunca repassar `metaError.message` ao cliente. */
const KNOWN_ERROR_MESSAGES: ReadonlyMap<number, string> = new Map([
  [100, 'Parâmetro inválido enviado à Meta.'],
  [131008, 'Parâmetro obrigatório ausente na mensagem.'],
  [131009, 'Valor de parâmetro inválido na mensagem.'],
  [131021, 'Destinatário inválido.'],
  [131026, 'Mensagem não entregável: o número não está no WhatsApp ou bloqueou o remetente.'],
  [131047, 'Janela de 24 horas fechada; é necessário usar um template.'],
  [131051, 'Tipo de mensagem não suportado.'],
  [132000, 'Parâmetros do template não correspondem ao esperado.'],
  [132001, 'Template não existe.'],
  [132005, 'Template não aprovado.'],
  [132007, 'Template pausado.'],
  [132012, 'Formato de parâmetro do template inválido.'],
  [133010, 'Número de telefone não registrado nesta conta.'],
  [190, 'Token de acesso da Meta inválido ou expirado.'],
  [4, 'Limite de chamadas da API da Meta atingido.'],
  [80007, 'Limite de taxa da conta do WhatsApp Business atingido.'],
  [130429, 'Limite de taxa de envio de mensagens atingido.'],
  [131056, 'Muitas mensagens enviadas ao mesmo destinatário em pouco tempo.'],
]);

/** Converte falhas da Graph API em erros de dominio tipados - nunca expoe o payload bruto da Meta (secao 36). */
export class MetaErrorMapper {
  private static readonly logger = new Logger(MetaErrorMapper.name);

  static toProviderError(error: unknown): MetaProviderError {
    if (isAxiosError<MetaErrorResponseDto>(error) && error.response?.data?.error) {
      const metaError = error.response.data.error;
      this.logger.error(
        {
          metaErrorCode: metaError.code,
          metaErrorType: metaError.type,
          metaErrorSubcode: metaError.error_subcode,
          metaFbtraceId: metaError.fbtrace_id,
          metaMessage: metaError.message,
        },
        'Graph API request failed',
      );

      const reason =
        KNOWN_ERROR_MESSAGES.get(metaError.code) ?? this.fallbackMessage(metaError.code);

      if (RATE_LIMIT_ERROR_CODES.has(metaError.code)) {
        return new ProviderRateLimitedError(reason);
      }
      if (PERMANENT_ERROR_CODES.has(metaError.code)) {
        return new MessageDeliveryRejectedError(reason);
      }
      return new ProviderUnavailableError(reason);
    }

    return new ProviderUnavailableError('Provedor do WhatsApp da Meta indisponível.');
  }

  private static fallbackMessage(code: number): string {
    if (RATE_LIMIT_ERROR_CODES.has(code)) {
      return 'Provedor de WhatsApp com limite de taxa atingido. Tente novamente mais tarde.';
    }
    if (PERMANENT_ERROR_CODES.has(code)) {
      return 'A Meta rejeitou a mensagem; verifique os dados enviados.';
    }
    return 'Provedor do WhatsApp da Meta indisponível.';
  }
}
