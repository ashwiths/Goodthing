import AsyncStorage from '@react-native-async-storage/async-storage';

const ZENFORGE_PREFIX = 'zenforge_';

// ─── Generic CRUD helpers ────────────────────────────────────────────────────

export async function storageGet<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(ZENFORGE_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function storageSet<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(ZENFORGE_PREFIX + key, JSON.stringify(value));
  } catch {
    // silently fail in prod — add telemetry here if needed
  }
}

export async function storageRemove(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(ZENFORGE_PREFIX + key);
  } catch {}
}

export async function storageClear(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const zenKeys = keys.filter(k => k.startsWith(ZENFORGE_PREFIX));
    await AsyncStorage.multiRemove(zenKeys);
  } catch {}
}

// ─── Migration helper ────────────────────────────────────────────────────────

export interface StorageVersion {
  version: number;
  migratedAt: string;
}

const VERSION_KEY = 'schema_version';

export async function getSchemaVersion(): Promise<number> {
  const v = await storageGet<StorageVersion>(VERSION_KEY);
  return v?.version ?? 0;
}

export async function setSchemaVersion(version: number): Promise<void> {
  await storageSet<StorageVersion>(VERSION_KEY, {
    version,
    migratedAt: new Date().toISOString(),
  });
}

// ─── Zustand AsyncStorage adapter (for persist middleware) ───────────────────

export const zustandAsyncStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return AsyncStorage.getItem(name);
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await AsyncStorage.setItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await AsyncStorage.removeItem(name);
  },
};
