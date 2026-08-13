import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  initialPlatformAdminEmail: process.env.INITIAL_PLATFORM_ADMIN_EMAIL,
  initialPlatformAdminPassword: process.env.INITIAL_PLATFORM_ADMIN_PASSWORD,
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0),
  swaggerEnabled:
    (process.env.SWAGGER_ENABLED ?? (process.env.NODE_ENV === 'production' ? 'false' : 'true')) ===
    'true',
  messageProvider: process.env.MESSAGE_PROVIDER ?? 'meta',
  sandboxEnabled: (process.env.SANDBOX_ENABLED ?? 'false') === 'true',
  slackWebhookUrl: process.env.ENGINEERING_SLACK_WEBHOOK_URL,
  teamsWebhookUrl: process.env.ENGINEERING_TEAMS_WEBHOOK_URL,
  emailWebhookUrl: process.env.ENGINEERING_EMAIL_WEBHOOK_URL,
}));
