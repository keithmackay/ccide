/**
 * Mock crypto functions for testing encryption/decryption
 */

import { vi } from 'vitest';
import CryptoJS from 'crypto-js';

/**
 * Mock encryption function
 */
export const mockEncrypt = vi.fn((data: string, key: string): string => {
  return CryptoJS.AES.encrypt(data, key).toString();
});

/**
 * Mock decryption function
 */
export const mockDecrypt = vi.fn((encryptedData: string, key: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, key);
  return bytes.toString(CryptoJS.enc.Utf8);
});

/**
 * Mock key derivation
 */
export const mockDeriveKey = vi.fn((password: string, salt: string): string => {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: 1000,
  }).toString();
});

/**
 * Mock random IV generation
 */
export const mockGenerateIV = vi.fn((): string => {
  return CryptoJS.lib.WordArray.random(16).toString();
});

/**
 * Mock salt generation
 */
export const mockGenerateSalt = vi.fn((): string => {
  return CryptoJS.lib.WordArray.random(16).toString();
});
