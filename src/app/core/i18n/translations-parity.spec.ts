import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { AVAILABLE_LANGS, DEFAULT_LANG } from './i18n.model';

const I18N_DIR = join(__dirname, '../../../../public/assets/i18n');

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value && typeof value === 'object' && !Array.isArray(value)
      ? flattenKeys(value as Record<string, unknown>, path)
      : [path];
  });
}

function loadKeys(lang: string): string[] {
  const raw = readFileSync(join(I18N_DIR, `${lang}.json`), 'utf-8');
  return flattenKeys(JSON.parse(raw)).sort();
}

describe('translation files', () => {
  const referenceKeys = loadKeys(DEFAULT_LANG);

  it('has a non-empty reference key set', () => {
    expect(referenceKeys.length).toBeGreaterThan(0);
  });

  for (const lang of AVAILABLE_LANGS.filter((l) => l !== DEFAULT_LANG)) {
    it(`${lang}.json has exactly the same keys as ${DEFAULT_LANG}.json`, () => {
      expect(loadKeys(lang)).toEqual(referenceKeys);
    });
  }
});
