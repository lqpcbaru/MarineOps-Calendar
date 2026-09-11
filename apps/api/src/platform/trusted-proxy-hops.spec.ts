import { describe, expect, it } from 'vitest';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { DEFAULT_TRUSTED_PROXY_HOPS, resolveTrustedProxyHops } from './trusted-proxy-hops';

describe('resolveTrustedProxyHops', () => {
  it('defaults to the single-proxy topology', () => {
    expect(resolveTrustedProxyHops({})).toBe(DEFAULT_TRUSTED_PROXY_HOPS);
    expect(DEFAULT_TRUSTED_PROXY_HOPS).toBe(1);
  });

  it('treats an empty value as unset', () => {
    expect(resolveTrustedProxyHops({ TRUSTED_PROXY_HOPS: '' })).toBe(1);
    expect(resolveTrustedProxyHops({ TRUSTED_PROXY_HOPS: '   ' })).toBe(1);
  });

  it('reads an explicit count', () => {
    expect(resolveTrustedProxyHops({ TRUSTED_PROXY_HOPS: '2' })).toBe(2);
    expect(resolveTrustedProxyHops({ TRUSTED_PROXY_HOPS: ' 3 ' })).toBe(3);
  });

  // Coercing a bad value to 0 would disable proxy trust entirely, which
  // keys every rate limit on the proxy's own address — the exact failure
  // this setting exists to prevent. Fail loudly at boot instead.
  it.each(['0', '-1', 'two', '1.5', 'NaN'])('rejects %s rather than coercing it', (value) => {
    expect(() => resolveTrustedProxyHops({ TRUSTED_PROXY_HOPS: value })).toThrow(
      /positive integer/,
    );
  });
});

/**
 * The setting is only meaningful because of how Express resolves req.ip,
 * so this pins that behaviour rather than assuming it.
 *
 * This is the defect the setting was introduced for: adding a TLS
 * terminator in front of the web container makes two proxies append to
 * X-Forwarded-For, and a hop count of 1 then resolves req.ip to the
 * terminator's internal address for every request. Both rate limiters
 * key on req.ip, so every client would share one bucket and ten failed
 * sign-ins by anyone would lock out everyone.
 */
describe('Express req.ip under the configured hop count', () => {
  const CLIENT = '203.0.113.7';
  const TERMINATOR = '172.20.0.5';

  async function resolvedIp(hops: number, forwardedFor: string): Promise<string> {
    const app = express();
    app.set('trust proxy', hops);
    app.get('/', (req, res) => {
      res.end(req.ip ?? '');
    });

    const server = app.listen(0, '127.0.0.1');
    await new Promise((resolve) => server.once('listening', resolve));
    try {
      const { port } = server.address() as AddressInfo;
      const response = await fetch(`http://127.0.0.1:${port}/`, {
        headers: { 'X-Forwarded-For': forwardedFor },
      });
      return await response.text();
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  }

  it('resolves the client behind one proxy with a hop count of 1', async () => {
    expect(await resolvedIp(1, CLIENT)).toBe(CLIENT);
  });

  it('resolves the terminator, not the client, when the count is too low', async () => {
    expect(await resolvedIp(1, `${CLIENT}, ${TERMINATOR}`)).toBe(TERMINATOR);
  });

  it('resolves the client behind two proxies with a hop count of 2', async () => {
    expect(await resolvedIp(2, `${CLIENT}, ${TERMINATOR}`)).toBe(CLIENT);
  });

  // Too high is the opposite failure: Express starts trusting addresses
  // the client supplied itself, so req.ip becomes forgeable.
  it('trusts a client-supplied address when the count exceeds the real hops', async () => {
    const forged = '198.51.100.99';
    expect(await resolvedIp(2, `${forged}, ${CLIENT}`)).toBe(forged);
  });
});
