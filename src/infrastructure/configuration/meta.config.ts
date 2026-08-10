import { registerAs } from '@nestjs/config';

export const metaConfig = registerAs('meta', () => ({
  baseUrl: process.env.META_BASE_URL,
  apiVersion: process.env.META_API_VERSION,
}));
