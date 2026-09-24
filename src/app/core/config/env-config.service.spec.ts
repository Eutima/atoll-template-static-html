import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EnvConfigService } from './env-config.service';

describe('EnvConfigService', () => {
  afterEach(() => {
    delete window.__env;
  });

  function create(): EnvConfigService {
    TestBed.configureTestingModule({});
    return TestBed.inject(EnvConfigService);
  }

  it('treats a real boolean true as enabled', () => {
    window.__env = { HELIX_ENABLED: true };
    expect(create().helixEnabled()).toBe(true);
  });

  it('treats a real boolean false as disabled', () => {
    window.__env = { HELIX_ENABLED: false };
    expect(create().helixEnabled()).toBe(false);
  });

  it('treats the string "true" (envsubst output) as enabled', () => {
    window.__env = { HELIX_ENABLED: 'true' };
    expect(create().helixEnabled()).toBe(true);
  });

  it('treats the string "false" (envsubst output) as disabled, not truthy', () => {
    window.__env = { HELIX_ENABLED: 'false' };
    expect(create().helixEnabled()).toBe(false);
  });

  it('defaults to disabled when window.__env is missing entirely', () => {
    delete window.__env;
    expect(create().helixEnabled()).toBe(false);
  });

  it('computes the redirect URI from the current origin', () => {
    expect(create().redirectUri()).toBe(`${window.location.origin}/auth/helix/callback`);
  });

  beforeEach(() => {
    delete window.__env;
  });
});
