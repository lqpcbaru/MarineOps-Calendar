import { DomainError } from '../../shared-kernel';

export class ProviderError extends DomainError {
  constructor(
    message: string,
    code: string,
    public readonly providerName: string,
    public readonly originalError?: Error,
  ) {
    super(message, code);
  }
}

export class ProviderUnavailableError extends ProviderError {
  constructor(providerName: string, originalError?: Error) {
    super(`'${providerName}' tidak tersedia`, 'PROVIDER_UNAVAILABLE', providerName, originalError);
  }
}

export class ProviderTimeoutError extends ProviderError {
  constructor(providerName: string, timeoutMs: number, originalError?: Error) {
    super(`'${providerName}' melebihi had masa (${timeoutMs}ms)`, 'PROVIDER_TIMEOUT', providerName, originalError);
  }
}

export class ProviderAuthenticationError extends ProviderError {
  constructor(providerName: string, statusCode: number) {
    super(`'${providerName}' pengesahan gagal (${statusCode})`, 'PROVIDER_AUTH_ERROR', providerName);
  }
}

export class ProviderRateLimitError extends ProviderError {
  constructor(providerName: string, retryAfter?: string) {
    super(`'${providerName}' had kadar dicapai${retryAfter ? ', cuba selepas ' + retryAfter : ''}`, 'PROVIDER_RATE_LIMITED', providerName);
  }
}

export class ProviderInvalidResponseError extends ProviderError {
  constructor(providerName: string, detail?: string) {
    super(`'${providerName}' respons tidak sah${detail ? ': ' + detail : ''}`, 'PROVIDER_INVALID_RESPONSE', providerName);
  }
}

export class ProviderConfigurationError extends ProviderError {
  constructor(providerName: string, detail: string) {
    super(`'${providerName}' konfigurasi ralat: ${detail}`, 'PROVIDER_CONFIG_ERROR', providerName);
  }
}

export class ProviderServerError extends ProviderError {
  constructor(providerName: string, statusCode: number) {
    super(`'${providerName}' ralat pelayan (${statusCode})`, 'PROVIDER_SERVER_ERROR', providerName);
  }
}

export function isRetryableError(error: Error): boolean {
  if (error instanceof ProviderAuthenticationError) return false;
  if (error instanceof ProviderConfigurationError) return false;
  if (error instanceof ProviderInvalidResponseError) return false;
  return true;
}
