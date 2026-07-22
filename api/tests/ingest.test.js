import { describe, it, before } from 'node:test';
import assert from 'node:assert';

let createApp;

before(async () => {
  process.env.SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'test-anon-key';
  const mod = await import('../src/index.js');
  createApp = mod.createApp;
});

describe('API routes', () => {
  it('should have routes registered', () => {
    const app = createApp();
    const routeCount = app._router.stack.length;
    // At minimum: json parser, cors, helmet, logger, ingest router, health, error handler
    assert.ok(routeCount >= 5, `Expected at least 5 middleware layers, got ${routeCount}`);
  });

  it('should have the health route registered', () => {
    const app = createApp();
    let hasHealth = false;
    app._router.stack.forEach((mw) => {
      if (mw.route && mw.route.path === '/health') {
        hasHealth = true;
      }
    });
    assert.ok(hasHealth, 'Health route not found');
  });
});
