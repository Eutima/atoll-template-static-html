import { describe, expect, it } from 'vitest';
import { isWorkspaceMember } from './workspace-gate';
import type { HelixTenant } from './helix-auth.models';

const tenants: HelixTenant[] = [
  { id: '1', name: 'Acme Corp', slug: 'acme-corp' },
  { id: '2', name: 'Other Co', slug: 'other-co' },
];

describe('isWorkspaceMember', () => {
  it('returns true when the workspace slug is present', () => {
    expect(isWorkspaceMember(tenants, 'acme-corp')).toBe(true);
  });

  it('returns false when the workspace slug is absent', () => {
    expect(isWorkspaceMember(tenants, 'nope')).toBe(false);
  });

  it('returns false for an empty tenants array', () => {
    expect(isWorkspaceMember([], 'acme-corp')).toBe(false);
  });

  it('fails closed (denies) when workspaceTenant is blank', () => {
    expect(isWorkspaceMember(tenants, '')).toBe(false);
  });

  it('fails closed (denies) when workspaceTenant is undefined', () => {
    expect(isWorkspaceMember(tenants, undefined)).toBe(false);
  });

  it('is an exact match, not case-insensitive', () => {
    expect(isWorkspaceMember(tenants, 'Acme-Corp')).toBe(false);
  });
});
