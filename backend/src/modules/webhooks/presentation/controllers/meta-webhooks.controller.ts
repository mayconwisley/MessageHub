import {
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { timingSafeEqual } from 'crypto';
import { Request } from 'express';
import { MetaConfigService } from '@infrastructure/configuration/meta-config.service';
import { toHttpException } from '@presentation/http/result-http.mapper';
import { IMediator, MEDIATOR } from '@shared/mediator';
import { ReceiveMetaWebhookCommand } from '../../application/commands/receive-meta-webhook.command';
import { MetaWebhookPayload } from '../../application/dto/meta-webhook-payload.dto';

interface RawBodyRequest extends Request {
  rawBody?: Buffer;
}

@ApiTags('webhooks')
@Controller('webhooks/meta')
export class MetaWebhooksController {
  constructor(
    private readonly config: MetaConfigService,
    @Inject(MEDIATOR) private readonly mediator: IMediator,
  ) {}

  @Get()
  @ApiExcludeEndpoint()
  verify(
    @Query('hub.mode') mode?: string,
    @Query('hub.verify_token') verifyToken?: string,
    @Query('hub.challenge') challenge?: string,
  ): string {
    if (mode !== 'subscribe' || !this.isVerifyTokenValid(verifyToken)) {
      throw new ForbiddenException();
    }
    return challenge ?? '';
  }

  private isVerifyTokenValid(received: string | undefined): boolean {
    const expected = this.config.webhookVerifyToken;
    if (!expected || !received) return false;
    const expectedBuffer = Buffer.from(expected);
    const receivedBuffer = Buffer.from(received);
    if (expectedBuffer.length !== receivedBuffer.length) return false;
    return timingSafeEqual(expectedBuffer, receivedBuffer);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiExcludeEndpoint()
  async receive(@Req() request: RawBodyRequest): Promise<void> {
    const result = await this.mediator.send(
      new ReceiveMetaWebhookCommand(
        request.header('x-hub-signature-256'),
        request.rawBody,
        request.body as MetaWebhookPayload,
      ),
    );
    if (result.isFailure) throw toHttpException(result.error);
  }
}
