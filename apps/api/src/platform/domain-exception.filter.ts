import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
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

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      response.status(status).json(this.envelope(exception, body));
      return;
    }

    if (exception instanceof DomainError) {
      const status = this.httpStatusFor(exception.code);
      response.status(status).json(this.envelope(exception, undefined));
      return;
    }

    this.logger.error(
      exception instanceof Error ? exception.message : 'Unexpected error',
      exception instanceof Error ? exception.stack : undefined,
    );
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    response.status(status).json({
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    });
  }

  private httpStatusFor(code: string): number {
    switch (code) {
      case 'VALIDATION_ERROR':
        return HttpStatus.BAD_REQUEST;
      case 'NOT_FOUND':
        return HttpStatus.NOT_FOUND;
      case 'AUTH_INVALID_CREDENTIALS':
      case 'AUTH_UNAUTHORIZED':
      case 'AUTH_REFRESH_NOT_FOUND':
      case 'AUTH_REFRESH_EXPIRED':
      case 'AUTH_REFRESH_REUSE_DETECTED':
        return HttpStatus.UNAUTHORIZED;
      case 'AUTH_USER_DISABLED':
      case 'AUTH_FORBIDDEN':
        return HttpStatus.FORBIDDEN;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }

  private envelope(exception: Error, details: unknown): Record<string, unknown> {
    const base: Record<string, unknown> = {
      code: exception instanceof DomainError ? exception.code : 'ERROR',
      message: exception.message,
    };
    if (details !== undefined && typeof details === 'object' && details !== null) {
      base['details'] = details;
    }
    return base;
  }
}
