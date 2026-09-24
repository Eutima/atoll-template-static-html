// Dev/fallback runtime config. Overwritten at container start by
// nginx/docker-entrypoint.d/30-render-helix-env.sh from real env vars.
// Safe default: Helix disabled, no login gate.
window.__env = {
  HELIX_ENABLED: false,
  HELIX_BASE_URL: '',
  HELIX_OAUTH_CLIENT_ID: '',
  HELIX_OAUTH_TENANT: '',
  HELIX_WORKSPACE_TENANT: '',
};
