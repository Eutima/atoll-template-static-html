import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EnvConfigService } from '../config/env-config.service';
import { computeCodeChallenge, generateRandomUrlSafeString } from './pkce';
import { TokenStorage } from './token-storage';
import { clearPkceSession, readPkceSession, savePkceSession } from './pkce-session';
import { isWorkspaceMember } from './workspace-gate';
import type { HelixAuthStatus, HelixTenant, HelixTokenResponse, StoredTokens } from './helix-auth.models';

// Refresh this many ms before expiry, so a long-open tab doesn't get
// silently logged out mid-session.
const REFRESH_MARGIN_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class HelixAuthService {
  private readonly env = inject(EnvConfigService);
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorage);
  private readonly router = inject(Router);

  readonly status = signal<HelixAuthStatus>('checking');

  private refreshTimer: ReturnType<typeof setTimeout> | undefined;

  /** Called once at app startup (see provideAppInitializer in app.config.ts). */
  async bootstrap(): Promise<void> {
    if (!this.env.helixEnabled()) {
      this.status.set('disabled');
      return;
    }

    const stored = await this.tokenStorage.read();
    if (!stored) {
      this.status.set('anonymous');
      return;
    }

    if (stored.expiresAt - REFRESH_MARGIN_MS > Date.now()) {
      this.status.set('authenticated');
      this.scheduleRefresh(stored.expiresAt);
      return;
    }

    const refreshed = await this.refreshAccessToken(stored.refreshToken);
    this.status.set(refreshed ? 'authenticated' : 'anonymous');
  }

  async login(): Promise<void> {
    const verifier = generateRandomUrlSafeString();
    const challenge = await computeCodeChallenge(verifier);
    const state = generateRandomUrlSafeString();

    savePkceSession({ verifier, state, returnPath: this.router.url });

    const authorizeUrl = new URL('/auth/oauth/authorize/', this.env.baseUrl());
    authorizeUrl.searchParams.set('client_id', this.env.clientId());
    authorizeUrl.searchParams.set('response_type', 'code');
    authorizeUrl.searchParams.set('redirect_uri', this.env.redirectUri());
    authorizeUrl.searchParams.set('tenant', this.env.oauthTenant());
    authorizeUrl.searchParams.set('scope', 'read openid');
    authorizeUrl.searchParams.set('code_challenge', challenge);
    authorizeUrl.searchParams.set('code_challenge_method', 'S256');
    authorizeUrl.searchParams.set('state', state);

    this.status.set('authenticating');
    window.location.assign(authorizeUrl.toString());
  }

  /** Handles the /auth/helix/callback redirect. */
  async handleCallback(code: string | null, state: string | null): Promise<void> {
    this.status.set('authenticating');
    const session = readPkceSession();

    if (!code || !state || !session || state !== session.state) {
      // CSRF check / malformed callback — no network call made.
      clearPkceSession();
      this.status.set('anonymous');
      return;
    }

    try {
      const tokenResponse = await firstValueFrom(
        this.http.post<HelixTokenResponse>(
          new URL('/auth/oauth/token/', this.env.baseUrl()).toString(),
          new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: this.env.redirectUri(),
            client_id: this.env.clientId(),
            code_verifier: session.verifier,
          }),
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        )
      );

      const tenants = await firstValueFrom(
        this.http.get<HelixTenant[]>(new URL('/api/v1/tenants/', this.env.baseUrl()).toString(), {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        })
      );

      if (!isWorkspaceMember(tenants, this.env.workspaceTenant())) {
        // Not a member — discard tokens, never persist, no session created.
        this.status.set('denied');
        await this.router.navigateByUrl('/');
        return;
      }

      const stored: StoredTokens = {
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        expiresAt: Date.now() + tokenResponse.expires_in * 1000,
      };
      await this.tokenStorage.save(stored);
      this.scheduleRefresh(stored.expiresAt);
      this.status.set('authenticated');
      await this.router.navigateByUrl(session.returnPath || '/');
    } catch {
      this.status.set('anonymous');
    } finally {
      clearPkceSession();
    }
  }

  private async refreshAccessToken(refreshToken: string): Promise<boolean> {
    try {
      const tokenResponse = await firstValueFrom(
        this.http.post<HelixTokenResponse>(
          new URL('/auth/oauth/token/', this.env.baseUrl()).toString(),
          new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: this.env.clientId(),
          }),
          { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        )
      );

      const stored: StoredTokens = {
        accessToken: tokenResponse.access_token,
        // Refresh tokens rotate on every use — always persist the new one.
        refreshToken: tokenResponse.refresh_token,
        expiresAt: Date.now() + tokenResponse.expires_in * 1000,
      };
      await this.tokenStorage.save(stored);
      this.scheduleRefresh(stored.expiresAt);
      return true;
    } catch {
      await this.tokenStorage.clear();
      return false;
    }
  }

  private scheduleRefresh(expiresAt: number): void {
    clearTimeout(this.refreshTimer);
    const delay = Math.max(0, expiresAt - REFRESH_MARGIN_MS - Date.now());
    this.refreshTimer = setTimeout(async () => {
      const stored = await this.tokenStorage.read();
      if (!stored) return;
      const ok = await this.refreshAccessToken(stored.refreshToken);
      if (!ok) this.status.set('anonymous');
    }, delay);
  }

  logout(): void {
    clearTimeout(this.refreshTimer);
    this.tokenStorage.clear();
    this.status.set('anonymous');
  }
}
