import { describe, expect, it, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createLoginRateLimiter } from './login-rate-limit';

describe('createLoginRateLimiter', () => {
  const originalMax = process.env['LOGIN_RATE_LIMIT_MAX'];

  afterEach(() => {
    if (originalMax === undefined) delete process.env['LOGIN_RATE_LIMIT_MAX'];
    else process.env['LOGIN_RATE_LIMIT_MAX'] = originalMax;
  });

  function makeApp() {
    const app = express();
    app.use('/login', createLoginRateLimiter());
    app.post('/login', (_req, res) => res.status(201).json({ accessToken: 'x' }));
    return app;
  }

  it('allows requests up to the configured limit', async () => {
    process.env['LOGIN_RATE_LIMIT_MAX'] = '3';
    const app = makeApp();

    for (let i = 0; i < 3; i++) {
      const res = await request(app).post('/login').send({});
      expect(res.status).toBe(201);
    }
  });

  it('blocks further attempts once the limit is exceeded, with a BM message', async () => {
    process.env['LOGIN_RATE_LIMIT_MAX'] = '3';
    const app = makeApp();

    for (let i = 0; i < 3; i++) {
      await request(app).post('/login').send({});
    }

    const blocked = await request(app).post('/login').send({});
    expect(blocked.status).toBe(429);
    expect(blocked.body.code).toBe('RATE_LIMITED');
  });

  it('defaults to 10 when LOGIN_RATE_LIMIT_MAX is unset', async () => {
    delete process.env['LOGIN_RATE_LIMIT_MAX'];
    const app = makeApp();

    for (let i = 0; i < 10; i++) {
      const res = await request(app).post('/login').send({});
      expect(res.status).toBe(201);
    }
    const blocked = await request(app).post('/login').send({});
    expect(blocked.status).toBe(429);
  });
});
