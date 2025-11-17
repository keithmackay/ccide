import { afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

// Mock scrollIntoView for DOM elements
beforeAll(() => {
  // Mock Element.prototype.scrollIntoView
  Element.prototype.scrollIntoView = vi.fn();

  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

// Cleanup after each test case
afterEach(() => {
  cleanup();
});
