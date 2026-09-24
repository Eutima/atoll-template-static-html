import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class EnvConfigService {
  private readonly raw = typeof window !== 'undefined' ? window.__env : undefined;

  // envsubst always renders a string ("true"/"false"); the checked-in dev
  // default uses a real boolean. Never do a plain truthiness check here —
  // the string "false" is truthy in JS.
  helixEnabled(): boolean {
    return String(this.raw?.HELIX_ENABLED) === 'true';
  }

  baseUrl(): string {
    return this.raw?.HELIX_BASE_URL ?? '';
  }

  clientId(): string {
    return this.raw?.HELIX_OAUTH_CLIENT_ID ?? '';
  }

  oauthTenant(): string {
    return this.raw?.HELIX_OAUTH_TENANT ?? '';
  }

  workspaceTenant(): string {
    return this.raw?.HELIX_WORKSPACE_TENANT ?? '';
  }

  redirectUri(): string {
    return `${window.location.origin}/auth/helix/callback`;
  }
}
