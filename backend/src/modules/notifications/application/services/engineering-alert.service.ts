import { Inject, Injectable } from '@nestjs/common';
import axios from 'axios';
import { PinoLogger } from 'nestjs-pino';
import { AppConfigService } from '@infrastructure/configuration/app-config.service';
import {
  CreateEngineeringAlertInput,
  ENGINEERING_ALERT_REPOSITORY,
  IEngineeringAlertRepository,
} from '../ports/engineering-alert.repository.interface';

/** Persiste antes de entregar; payload externo nunca inclui conteúdo, tokens ou chaves. */
@Injectable()
export class EngineeringAlertService {
  constructor(
    @Inject(ENGINEERING_ALERT_REPOSITORY) private readonly alerts: IEngineeringAlertRepository,
    private readonly config: AppConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(EngineeringAlertService.name);
  }
  async notify(input: CreateEngineeringAlertInput): Promise<void> {
    const alert = await this.alerts.create(input);
    const payload = {
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      occurredAt: alert.occurredAt.toISOString(),
      metadata: alert.metadata,
    };
    const deliveries: Promise<unknown>[] = [];
    if (this.config.slackWebhookUrl)
      deliveries.push(
        axios.post(
          this.config.slackWebhookUrl,
          { text: `[${alert.severity}] ${alert.title}\n${alert.message}` },
          { timeout: 5_000 },
        ),
      );
    if (this.config.teamsWebhookUrl)
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
    if (this.config.emailWebhookUrl)
      deliveries.push(axios.post(this.config.emailWebhookUrl, payload, { timeout: 5_000 }));
    if (!deliveries.length) return;
    const results = await Promise.allSettled(deliveries);
    const failures = results.filter((result) => result.status === 'rejected');
    if (!failures.length) {
      await this.alerts.markDispatched(alert.id);
      return;
    }
    failures.forEach((failure) => {
      const error = failure.reason instanceof Error ? failure.reason : undefined;
      this.logger.error(
        { err: error, alertId: alert.id },
        'Falha na entrega de alerta de engenharia.',
      );
    });
  }
}
