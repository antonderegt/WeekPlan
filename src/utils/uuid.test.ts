import assert from 'node:assert/strict';
import { afterEach, describe, it, mock } from 'node:test';
import { createId } from './uuid.js';

describe('uuid utils', () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it('uses crypto.randomUUID when available', () => {
    const originalCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: {
        randomUUID: () => '11111111-1111-4111-8111-111111111111'
      }
    });

    assert.equal(createId(), '11111111-1111-4111-8111-111111111111');
    Object.defineProperty(globalThis, 'crypto', { configurable: true, value: originalCrypto });
  });

  it('returns a v4-like id fallback when crypto is missing', () => {
    const originalCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', {
      configurable: true,
      value: undefined
    });

    const id = createId();
    assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    Object.defineProperty(globalThis, 'crypto', { configurable: true, value: originalCrypto });
  });
});
