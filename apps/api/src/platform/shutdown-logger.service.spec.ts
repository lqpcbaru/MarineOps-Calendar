import { describe, expect, it, vi, afterEach } from 'vitest';
import { ShutdownLoggerService } from './shutdown-logger.service';

describe('ShutdownLoggerService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs the signal that triggered shutdown', () => {
    const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const service = new ShutdownLoggerService();

    service.onApplicationShutdown('SIGTERM');

    expect(write).toHaveBeenCalledTimes(1);
    const logged = JSON.parse(write.mock.calls[0]![0] as string);
    expect(logged.message).toBe('SIGTERM received. Shutting down gracefully...');
  });

  it('falls back to a generic message when no signal is provided', () => {
    const write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    const service = new ShutdownLoggerService();

    service.onApplicationShutdown();

    const logged = JSON.parse(write.mock.calls[0]![0] as string);
    expect(logged.message).toBe('shutdown received. Shutting down gracefully...');
  });
});
