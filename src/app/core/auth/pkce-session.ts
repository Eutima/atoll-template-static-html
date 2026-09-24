// Short-lived PKCE round-trip state. sessionStorage only, cleared right
// after the callback consumes it (success or failure) — these values are
// only useful paired with a single-use authorization code, unlike the
// long-lived tokens in token-storage.ts.

const VERIFIER_KEY = 'helix_pkce_verifier';
const STATE_KEY = 'helix_pkce_state';
const RETURN_PATH_KEY = 'helix_pkce_return_path';

export interface PkceSession {
  verifier: string;
  state: string;
  returnPath: string;
}

export function savePkceSession(session: PkceSession): void {
  sessionStorage.setItem(VERIFIER_KEY, session.verifier);
  sessionStorage.setItem(STATE_KEY, session.state);
  sessionStorage.setItem(RETURN_PATH_KEY, session.returnPath);
}

export function readPkceSession(): PkceSession | null {
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  const state = sessionStorage.getItem(STATE_KEY);
  const returnPath = sessionStorage.getItem(RETURN_PATH_KEY);
  if (!verifier || !state) return null;
  return { verifier, state, returnPath: returnPath ?? '/' };
}

export function clearPkceSession(): void {
  sessionStorage.removeItem(VERIFIER_KEY);
  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(RETURN_PATH_KEY);
}
