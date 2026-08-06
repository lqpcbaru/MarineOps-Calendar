import { describe, expect, it } from 'vitest';
import { SchedulerService } from './scheduler.service';
import { createRefreshJob } from './refresh-job';

describe('SchedulerService', () => {
  it('registers and retrieves a job', () => {
    const svc = new SchedulerService();
    const state = createRefreshJob({ id: 'j1', name: 'Test', provider: 'test', intervalMs: 60000, priority: 'NORMAL', maxRetries: 2, rateLimitPerMinute: 10, enabled: true });
    svc.register(state, async () => {});
    expect(svc.getJob('j1')!.name).toBe('Test');
  });

  it('removes a job', () => {
    const svc = new SchedulerService();
    svc.register(createRefreshJob({ id: 'j1', name: 'T', provider: 'p', intervalMs: 1000, priority: 'NORMAL', maxRetries: 1, rateLimitPerMinute: 10, enabled: true }), async () => {});
    expect(svc.remove('j1')).toBe(true);
    expect(svc.getJob('j1')).toBeUndefined();
  });

  it('enables and disables jobs', () => {
    const svc = new SchedulerService();
    svc.register(createRefreshJob({ id: 'j1', name: 'T', provider: 'p', intervalMs: 1000, priority: 'NORMAL', maxRetries: 1, rateLimitPerMinute: 10, enabled: false }), async () => {});
    expect(svc.getJob('j1')!.enabled).toBe(false);
    svc.enable('j1');
    expect(svc.getJob('j1')!.enabled).toBe(true);
    svc.disable('j1');
    expect(svc.getJob('j1')!.enabled).toBe(false);
  });

  it('executes a job successfully', async () => {
    const svc = new SchedulerService();
    let called = false;
    svc.register(createRefreshJob({ id: 'j1', name: 'T', provider: 'p', intervalMs: 1000, priority: 'NORMAL', maxRetries: 1, rateLimitPerMinute: 100, enabled: true }), async () => { called = true; });
    await svc.execute('j1');
    expect(called).toBe(true);
    expect(svc.getJob('j1')!.status).toBe('SUCCEEDED');
  });

  it('skips disabled jobs', async () => {
    const svc = new SchedulerService();
    let called = false;
    svc.register(createRefreshJob({ id: 'j1', name: 'T', provider: 'p', intervalMs: 1000, priority: 'NORMAL', maxRetries: 1, rateLimitPerMinute: 100, enabled: false }), async () => { called = true; });
    await svc.execute('j1');
    expect(called).toBe(false);
  });

  it('retries on failure then succeeds', async () => {
    const svc = new SchedulerService();
    let calls = 0;
    svc.register(createRefreshJob({ id: 'j1', name: 'T', provider: 'p', intervalMs: 1000, priority: 'NORMAL', maxRetries: 3, rateLimitPerMinute: 100, enabled: true }), async () => {
      calls++;
      if (calls < 2) throw new Error('transient');
    });
    await svc.execute('j1');
    expect(calls).toBe(2);
    expect(svc.getJob('j1')!.status).toBe('SUCCEEDED');
  });

  it('marks job as FAILED after max retries', async () => {
    const svc = new SchedulerService();
    svc.register(createRefreshJob({ id: 'j1', name: 'T', provider: 'p', intervalMs: 1000, priority: 'NORMAL', maxRetries: 2, rateLimitPerMinute: 100, enabled: true }), async () => { throw new Error('persistent'); });
    await svc.execute('j1');
    expect(svc.getJob('j1')!.status).toBe('FAILED');
    expect(svc.getJob('j1')!.lastError).toBe('persistent');
  });

  it('prevents overlapping execution via lock', async () => {
    const svc = new SchedulerService();
    let running = false;
    let overlap = false;
    svc.register(createRefreshJob({ id: 'j1', name: 'T', provider: 'p', intervalMs: 1000, priority: 'NORMAL', maxRetries: 1, rateLimitPerMinute: 100, enabled: true }), async () => {
      if (running) overlap = true;
      running = true;
      await new Promise((r) => setTimeout(r, 50));
      running = false;
    });

    await Promise.all([svc.execute('j1'), svc.execute('j1')]);
    expect(overlap).toBe(false);
  });

  it('enforces rate limiting', async () => {
    const svc = new SchedulerService();
    let calls = 0;
    svc.register(createRefreshJob({ id: 'j1', name: 'T', provider: 'p', intervalMs: 1000, priority: 'NORMAL', maxRetries: 1, rateLimitPerMinute: 1, enabled: true }), async () => { calls++; });
    await svc.execute('j1');
    expect(calls).toBe(1);
    await svc.execute('j1');
    expect(calls).toBe(1);
  });

  it('executes all jobs in priority order', async () => {
    const svc = new SchedulerService();
    const order: string[] = [];
    svc.register(createRefreshJob({ id: 'low', name: 'L', provider: 'p', intervalMs: 1000, priority: 'LOW', maxRetries: 1, rateLimitPerMinute: 100, enabled: true }), async () => { order.push('low'); });
    svc.register(createRefreshJob({ id: 'high', name: 'H', provider: 'p', intervalMs: 1000, priority: 'HIGH', maxRetries: 1, rateLimitPerMinute: 100, enabled: true }), async () => { order.push('high'); });
    svc.register(createRefreshJob({ id: 'normal', name: 'N', provider: 'p', intervalMs: 1000, priority: 'NORMAL', maxRetries: 1, rateLimitPerMinute: 100, enabled: true }), async () => { order.push('normal'); });

    await svc.executeAll();
    expect(order[0]).toBe('high');
    expect(order[1]).toBe('normal');
    expect(order[2]).toBe('low');
  });

  it('tracks metrics on success', async () => {
    const svc = new SchedulerService();
    svc.register(createRefreshJob({ id: 'j1', name: 'T', provider: 'p', intervalMs: 1000, priority: 'NORMAL', maxRetries: 1, rateLimitPerMinute: 100, enabled: true }), async () => {});
    await svc.execute('j1');
    const state = svc.metrics.getState();
    expect(state.totalExecutions).toBe(1);
    expect(state.successfulExecutions).toBe(1);
  });

  it('tracks metrics on failure', async () => {
    const svc = new SchedulerService();
    svc.register(createRefreshJob({ id: 'j1', name: 'T', provider: 'p', intervalMs: 1000, priority: 'NORMAL', maxRetries: 1, rateLimitPerMinute: 100, enabled: true }), async () => { throw new Error('fail'); });
    await svc.execute('j1');
    const state = svc.metrics.getState();
    expect(state.failedExecutions).toBe(1);
  });
});
