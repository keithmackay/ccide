/**
 * Account Service for CCIDE
 * Handles user account creation, authentication, and password management
 * Uses PBKDF2 for secure password hashing
 */

import { getDatabase, STORES } from './Database';

export interface Account {
  id: number;
  username: string;
  passwordHash: string;
  salt: string;
  createdAt: number;
  lastLoginAt: number;
}

const ACCOUNT_ID = 1; // Single account for local application
const HASH_ITERATIONS = 100000; // PBKDF2 iterations for password hashing
const HASH_LENGTH = 256; // Key length in bits
const SALT_LENGTH = 16; // Salt length in bytes

export class AccountService {
  private db = getDatabase();

  constructor() {
    this.init();
  }

  /**
   * Initialize the service
   */
  private async init(): Promise<void> {
    await this.db.init();
  }

  /**
   * Generate a cryptographic hash from a password
   * Uses PBKDF2 with SHA-256
   */
  private async hashPassword(
    password: string,
    salt: Uint8Array
  ): Promise<string> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits']
    );

    // Derive hash using PBKDF2
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: HASH_ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      HASH_LENGTH
    );

    // Convert to base64 for storage
    const hashArray = new Uint8Array(hashBuffer);
    return btoa(String.fromCharCode(...hashArray));
  }

  /**
   * Verify a password against a stored hash
   */
  private async verifyPassword(
    password: string,
    storedHash: string,
    saltBase64: string
  ): Promise<boolean> {
    const salt = Uint8Array.from(atob(saltBase64), (c) => c.charCodeAt(0));
    const hash = await this.hashPassword(password, salt);
    return hash === storedHash;
  }

  /**
   * Check if an account exists
   */
  async accountExists(): Promise<boolean> {
    const account = await this.db.get<Account>(STORES.ACCOUNTS, ACCOUNT_ID);
    return account !== undefined;
  }

  /**
   * Create a new account
   */
  async createAccount(username: string, password: string): Promise<void> {
    // Check if account already exists
    if (await this.accountExists()) {
      throw new Error('Account already exists');
    }

    // Validate inputs
    if (!username || username.trim().length < 3) {
      throw new Error('Username must be at least 3 characters');
    }

    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Generate salt
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const saltBase64 = btoa(String.fromCharCode(...salt));

    // Hash password
    const passwordHash = await this.hashPassword(password, salt);

    // Create account
    const account: Account = {
      id: ACCOUNT_ID,
      username: username.trim(),
      passwordHash,
      salt: saltBase64,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    };

    await this.db.update(STORES.ACCOUNTS, account);
  }

  /**
   * Authenticate with username and password
   * Returns the account password on success for use in decryption
   */
  async login(username: string, password: string): Promise<string> {
    const account = await this.db.get<Account>(STORES.ACCOUNTS, ACCOUNT_ID);

    if (!account) {
      throw new Error('No account found. Please create an account first.');
    }

    // Verify username
    if (account.username !== username.trim()) {
      throw new Error('Invalid username or password');
    }

    // Verify password
    const isValid = await this.verifyPassword(
      password,
      account.passwordHash,
      account.salt
    );

    if (!isValid) {
      throw new Error('Invalid username or password');
    }

    // Update last login time
    account.lastLoginAt = Date.now();
    await this.db.update(STORES.ACCOUNTS, account);

    // Return the password for use in decryption
    return password;
  }

  /**
   * Get account information (without password hash)
   */
  async getAccount(): Promise<Omit<Account, 'passwordHash' | 'salt'> | null> {
    const account = await this.db.get<Account>(STORES.ACCOUNTS, ACCOUNT_ID);

    if (!account) {
      return null;
    }

    return {
      id: account.id,
      username: account.username,
      createdAt: account.createdAt,
      lastLoginAt: account.lastLoginAt,
    };
  }

  /**
   * Change account password
   * Requires old password for verification
   */
  async changePassword(
    username: string,
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    // Verify old password first
    await this.login(username, oldPassword);

    // Validate new password
    if (!newPassword || newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters');
    }

    // Generate new salt and hash
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const saltBase64 = btoa(String.fromCharCode(...salt));
    const passwordHash = await this.hashPassword(newPassword, salt);

    // Update account
    const account = await this.db.get<Account>(STORES.ACCOUNTS, ACCOUNT_ID);
    if (account) {
      account.passwordHash = passwordHash;
      account.salt = saltBase64;
      await this.db.update(STORES.ACCOUNTS, account);
    }
  }

  /**
   * Delete the account and all associated data
   * WARNING: This will clear all settings and encrypted data
   */
  async deleteAccount(username: string, password: string): Promise<void> {
    // Verify credentials first
    await this.login(username, password);

    // Delete account
    await this.db.delete(STORES.ACCOUNTS, ACCOUNT_ID);

    // Clear all settings (encrypted LLM configs)
    await this.db.clear(STORES.SETTINGS);

    // Clear all messages
    await this.db.clear(STORES.MESSAGES);

    // Clear all projects
    await this.db.clear(STORES.PROJECTS);
  }

  /**
   * Verify if a password is correct (without updating last login)
   */
  async verifyPasswordOnly(password: string): Promise<boolean> {
    const account = await this.db.get<Account>(STORES.ACCOUNTS, ACCOUNT_ID);

    if (!account) {
      return false;
    }

    return await this.verifyPassword(password, account.passwordHash, account.salt);
  }
}

// Singleton instance
let accountInstance: AccountService | null = null;

/**
 * Get the account service instance
 */
export function getAccountService(): AccountService {
  if (!accountInstance) {
    accountInstance = new AccountService();
  }
  return accountInstance;
}
