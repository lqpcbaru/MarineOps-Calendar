import { describe, expect, it, vi } from 'vitest';
import type { ArgumentsHost } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NotFoundError, ValidationError } from '../shared-kernel';
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
