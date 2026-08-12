/**
 * Campos que nunca podem aparecer em texto puro nos logs (secao 27 do AGENTS.md).
 * Os caminhos `req.headers.*`/`res.headers.*` sao defesa em profundidade: o
 * serializer customizado em `logging.module.ts` ja remove headers dos logs de HTTP.
 */
const SENSITIVE_KEYS = [
  'accessToken',
  'access_token',
  'apiKey',
  'api_key',
  'adminApiKey',
  'admin_api_key',
  'adminApiKeyHashes',
  'admin_api_key_hashes',
  'password',
  'plainTextKey',
  'secret',
  'token',
];

export const PINO_REDACT_PATHS: string[] = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-api-key"]',
  'res.headers["set-cookie"]',
  // fast-redact exige um segmento por nivel: cobre o campo tanto na raiz do
  // objeto logado quanto aninhado um nivel abaixo (ex.: `{ account: { accessToken } }`).
  ...SENSITIVE_KEYS,
  ...SENSITIVE_KEYS.map((key) => `*.${key}`),
];
