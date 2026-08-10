export abstract class BaseError {
  protected constructor(
    public readonly code: string,
    public readonly message: string,
  ) {}
}

/** Regra de negocio do dominio violada (ex: TenantNotFound, InvalidMessage). */
export abstract class DomainError extends BaseError {}

/** Erro de coordenacao de caso de uso (ex: MessageAlreadyProcessed). */
export abstract class ApplicationError extends BaseError {}

/** Falha de infraestrutura (banco, fila, rede) que nao faz parte do fluxo normal de negocio. */
export abstract class InfrastructureError extends BaseError {}

/** Erro reportado por um provedor externo de mensageria (ex: Meta) apos mapeamento. */
export abstract class ProviderError extends BaseError {}

/** Falha de validacao de entrada na fronteira da aplicacao. */
export abstract class ValidationError extends BaseError {}

/** Falha ao identificar o solicitante (ex: InvalidApiKey). */
export abstract class AuthenticationError extends BaseError {}

/** Solicitante identificado mas sem permissao para o recurso/escopo. */
export abstract class AuthorizationError extends BaseError {}
