import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { PinoLogger } from 'nestjs-pino';
import { AppConfigService } from '@infrastructure/configuration/app-config.service';
import { EngineeringAlertDto } from '../../application/ports/engineering-alert.repository.interface';
import { IEngineeringAlertDispatcher } from '../../application/ports/engineering-alert-dispatcher.interface';

/** Entrega alertas para os endpoints operacionais configurados no ambiente. */
@Injectable()
export class HttpEngineeringAlertDispatcherService implements IEngineeringAlertDispatcher {
  constructor(
    private readonly config: AppConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(HttpEngineeringAlertDispatcherService.name);
  }

  async dispatch(alert: EngineeringAlertDto): Promise<boolean> {
    const deliveries: Promise<unknown>[] = [];
    if (this.config.slackWebhookUrl) {
      deliveries.push(
        axios.post(
          this.config.slackWebhookUrl,
          { text: `[${alert.severity}] ${alert.title}\n${alert.message}` },
          { timeout: 5_000 },
        ),
      );
    }
    if (this.config.teamsWebhookUrl) {
      deliveries.push(
        axios.post(
          this.config.teamsWebhookUrl,
          {
            title: alert.title,
            text: alert.message,
            themeColor: alert.severity === 'CRITICAL' ? 'C62828' : 'F9A825',
          },
          { timeout: 5_000 },
        ),
      );
    }
    if (this.config.emailWebhookUrl) {
      deliveries.push(
        axios.post(
          this.config.emailWebhookUrl,
          {
            type: alert.type,
            severity: alert.severity,
            title: alert.title,
            message: alert.message,
            occurredAt: alert.occurredAt.toISOString(),
            metadata: alert.metadata,
          },
          { timeout: 5_000 },
        ),
      );
    }
    if (deliveries.length === 0) return false;

    const results = await Promise.allSettled(deliveries);
    let succeeded = true;
    for (const result of results) {
      if (result.status === 'fulfilled') continue;
      succeeded = false;
      const error = result.reason instanceof Error ? result.reason : undefined;
      this.logger.error(
        { err: error, alertId: alert.id },
        'Falha na entrega de alerta de engenharia.',
      );
    }
    return succeeded;
  }
}
