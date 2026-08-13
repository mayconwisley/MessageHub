import { HttpException, HttpStatus } from '@nestjs/common';
import {
  ApplicationError,
  AuthenticationError,
  AuthorizationError,
  BaseError,
  DomainError,
  InfrastructureError,
  ProviderError,
  RateLimitExceededError,
  ValidationError,
} from '@shared/errors';

const NOT_FOUND_CODES = new Set([
  'TENANT_NOT_FOUND',
  'APPLICATION_NOT_FOUND',
  'API_KEY_NOT_FOUND',
  'WHATSAPP_ACCOUNT_NOT_FOUND',
  'PHONE_NUMBER_NOT_FOUND',
  'TEMPLATE_NOT_FOUND',
  'MESSAGE_NOT_FOUND',
  'USER_NOT_FOUND',
]);

const TOO_MANY_REQUESTS_CODES = new Set([
  'RATE_LIMIT_EXCEEDED',
  'PROVIDER_RATE_LIMITED',
  'ACCOUNT_LOCKED',
]);

export function toHttpException(error: BaseError): HttpException {
  return new HttpException({ code: error.code, message: error.message }, resolveHttpStatus(error));
}

function resolveHttpStatus(error: BaseError): number {
  if (NOT_FOUND_CODES.has(error.code)) return HttpStatus.NOT_FOUND;
  if (TOO_MANY_REQUESTS_CODES.has(error.code)) return HttpStatus.TOO_MANY_REQUESTS;
  if (error instanceof RateLimitExceededError) return HttpStatus.TOO_MANY_REQUESTS;
  if (error instanceof AuthenticationError) return HttpStatus.UNAUTHORIZED;
  if (error instanceof AuthorizationError) return HttpStatus.FORBIDDEN;
  if (error instanceof ValidationError) return HttpStatus.BAD_REQUEST;
  if (error instanceof ProviderError) return HttpStatus.BAD_GATEWAY;
  if (error instanceof InfrastructureError) return HttpStatus.SERVICE_UNAVAILABLE;
  if (error instanceof ApplicationError) return HttpStatus.CONFLICT;
  if (error instanceof DomainError) return HttpStatus.BAD_REQUEST;
  return HttpStatus.INTERNAL_SERVER_ERROR;
}
