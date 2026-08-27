import { describe, expect, it, vi } from 'vitest';
import type { ArgumentsHost } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';
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

  it('omits correlationId when the request has none', () => {
    const filter = new DomainExceptionFilter();
    const { host, json } = makeHost();

    filter.catch(new ValidationError('invalid'), host);

    const [[body]] = json.mock.calls;
    expect(body).not.toHaveProperty('correlationId');
  });
});
