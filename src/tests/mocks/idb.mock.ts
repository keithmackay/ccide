/**
 * Mock IndexedDB implementation for testing
 */

import { vi } from 'vitest';

export class MockIDBDatabase {
  private stores: Map<string, Map<any, any>> = new Map();
  public name: string;
  public version: number;

  constructor(name: string, version: number) {
    this.name = name;
    this.version = version;
  }

  createObjectStore(name: string, options?: any) {
    const store = new Map();
    this.stores.set(name, store);
    return {
      name,
      createIndex: vi.fn(),
      add: vi.fn((value: any, key?: any) => {
        store.set(key || value.id, value);
      }),
    };
  }

  transaction(storeNames: string | string[], mode?: string) {
    return new MockIDBTransaction(this.stores, storeNames, mode);
  }
}

export class MockIDBTransaction {
  private stores: Map<string, Map<any, any>>;
  private storeNames: string[];

  constructor(
    stores: Map<string, Map<any, any>>,
    storeNames: string | string[],
    mode?: string
  ) {
    this.stores = stores;
    this.storeNames = Array.isArray(storeNames) ? storeNames : [storeNames];
  }

  objectStore(name: string) {
    const store = this.stores.get(name) || new Map();
    return new MockIDBObjectStore(store);
  }
}

export class MockIDBObjectStore {
  private store: Map<any, any>;

  constructor(store: Map<any, any>) {
    this.store = store;
  }

  get(key: any) {
    return {
      onsuccess: null,
      onerror: null,
      result: this.store.get(key),
    };
  }

  put(value: any, key?: any) {
    this.store.set(key || value.id, value);
    return {
      onsuccess: null,
      onerror: null,
    };
  }

  add(value: any, key?: any) {
    this.store.set(key || value.id, value);
    return {
      onsuccess: null,
      onerror: null,
    };
  }

  delete(key: any) {
    this.store.delete(key);
    return {
      onsuccess: null,
      onerror: null,
    };
  }

  clear() {
    this.store.clear();
    return {
      onsuccess: null,
      onerror: null,
    };
  }

  getAll() {
    return {
      onsuccess: null,
      onerror: null,
      result: Array.from(this.store.values()),
    };
  }

  getAllKeys() {
    return {
      onsuccess: null,
      onerror: null,
      result: Array.from(this.store.keys()),
    };
  }
}

/**
 * Mock openDB function from idb library
 */
export const mockOpenDB = vi.fn((name: string, version: number, config?: any) => {
  const db = new MockIDBDatabase(name, version);

  if (config?.upgrade) {
    config.upgrade(db, 0, version, null);
  }

  return Promise.resolve(db);
});
