import { describe, expect, it, vi } from 'vitest';
import type { ArgumentsHost } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NotFoundError, ValidationError } from '../shared-kernel';
import {
  ProviderConfigurationError,
  ProviderInvalidResponseError,
  ProviderUnavailableError,
} from '../shared/provider/provider-error';
import { DomainExceptionFilter } from './domain-exception.filter';

function makeHost(correlationId?: string) {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const response = { status };
  const request = correlationId ? { correlationId } : {};

  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as unknown as ArgumentsHost;

  return { host, status, json };
}

describe('DomainExceptionFilter', () => {
  it('includes correlationId in the envelope for a DomainError', () => {
    const filter = new DomainExceptionFilter();
    const { host, status, json } = makeHost('req-123');

    filter.catch(new NotFoundError('Station', 'st-999'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'NOT_FOUND', correlationId: 'req-123' }),
    );
  });

  // A missing station->provider mapping is OUR configuration gap: the
  // upstream is never contacted, so 502 Bad Gateway blames a system that
  // did nothing. It also hides real outages — a newly deployed environment
  // has no mappings yet, so every sourced-data request would emit the same
  // 502 as a genuine upstream failure. Found live: /api/public/tide,
  // /weather and /wind-wave all returned 502 on a correctly working stack
  // that simply had no mappings configured yet.
  it('reports a provider configuration gap as 503, not 502', () => {
    const filter = new DomainExceptionFilter();
    const { host, status, json } = makeHost('req-cfg');

    filter.catch(new ProviderConfigurationError('JUPEM', 'tiada pemetaan untuk stesen st-1'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ code: 'PROVIDER_CONFIG_ERROR' }));
  });

  // The distinction the previous test protects only means something if a
  // provider that WAS reached and misbehaved still reports 502.
  it('still reports a bad upstream response as 502', () => {
    const filter = new DomainExceptionFilter();
    const { host, status } = makeHost('req-bad');

    filter.catch(new ProviderInvalidResponseError('JUPEM', 'missing data array'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_GATEWAY);
  });

  it('reports an unreachable provider as 503', () => {
    const filter = new DomainExceptionFilter();
    const { host, status } = makeHost('req-down');

    filter.catch(new ProviderUnavailableError('JUPEM'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
  });

  it('includes correlationId in the envelope for an HttpException', () => {
    const filter = new DomainExceptionFilter();
    const { host, status, json } = makeHost('req-456');

    filter.catch(new HttpException('bad request', HttpStatus.BAD_REQUEST), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ correlationId: 'req-456' }));
  });

  it('includes correlationId for unhandled (non-domain) errors', () => {
    const filter = new DomainExceptionFilter();
    const { host, status, json } = makeHost('req-789');

    filter.catch(new Error('boom'), host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'INTERNAL_ERROR', correlationId: 'req-789' }),
    );
  });

  it('maps a Prisma unique-constraint violation (P2002) to 409 Conflict', () => {
    const filter = new DomainExceptionFilter();
    const { host, status, json } = makeHost('req-p2002');

    const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '6.0.0',
      meta: { target: ['code'] },
    });
    filter.catch(error, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'CONFLICT', correlationId: 'req-p2002' }),
    );
    const body = json.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(body['message']).toContain('code');
  });

  it('does not treat a non-P2002 Prisma error as a conflict', () => {
    const filter = new DomainExceptionFilter();
    const { host, status } = makeHost();

    const error = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '6.0.0',
    });
    filter.catch(error, host);

    expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
  });

  it('omits correlationId when the request has none', () => {
    const filter = new DomainExceptionFilter();
    const { host, json } = makeHost();

    filter.catch(new ValidationError('invalid'), host);

    const body = json.mock.calls[0]?.[0];
    expect(body).not.toHaveProperty('correlationId');
  });
});
