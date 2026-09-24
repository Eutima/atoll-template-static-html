// Holds the AES-GCM key used to encrypt tokens at rest in localStorage.
//
// The key is generated non-extractable and persisted as a CryptoKey object
// directly in IndexedDB (browsers support structured-cloning non-extractable
// CryptoKeys). This raises the bar against at-rest / non-JS threats — device
// forensics, disk/backup scraping, casually reading localStorage in devtools.
// It does NOT protect against XSS in this app: a script running in-page can
// call the same decrypt path the app itself uses, since the key must stay
// usable (just not exportable) for the app to work at all. Don't treat this
// as XSS protection — it isn't one, and can't be, with no backend to hold a
// real secret.

const DB_NAME = 'helix-auth';
const STORE_NAME = 'keys';
const KEY_ID = 'token-encryption-key';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readKey(db: IDBDatabase): Promise<CryptoKey | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(KEY_ID);
    request.onsuccess = () => resolve(request.result as CryptoKey | undefined);
    request.onerror = () => reject(request.error);
  });
}

async function writeKey(db: IDBDatabase, key: CryptoKey): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(key, KEY_ID);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

let cached: Promise<CryptoKey> | undefined;

/** Returns the persistent, non-extractable encryption key, creating one on first use. */
export function getOrCreateKey(): Promise<CryptoKey> {
  if (!cached) {
    cached = (async () => {
      const db = await openDb();
      const existing = await readKey(db);
      if (existing) return existing;
      const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, [
        'encrypt',
        'decrypt',
      ]);
      await writeKey(db, key);
      return key;
    })();
  }
  return cached;
}

/** Test-only: drop the cached key so a fresh one is generated/looked up next call. */
export function resetKeyCacheForTests(): void {
  cached = undefined;
}
