export interface HelixTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  id_token?: string;
}

export interface HelixTenant {
  id: string;
  name: string;
  slug: string;
}

export interface StoredTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // epoch ms
}

export type HelixAuthStatus =
  | 'disabled'
  | 'checking'
  | 'anonymous'
  | 'authenticating'
  | 'authenticated'
  | 'denied';
