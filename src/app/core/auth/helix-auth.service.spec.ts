import 'fake-indexeddb/auto';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HelixAuthService } from './helix-auth.service';
import { EnvConfigService } from '../config/env-config.service';
import { TokenStorage } from './token-storage';
import { savePkceSession } from './pkce-session';
import { resetKeyCacheForTests } from './crypto-key-store';

describe('HelixAuthService', () => {
  let httpMock: HttpTestingController;
  let service: HelixAuthService;
  let navigateByUrl: ReturnType<typeof vi.fn>;

  function configure(env: Partial<ReturnType<typeof envStub>>) {
    navigateByUrl = vi.fn().mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: EnvConfigService, useValue: { ...envStub(), ...env } },
        { provide: Router, useValue: { url: '/', navigateByUrl } },
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    service = TestBed.inject(HelixAuthService);
  }

  function envStub() {
    return {
      helixEnabled: () => true,
      baseUrl: () => 'https://helix.example.com',
      clientId: () => 'client-id',
      oauthTenant: () => 'oauth-tenant',
      workspaceTenant: () => 'workspace-tenant',
      redirectUri: () => 'https://app.example.com/auth/helix/callback',
    };
  }

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    resetKeyCacheForTests();
  });

  // Lets pending promise microtasks (firstValueFrom resolving, the next
  // await in the service continuing) run before the test issues the next
  // httpMock assertion.
  function flushMicrotasks(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
  }

  it('bootstrap() sets status to disabled without touching storage when Helix is off', async () => {
    configure({ helixEnabled: () => false });
    await service.bootstrap();
    expect(service.status()).toBe('disabled');
    httpMock.verify();
  });

  it('bootstrap() sets status to anonymous when no session is stored', async () => {
    configure({});
    await service.bootstrap();
    expect(service.status()).toBe('anonymous');
    httpMock.verify();
  });

  it('handleCallback() rejects a state mismatch without making any HTTP call', async () => {
    configure({});
    savePkceSession({ verifier: 'v', state: 'expected-state', returnPath: '/' });
    await service.handleCallback('some-code', 'wrong-state');
    expect(service.status()).toBe('anonymous');
    httpMock.verify(); // throws if any request was made
  });

  it('handleCallback() authenticates and stores tokens when the user is a workspace member', async () => {
    configure({});
    savePkceSession({ verifier: 'verifier-value', state: 'matching-state', returnPath: '/dashboard' });

    const promise = service.handleCallback('auth-code', 'matching-state');

    const tokenReq = httpMock.expectOne('https://helix.example.com/auth/oauth/token/');
    expect(tokenReq.request.method).toBe('POST');
    tokenReq.flush({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expires_in: 3600,
      token_type: 'Bearer',
      scope: 'read openid',
    });
    await flushMicrotasks();

    const tenantsReq = httpMock.expectOne('https://helix.example.com/api/v1/tenants/');
    expect(tenantsReq.request.headers.get('Authorization')).toBe('Bearer access-token');
    tenantsReq.flush([{ id: '1', name: 'Workspace', slug: 'workspace-tenant' }]);

    await promise;

    expect(service.status()).toBe('authenticated');
    expect(navigateByUrl).toHaveBeenCalledWith('/dashboard');
    await expect(TestBed.inject(TokenStorage).read()).resolves.toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('handleCallback() denies and discards tokens when the user is not a workspace member', async () => {
    configure({});
    savePkceSession({ verifier: 'verifier-value', state: 'matching-state', returnPath: '/' });

    const promise = service.handleCallback('auth-code', 'matching-state');

    httpMock.expectOne('https://helix.example.com/auth/oauth/token/').flush({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expires_in: 3600,
      token_type: 'Bearer',
      scope: 'read openid',
    });
    await flushMicrotasks();
    httpMock
      .expectOne('https://helix.example.com/api/v1/tenants/')
      .flush([{ id: '2', name: 'Other', slug: 'some-other-workspace' }]);

    await promise;

    expect(service.status()).toBe('denied');
    await expect(TestBed.inject(TokenStorage).read()).resolves.toBeNull();
  });
});
