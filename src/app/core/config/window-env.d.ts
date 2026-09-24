export {};

declare global {
  interface Window {
    __env?: {
      HELIX_ENABLED?: string | boolean;
      HELIX_BASE_URL?: string;
      HELIX_OAUTH_CLIENT_ID?: string;
      HELIX_OAUTH_TENANT?: string;
      HELIX_WORKSPACE_TENANT?: string;
    };
  }
}
