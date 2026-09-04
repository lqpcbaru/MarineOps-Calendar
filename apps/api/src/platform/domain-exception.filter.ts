import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DomainError } from '../shared-kernel';

/**
 * Maps DomainError subclasses to stable HTTP responses (ENGINEERING_STANDARDS §4, §3.8).
 * Shape per SYSTEM_ARCHITECTURE §8: { code, message, details?, correlationId? }.
 */
@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('DomainExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<{
      status: (code: number) => { json: (body: unknown) => void };
    }>();
    const request = ctx.getRequest<{ correlationId?: string }>();
    const correlationId = request?.correlationId;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      response.status(status).json(this.envelope(exception, body, correlationId));
      return;
    }

    if (exception instanceof DomainError) {
      const status = this.httpStatusFor(exception.code);
      response.status(status).json(this.envelope(exception, undefined, correlationId));
      return;
    }

    // A unique-constraint violation that reaches here (rather than a
    // domain-specific *ExistsError) means an application-level
    // check-then-create raced with a concurrent request and lost — the
    // database correctly rejected the duplicate. Surface it as the 409
    // conflict it actually is, not an opaque 500.
    if (exception instanceof Prisma.PrismaClientKnownRequestError && exception.code === 'P2002') {
      const target = exception.meta?.['target'];
      const fields = Array.isArray(target) ? target.join(', ') : undefined;
      response.status(HttpStatus.CONFLICT).json({
        code: 'CONFLICT',
        message: fields ? `Nilai untuk '${fields}' sudah wujud` : 'Rekod ini sudah wujud',
        ...(correlationId ? { correlationId } : {}),
      });
      return;
    }

    this.logger.error(
      exception instanceof Error ? exception.message : 'Unexpected error',
      exception instanceof Error ? exception.stack : undefined,
      correlationId ? `correlationId=${correlationId}` : undefined,
    );
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    response.status(status).json({
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      ...(correlationId ? { correlationId } : {}),
    });
  }

  private httpStatusFor(code: string): number {
    switch (code) {
      case 'VALIDATION_ERROR':
        return HttpStatus.BAD_REQUEST;
      case 'NOT_FOUND':
      case 'USER_NOT_FOUND':
      case 'ROLE_NOT_FOUND':
      case 'STATION_NOT_FOUND':
      case 'REGION_NOT_FOUND':
        return HttpStatus.NOT_FOUND;
      case 'USER_EMAIL_EXISTS':
      case 'ROLE_NAME_EXISTS':
      case 'ROLE_HAS_USERS':
      case 'USER_STATUS_ERROR':
      case 'STATION_CODE_EXISTS':
      case 'REGION_CODE_EXISTS':
        return HttpStatus.CONFLICT;
      case 'STATION_ARCHIVED':
        return HttpStatus.BAD_REQUEST;
      case 'AUTH_INVALID_CREDENTIALS':
      case 'AUTH_UNAUTHORIZED':
      case 'AUTH_REFRESH_NOT_FOUND':
      case 'AUTH_REFRESH_EXPIRED':
      case 'AUTH_REFRESH_REUSE_DETECTED':
        return HttpStatus.UNAUTHORIZED;
      case 'AUTH_USER_DISABLED':
      case 'AUTH_FORBIDDEN':
        return HttpStatus.FORBIDDEN;
      // External provider failures (ADR-0008 §2 / provider-error.ts). A provider
      // outage or misconfiguration is not an internal server fault: surface it as
      // an upstream error so clients can distinguish it from a genuine 500.
      case 'PROVIDER_UNAVAILABLE':
      case 'PROVIDER_TIMEOUT':
        return HttpStatus.SERVICE_UNAVAILABLE;
      case 'PROVIDER_RATE_LIMITED':
        return HttpStatus.TOO_MANY_REQUESTS;
      // Not 502. A configuration gap — no station->provider mapping, or a
      // mapping with no provider code in it — means the upstream was never
      // contacted at all, so calling it a Bad Gateway blames a system that
      // did nothing wrong. It also makes the two indistinguishable to
      // monitoring: a freshly deployed environment has no mappings yet, so
      // every sourced-data request would raise the same 502 as a real
      // upstream outage and bury it.
      case 'PROVIDER_CONFIG_ERROR':
        return HttpStatus.SERVICE_UNAVAILABLE;
      // These three did reach the provider, and it misbehaved.
      case 'PROVIDER_AUTH_ERROR':
      case 'PROVIDER_INVALID_RESPONSE':
      case 'PROVIDER_SERVER_ERROR':
        return HttpStatus.BAD_GATEWAY;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  private envelope(
    exception: Error,
    details: unknown,
    correlationId?: string,
  ): Record<string, unknown> {
    const base: Record<string, unknown> = {
      code: exception instanceof DomainError ? exception.code : 'ERROR',
      message: exception.message,
    };
    if (details !== undefined && typeof details === 'object' && details !== null) {
      base['details'] = details;
    }
    if (correlationId) {
      base['correlationId'] = correlationId;
    }
    return base;
  }
}
