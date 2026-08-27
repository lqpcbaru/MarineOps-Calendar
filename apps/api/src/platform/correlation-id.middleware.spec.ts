import { describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import {
  correlationIdMiddleware,
  type RequestWithCorrelationId,
} from './correlation-id.middleware';

function makeReqRes(headers: Record<string, string> = {}) {
  const req = { headers } as unknown as Request;
  const setHeader = vi.fn();
  const res = { setHeader } as unknown as Response;
  const next = vi.fn() as NextFunction;
  return { req, res, next, setHeader };
}

describe('correlationIdMiddleware', () => {
  it('generates a correlation ID when none is provided', () => {
    const { req, res, next, setHeader } = makeReqRes();

    correlationIdMiddleware(req, res, next);

    const assigned = (req as RequestWithCorrelationId).correlationId;
    expect(typeof assigned).toBe('string');
    expect(assigned.length).toBeGreaterThan(0);
    expect(setHeader).toHaveBeenCalledWith('X-Correlation-Id', assigned);
    expect(next).toHaveBeenCalledOnce();
  });

  it('reuses the client-supplied X-Correlation-Id header', () => {
    const { req, res, next, setHeader } = makeReqRes({ 'x-correlation-id': 'client-abc-123' });

    correlationIdMiddleware(req, res, next);

    expect((req as RequestWithCorrelationId).correlationId).toBe('client-abc-123');
    expect(setHeader).toHaveBeenCalledWith('X-Correlation-Id', 'client-abc-123');
    expect(next).toHaveBeenCalledOnce();
  });

  it('generates a new ID when the header is present but blank', () => {
    const { req, res, next } = makeReqRes({ 'x-correlation-id': '   ' });

    correlationIdMiddleware(req, res, next);

    const assigned = (req as RequestWithCorrelationId).correlationId;
    expect(assigned.trim()).not.toBe('');
    expect(assigned).not.toBe('   ');
  });
});
