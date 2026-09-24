import type { HelixTenant } from './helix-auth.models';

/**
 * The "gate-only" workspace-membership check. Fails closed: a blank/missing
 * workspaceTenant is a misconfiguration (HELIX_ENABLED=true with no gate
 * configured), not "let everyone in" — always deny in that case.
 */
export function isWorkspaceMember(tenants: HelixTenant[], workspaceTenant: string | undefined | null): boolean {
  if (!workspaceTenant) return false;
  return tenants.some((t) => t.slug === workspaceTenant);
}
