import type { NextFunction, Request, Response } from 'express';
import { createId } from '../shared-kernel';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

export interface RequestWithCorrelationId extends Request {
  correlationId: string;
}

/**
 * Assigns a correlation ID to every request — taken from the client's
 * X-Correlation-Id header if present, otherwise generated — and echoes it
 * back on the response so client-visible errors can be matched to server
 * log lines. Populates ErrorEnvelope.correlationId (SYSTEM_ARCHITECTURE §8).
 */
export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers[CORRELATION_ID_HEADER];
  const correlationId = (typeof incoming === 'string' && incoming.trim()) || createId();
  (req as RequestWithCorrelationId).correlationId = correlationId;
  res.setHeader('X-Correlation-Id', correlationId);
  next();
}
