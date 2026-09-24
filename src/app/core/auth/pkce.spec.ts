import { describe, expect, it } from 'vitest';
import { computeCodeChallenge, generateRandomUrlSafeString } from './pkce';

describe('pkce', () => {
  it('reproduces the RFC 7636 Appendix B.1 known test vector', async () => {
    const verifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
    const challenge = await computeCodeChallenge(verifier);
    expect(challenge).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });

  it('generates strings within the 43-128 char range using an unreserved charset', () => {
    const value = generateRandomUrlSafeString();
    expect(value.length).toBeGreaterThanOrEqual(43);
    expect(value.length).toBeLessThanOrEqual(128);
    expect(value).toMatch(/^[A-Za-z0-9\-_]+$/);
  });

  it('generates different values on each call', () => {
    const a = generateRandomUrlSafeString();
    const b = generateRandomUrlSafeString();
    expect(a).not.toBe(b);
  });
});
