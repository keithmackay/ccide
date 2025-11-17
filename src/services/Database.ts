/**
 * IndexedDB wrapper for CCIDE
 * Provides a clean API for local browser-based database operations
 */

const DB_NAME = 'ccide_db';
const DB_VERSION = 3; // Incremented for project files and folders stores

// Object store names
export const STORES = {
  ACCOUNTS: 'accounts',
  MESSAGES: 'messages',
  SETTINGS: 'settings',
  PROJECTS: 'projects',
  PROJECT_FILES: 'project_files',
  PROJECT_FOLDERS: 'project_folders',
} as const;

export class Database {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the database
   */
  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Accounts store for user authentication
        if (!db.objectStoreNames.contains(STORES.ACCOUNTS)) {
          db.createObjectStore(STORES.ACCOUNTS, {
            keyPath: 'id',
          });
        }

        // Messages store for analytics
        if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
          const messageStore = db.createObjectStore(STORES.MESSAGES, {
            keyPath: 'id',
            autoIncrement: true,
          });
          messageStore.createIndex('projectId', 'projectId', { unique: false });
          messageStore.createIndex('timestamp', 'timestamp', { unique: false });
          messageStore.createIndex('model', 'model', { unique: false });
        }

        // Settings store for encrypted configuration
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, {
            keyPath: 'id',
            autoIncrement: true,
          });
        }

        // Projects store for project metadata
        if (!db.objectStoreNames.contains(STORES.PROJECTS)) {
          const projectStore = db.createObjectStore(STORES.PROJECTS, {
            keyPath: 'id',
          });
          projectStore.createIndex('status', 'status', { unique: false });
          projectStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Project files store
        if (!db.objectStoreNames.contains(STORES.PROJECT_FILES)) {
          const filesStore = db.createObjectStore(STORES.PROJECT_FILES, {
            keyPath: 'id',
          });
          filesStore.createIndex('projectId', 'projectId', { unique: false });
          filesStore.createIndex('folder', 'folder', { unique: false });
          filesStore.createIndex('path', 'path', { unique: true });
          filesStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Project folders store
        if (!db.objectStoreNames.contains(STORES.PROJECT_FOLDERS)) {
          const foldersStore = db.createObjectStore(STORES.PROJECT_FOLDERS, {
            keyPath: 'id',
          });
          foldersStore.createIndex('projectId', 'projectId', { unique: false });
          foldersStore.createIndex('path', 'path', { unique: true });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Ensure database is initialized
   */
  private async ensureInit(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  /**
   * Add a record to a store
   */
  async add<T>(storeName: string, data: T): Promise<number> {
    const db = await this.ensureInit();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => {
        resolve(request.result as number);
      };

      request.onerror = () => {
        reject(new Error(`Failed to add record to ${storeName}`));
      };
    });
  }

  /**
   * Get a record by key
   */
  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    const db = await this.ensureInit();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result as T | undefined);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get record from ${storeName}`));
      };
    });
  }

  /**
   * Get all records from a store
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.ensureInit();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result as T[]);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get all records from ${storeName}`));
      };
    });
  }

  /**
   * Get records by index
   */
  async getByIndex<T>(
    storeName: string,
    indexName: string,
    key: IDBValidKey
  ): Promise<T[]> {
    const db = await this.ensureInit();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(key);

      request.onsuccess = () => {
        resolve(request.result as T[]);
      };

      request.onerror = () => {
        reject(new Error(`Failed to get records by index from ${storeName}`));
      };
    });
  }

  /**
   * Update a record
   */
  async update<T>(storeName: string, data: T): Promise<void> {
    const db = await this.ensureInit();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to update record in ${storeName}`));
      };
    });
  }

  /**
   * Delete a record
   */
  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    const db = await this.ensureInit();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to delete record from ${storeName}`));
      };
    });
  }

  /**
   * Clear all records from a store
   */
  async clear(storeName: string): Promise<void> {
    const db = await this.ensureInit();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error(`Failed to clear ${storeName}`));
      };
    });
  }

  /**
   * Count records in a store
   */
  async count(storeName: string): Promise<number> {
    const db = await this.ensureInit();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(new Error(`Failed to count records in ${storeName}`));
      };
    });
  }

  /**
   * Execute a custom query using a cursor
   */
  async query<T>(
    storeName: string,
    filter?: (item: T) => boolean
  ): Promise<T[]> {
    const db = await this.ensureInit();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.openCursor();
      const results: T[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const item = cursor.value as T;
          if (!filter || filter(item)) {
            results.push(item);
          }
          cursor.continue();
        } else {
          resolve(results);
        }
      };

      request.onerror = () => {
        reject(new Error(`Failed to query ${storeName}`));
      };
    });
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }
}

// Singleton instance
let dbInstance: Database | null = null;

/**
 * Get the database instance
 */
export function getDatabase(): Database {
  if (!dbInstance) {
    dbInstance = new Database();
  }
  return dbInstance;
}
