import { Injectable } from '@angular/core';
import { getOrCreateKey } from './crypto-key-store';
import type { StoredTokens } from './helix-auth.models';

const STORAGE_KEY = 'helix_session';

function bufToBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBuf(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

@Injectable({ providedIn: 'root' })
export class TokenStorage {
  async save(tokens: StoredTokens): Promise<void> {
    const key = await getOrCreateKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode(JSON.stringify(tokens));
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ iv: bufToBase64(iv), data: bufToBase64(ciphertext) })
    );
  }

  async read(): Promise<StoredTokens | null> {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      const { iv, data } = JSON.parse(raw) as { iv: string; data: string };
      const key = await getOrCreateKey();
      const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: base64ToBuf(iv) },
        key,
        base64ToBuf(data)
      );
      return JSON.parse(new TextDecoder().decode(plaintext)) as StoredTokens;
    } catch {
      // Corrupted data, or the IndexedDB key is gone/mismatched (e.g.
      // localStorage and IndexedDB were cleared independently). Treat as
      // "no session" rather than throwing.
      this.clear();
      return null;
    }
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
