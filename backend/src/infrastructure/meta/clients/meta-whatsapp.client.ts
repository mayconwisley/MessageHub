import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { isAxiosError } from 'axios';
import { MetaConfigService } from '@infrastructure/configuration/meta-config.service';
import { MetaSendMessageRequestDto } from '../dto/meta-send-message-request.dto';
import { MetaSendMessageResponseDto } from '../dto/meta-send-message-response.dto';

export interface SendMetaMessageParams {
  phoneNumberId: string;
  accessToken: string;
  payload: MetaSendMessageRequestDto;
}

export interface MetaTemplateCredentials {
  wabaId: string;
  accessToken: string;
}

export interface MetaTemplateResponse {
  id: string;
  name: string;
  language: string;
  category: string;
  status: string;
  components: Record<string, unknown>[];
  parameter_format?: string;
  rejected_reason?: string;
}

interface MetaTemplateListResponse {
  data: MetaTemplateResponse[];
  paging?: { next?: string };
}

/** Unico ponto de contato HTTP com a Graph API. Nunca loga o access token (secao 15/27). */
@Injectable()
export class MetaWhatsAppClient {
  constructor(
    private readonly httpService: HttpService,
    private readonly metaConfig: MetaConfigService,
  ) {}

  async sendMessage(params: SendMetaMessageParams): Promise<MetaSendMessageResponseDto> {
    const graphApiUrl = this.metaConfig.graphApiUrl;
    if (!graphApiUrl) {
      throw new Error('Meta Graph API is not configured.');
    }
    const url = `${graphApiUrl}/${params.phoneNumberId}/messages`;

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

  async createTemplate(
    credentials: MetaTemplateCredentials,
    payload: Record<string, unknown>,
  ): Promise<{ id: string; status: string; category: string }> {
    return this.post(`${credentials.wabaId}/message_templates`, credentials.accessToken, payload);
  }

  async listTemplates(credentials: MetaTemplateCredentials): Promise<MetaTemplateResponse[]> {
    const templates: MetaTemplateResponse[] = [];
    let url = `${credentials.wabaId}/message_templates`;

    do {
      const response = await this.httpService.axiosRef.get<MetaTemplateListResponse>(
        this.resolveUrl(url),
        { headers: { Authorization: `Bearer ${credentials.accessToken}` } },
      );
      templates.push(...response.data.data);
      url = response.data.paging?.next ?? '';
    } while (url);

    return templates;
  }

  async updateTemplate(
    credentials: MetaTemplateCredentials,
    templateId: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await this.post(templateId, credentials.accessToken, payload);
  }

  async deleteTemplate(
    credentials: MetaTemplateCredentials,
    templateId: string,
    name: string,
  ): Promise<void> {
    try {
      await this.httpService.axiosRef.delete(
        this.resolveUrl(`${credentials.wabaId}/message_templates`),
        {
          headers: { Authorization: `Bearer ${credentials.accessToken}` },
          params: { hsm_id: templateId, name },
        },
      );
    } catch (error) {
      // A exclusão é idempotente: a Meta pode ter removido o template antes do retry do Hub.
      if (isAxiosError(error) && error.response?.status === 404) return;
      throw error;
    }
  }

  private async post<T>(
    url: string,
    accessToken: string,
    payload: Record<string, unknown>,
  ): Promise<T> {
    const response = await this.httpService.axiosRef.post<T>(this.resolveUrl(url), payload, {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });
    return response.data;
  }

  private resolveUrl(pathOrUrl: string): string {
    if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
    const graphApiUrl = this.metaConfig.graphApiUrl;
    if (!graphApiUrl) throw new Error('Meta Graph API is not configured.');
    return `${graphApiUrl}/${pathOrUrl}`;
  }
}
