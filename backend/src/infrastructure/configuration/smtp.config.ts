import { registerAs } from '@nestjs/config';

export const smtpConfig = registerAs('smtp', () => ({
  defaultEnabled: process.env.SMTP_DEFAULT_ENABLED === 'true',
  host: process.env.SMTP_HOST,
  port: Number.parseInt(process.env.SMTP_PORT ?? '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  user: process.env.SMTP_USER,
  password: process.env.SMTP_PASSWORD,
  fromEmail: process.env.SMTP_FROM_EMAIL,
  fromName: process.env.SMTP_FROM_NAME ?? 'Message Hub',
}));
