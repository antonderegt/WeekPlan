import assert from 'node:assert/strict';
import { describe, it, before, after } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { createApp, SCHEMA_SQL } from './index.js';

// ── Helpers ───────────────────────────────────────────────────────────

function createTestDb() {
  const db = new Database(':memory:');
  db.exec(SCHEMA_SQL);
  return db;
}

async function startServer(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, () => resolve(server));
  });
}

async function stopServer(server) {
  return new Promise((resolve) => server.close(resolve));
}

function url(server, p) {
  return `http://localhost:${server.address().port}${p}`;
}

async function json(server, method, p, body) {
  return fetch(url(server, p), {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
}

// ── DB error handling ─────────────────────────────────────────────────

describe('DB error handling', () => {
  let db, server;

  before(async () => {
    db = createTestDb();
    server = await startServer(createApp(db));
  });

  after(() => stopServer(server));

  it('GET /api/ingredients returns 500 when the table is missing', async () => {
    db.exec('DROP TABLE ingredients');
    const res = await fetch(url(server, '/api/ingredients'));
    assert.equal(res.status, 500);
    assert.match(await res.text(), /Database error/);
    db.exec('CREATE TABLE ingredients (id TEXT PRIMARY KEY, name TEXT NOT NULL, unit TEXT NOT NULL)');
  });

  it('PUT /api/ingredients returns 500 when the table is missing', async () => {
    db.exec('DROP TABLE ingredients');
    const res = await json(server, 'PUT', '/api/ingredients/x', { name: 'Salt', unit: 'g' });
    assert.equal(res.status, 500);
    assert.match(await res.text(), /Database error/);
    db.exec('CREATE TABLE ingredients (id TEXT PRIMARY KEY, name TEXT NOT NULL, unit TEXT NOT NULL)');
  });

  it('GET /api/recipes returns 500 when the table is missing', async () => {
    db.exec('DROP TABLE recipes');
    const res = await fetch(url(server, '/api/recipes'));
    assert.equal(res.status, 500);
    assert.match(await res.text(), /Database error/);
    db.exec('CREATE TABLE recipes (id TEXT PRIMARY KEY, name TEXT NOT NULL, ingredients_json TEXT NOT NULL, steps_json TEXT NOT NULL)');
  });

  it('GET /api/patterns returns 500 when the table is missing', async () => {
    db.exec('DROP TABLE patterns');
    const res = await fetch(url(server, '/api/patterns'));
    assert.equal(res.status, 500);
    assert.match(await res.text(), /Database error/);
    db.exec('CREATE TABLE patterns (id TEXT PRIMARY KEY, name TEXT NOT NULL, mealBlocks_json TEXT NOT NULL)');
  });
});

// ── Field length validation ───────────────────────────────────────────

describe('field length validation', () => {
  let server;
  const LONG = 'a'.repeat(501);
  const MAX = 'a'.repeat(500);

  before(async () => {
    server = await startServer(createApp(createTestDb()));
  });

  after(() => stopServer(server));

  it('rejects an ingredient name longer than 500 chars', async () => {
    const res = await json(server, 'PUT', '/api/ingredients/x', { name: LONG, unit: 'g' });
    assert.equal(res.status, 400);
    assert.match(await res.text(), /maximum length/);
  });

  it('rejects an ingredient unit longer than 500 chars', async () => {
    const res = await json(server, 'PUT', '/api/ingredients/x', { name: 'Salt', unit: LONG });
    assert.equal(res.status, 400);
  });

  it('accepts an ingredient name exactly 500 chars', async () => {
    const res = await json(server, 'PUT', '/api/ingredients/x', { name: MAX, unit: 'g' });
    assert.equal(res.status, 204);
  });

  it('rejects a recipe name longer than 500 chars', async () => {
    const res = await json(server, 'PUT', '/api/recipes/x', { name: LONG, ingredients: [], steps: [] });
    assert.equal(res.status, 400);
    assert.match(await res.text(), /maximum length/);
  });

  it('accepts a recipe name exactly 500 chars', async () => {
    const res = await json(server, 'PUT', '/api/recipes/x', { name: MAX, ingredients: [], steps: [] });
    assert.equal(res.status, 204);
  });

  it('rejects a pattern name longer than 500 chars', async () => {
    const res = await json(server, 'PUT', '/api/patterns/x', { name: LONG, mealBlocks: [] });
    assert.equal(res.status, 400);
    assert.match(await res.text(), /maximum length/);
  });

  it('accepts a pattern name exactly 500 chars', async () => {
    const res = await json(server, 'PUT', '/api/patterns/x', { name: MAX, mealBlocks: [] });
    assert.equal(res.status, 204);
  });
});

// ── SPA catch-all excludes /api/ ──────────────────────────────────────

describe('SPA catch-all', () => {
  let server, tempDist;

  before(async () => {
    tempDist = fs.mkdtempSync(path.join(os.tmpdir(), 'weekplan-test-'));
    fs.writeFileSync(path.join(tempDist, 'index.html'), '<!DOCTYPE html><html><body>app</body></html>');
    server = await startServer(createApp(createTestDb(), { distPath: tempDist }));
  });

  after(async () => {
    await stopServer(server);
    fs.rmSync(tempDist, { recursive: true });
  });

  it('unknown /api/ routes return 404, not index.html', async () => {
    const res = await fetch(url(server, '/api/does-not-exist'));
    assert.equal(res.status, 404);
  });

  it('unknown client-side routes return index.html', async () => {
    const res = await fetch(url(server, '/some-client-side-route'));
    assert.equal(res.status, 200);
    const contentType = res.headers.get('content-type') ?? '';
    assert.ok(contentType.includes('text/html'), `expected text/html, got "${contentType}"`);
  });
});
