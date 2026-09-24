import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { TokenStorage } from './token-storage';
import { resetKeyCacheForTests } from './crypto-key-store';
import type { StoredTokens } from './helix-auth.models';

describe('TokenStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    resetKeyCacheForTests();
  });

  it('round-trips a saved token bundle', async () => {
    const storage = new TokenStorage();
    const tokens: StoredTokens = {
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
      expiresAt: Date.now() + 3600_000,
    };
    await storage.save(tokens);
    await expect(storage.read()).resolves.toEqual(tokens);
  });

  it('does not store tokens in plaintext', async () => {
    const storage = new TokenStorage();
    await storage.save({ accessToken: 'super-secret-token', refreshToken: 'r', expiresAt: 0 });
    const raw = localStorage.getItem('helix_session') ?? '';
    expect(raw).not.toContain('super-secret-token');
  });

  it('returns null when nothing is stored', async () => {
    const storage = new TokenStorage();
    await expect(storage.read()).resolves.toBeNull();
  });

  it('returns null (not a throw) for corrupted data', async () => {
    localStorage.setItem('helix_session', 'not valid json at all');
    const storage = new TokenStorage();
    await expect(storage.read()).resolves.toBeNull();
  });

  it('clear() removes the stored session', async () => {
    const storage = new TokenStorage();
    await storage.save({ accessToken: 'a', refreshToken: 'b', expiresAt: 0 });
    storage.clear();
    await expect(storage.read()).resolves.toBeNull();
  });
});
