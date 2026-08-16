import { Entity, UniqueId } from '@shared/domain';
import { Result } from '@shared/result';
import { InvalidSmtpConfigurationError } from '../errors/invalid-smtp-configuration.error';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export interface EmailSmtpConfigurationProps {
  tenantId: UniqueId;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConfigureEmailSmtpParams {
  tenantId: UniqueId;
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

/** Configuração SMTP própria do tenant. A senha nunca é exposta por DTO. */
export class EmailSmtpConfiguration extends Entity<EmailSmtpConfigurationProps> {
  private constructor(props: EmailSmtpConfigurationProps, id?: UniqueId) {
    super(props, id);
  }

  static create(
    params: ConfigureEmailSmtpParams,
    id?: UniqueId,
  ): Result<EmailSmtpConfiguration, InvalidSmtpConfigurationError> {
    const normalized = this.normalize(params);
    if (normalized.isFailure) return Result.fail(normalized.error);
    const now = new Date();
    return Result.ok(
      new EmailSmtpConfiguration({ ...normalized.value, createdAt: now, updatedAt: now }, id),
    );
  }

  static reconstitute(props: EmailSmtpConfigurationProps, id: UniqueId): EmailSmtpConfiguration {
    return new EmailSmtpConfiguration(props, id);
  }

  update(
    params: Omit<ConfigureEmailSmtpParams, 'tenantId'>,
  ): Result<void, InvalidSmtpConfigurationError> {
    const normalized = EmailSmtpConfiguration.normalize({ tenantId: this.tenantId, ...params });
    if (normalized.isFailure) return Result.fail(normalized.error);
    this.props.host = normalized.value.host;
    this.props.port = normalized.value.port;
    this.props.secure = normalized.value.secure;
    this.props.username = normalized.value.username;
    this.props.password = normalized.value.password;
    this.props.fromEmail = normalized.value.fromEmail;
    this.props.fromName = normalized.value.fromName;
    this.props.updatedAt = new Date();
    return Result.ok(undefined);
  }

  get tenantId(): UniqueId {
    return this.props.tenantId;
  }
  get host(): string {
    return this.props.host;
  }
  get port(): number {
    return this.props.port;
  }
  get secure(): boolean {
    return this.props.secure;
  }
  get username(): string {
    return this.props.username;
  }
  get password(): string {
    return this.props.password;
  }
  get fromEmail(): string {
    return this.props.fromEmail;
  }
  get fromName(): string {
    return this.props.fromName;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  private static normalize(
    params: ConfigureEmailSmtpParams,
  ): Result<
    Omit<EmailSmtpConfigurationProps, 'createdAt' | 'updatedAt'>,
    InvalidSmtpConfigurationError
  > {
    const host = params.host?.trim();
    const username = params.username?.trim();
    const password = params.password?.trim();
    const fromEmail = params.fromEmail?.trim().toLowerCase();
    const fromName = params.fromName?.trim();
    if (!host || host.length > 255)
      return Result.fail(
        new InvalidSmtpConfigurationError('host é obrigatório e deve ter até 255 caracteres.'),
      );
    if (!Number.isInteger(params.port) || params.port < 1 || params.port > 65_535)
      return Result.fail(new InvalidSmtpConfigurationError('port deve estar entre 1 e 65535.'));
    if (!username || username.length > 320)
      return Result.fail(
        new InvalidSmtpConfigurationError('username é obrigatório e deve ter até 320 caracteres.'),
      );
    if (!password)
      return Result.fail(new InvalidSmtpConfigurationError('password não deve estar vazio.'));
    if (!fromEmail || fromEmail.length > 320 || !EMAIL_PATTERN.test(fromEmail))
      return Result.fail(new InvalidSmtpConfigurationError('fromEmail deve ser um e-mail válido.'));
    if (!fromName || fromName.length > 255)
      return Result.fail(
        new InvalidSmtpConfigurationError('fromName é obrigatório e deve ter até 255 caracteres.'),
      );
    return Result.ok({
      tenantId: params.tenantId,
      host,
      port: params.port,
      secure: params.secure,
      username,
      password,
      fromEmail,
      fromName,
    });
  }
}
