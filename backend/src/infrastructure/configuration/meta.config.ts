import { registerAs } from '@nestjs/config';

export const metaConfig = registerAs('meta', () => ({
  graphApiUrlBase: process.env.META_GRAPH_API_URL_BASE,
  webhookVerifyToken: process.env.META_WEBHOOK_VERIFY_TOKEN,
  appSecret: process.env.META_APP_SECRET,
  defaultChannelEnabled: process.env.META_DEFAULT_CHANNEL_ENABLED === 'true',
  defaultTenantId: process.env.META_DEFAULT_CHANNEL_TENANT_ID,
  defaultTenantName: process.env.META_DEFAULT_CHANNEL_TENANT_NAME,
  defaultApplicationName: process.env.META_DEFAULT_CHANNEL_APPLICATION_NAME,
  defaultWabaId: process.env.META_DEFAULT_CHANNEL_WABA_ID,
  defaultAccessToken: process.env.META_DEFAULT_CHANNEL_BEARER,
  defaultPhoneNumberId: process.env.META_DEFAULT_CHANNEL_PHONE_NUMBER_ID,
  defaultPhoneNumber: process.env.META_DEFAULT_CHANNEL_PHONE_NUMBER,
  defaultUsername: process.env.META_DEFAULT_CHANNEL_USERNAME,
  credentialsEncryptionKey: process.env.META_CREDENTIALS_ENCRYPTION_KEY,
}));
