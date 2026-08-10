import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { MetaConfigService } from '@infrastructure/configuration/meta-config.service';
import { MetaSendMessageRequestDto } from '../dto/meta-send-message-request.dto';
import { MetaSendMessageResponseDto } from '../dto/meta-send-message-response.dto';

export interface SendMetaMessageParams {
  phoneNumberId: string;
  accessToken: string;
  payload: MetaSendMessageRequestDto;
}

/** Unico ponto de contato HTTP com a Graph API. Nunca loga o access token (secao 15/27). */
@Injectable()
export class MetaWhatsAppClient {
  constructor(
    private readonly httpService: HttpService,
    private readonly metaConfig: MetaConfigService,
  ) {}

  async sendMessage(params: SendMetaMessageParams): Promise<MetaSendMessageResponseDto> {
    const url = `${this.metaConfig.graphApiUrl}/${params.phoneNumberId}/messages`;

    const response = await this.httpService.axiosRef.post<MetaSendMessageResponseDto>(
      url,
      params.payload,
      {
        headers: {
          Authorization: `Bearer ${params.accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data;
  }
}
