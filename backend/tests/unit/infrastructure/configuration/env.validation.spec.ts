import 'reflect-metadata';
import { validateEnv } from '../../../../src/infrastructure/configuration/env.validation';

function createProductionEnvironment(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    NODE_ENV: 'production',
    DATABASE_URL: 'postgres://message_hub:password@database:5432/message_hub',
    RABBITMQ_URL: 'amqp://message_hub:password@rabbitmq:5672',
    META_CREDENTIALS_ENCRYPTION_KEY: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    INITIAL_PLATFORM_ADMIN_EMAIL: 'admin@example.com',
    INITIAL_PLATFORM_ADMIN_PASSWORD: 'SenhaDeProducaoForte',
    CORS_ORIGINS: 'https://console.example.com',
    SWAGGER_ENABLED: 'false',
    TRUST_PROXY: 'true',
    MESSAGE_PROVIDER: 'meta',
    SANDBOX_ENABLED: 'false',
    META_WEBHOOK_VERIFY_TOKEN: 'webhook-verify-token',
    META_APP_SECRET: 'meta-app-secret',
    ...overrides,
  };
}

describe('validateEnv', () => {
  it('aceita a configuracao minima segura para producao', () => {
    expect(validateEnv(createProductionEnvironment())).toMatchObject({
      NODE_ENV: 'production',
      CORS_ORIGINS: 'https://console.example.com',
      MESSAGE_PROVIDER: 'meta',
    });
  });

  it('rejeita CORS vazio em producao', () => {
    expect(() => validateEnv(createProductionEnvironment({ CORS_ORIGINS: '' }))).toThrow(
      'CORS_ORIGINS e obrigatorio em producao',
    );
  });

  it('rejeita credenciais de teste em producao', () => {
    expect(() =>
      validateEnv(
        createProductionEnvironment({
          INITIAL_PLATFORM_ADMIN_PASSWORD: 'ChangeMe123!Hub',
        }),
      ),
    ).toThrow('INITIAL_PLATFORM_ADMIN_PASSWORD nao pode usar a senha de teste em producao');
  });
});
