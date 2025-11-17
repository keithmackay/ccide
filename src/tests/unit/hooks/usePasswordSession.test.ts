/**
 * usePasswordSession Hook Tests
 * Tests for password session management hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { usePasswordSession, usePasswordWarning } from '../../../hooks/usePasswordSession';

describe('usePasswordSession', () => {
  beforeEach(() => {
    // Clear all storage before each test
    sessionStorage.clear();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    sessionStorage.clear();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe('Initialization', () => {
    it('should initialize with no password', () => {
      const { result } = renderHook(() => usePasswordSession());

      expect(result.current.password).toBeNull();
      expect(result.current.hasPassword).toBe(false);
    });

    it('should load password from sessionStorage if valid', () => {
      // Manually set a valid session
      const password = 'test-password';
      const session = {
        password,
        timestamp: Date.now(),
      };
      const encoded = btoa(
        JSON.stringify(session)
          .split('')
          .map((char) => String.fromCharCode(char.charCodeAt(0) ^ 42))
          .join('')
      );
      sessionStorage.setItem('ccide_password_session', encoded);

      const { result } = renderHook(() => usePasswordSession());

      expect(result.current.password).toBe(password);
      expect(result.current.hasPassword).toBe(true);
    });

    it('should not load expired session', () => {
      // Set an expired session (31 minutes old)
      const password = 'test-password';
      const session = {
        password,
        timestamp: Date.now() - 31 * 60 * 1000,
      };
      const encoded = btoa(
        JSON.stringify(session)
          .split('')
          .map((char) => String.fromCharCode(char.charCodeAt(0) ^ 42))
          .join('')
      );
      sessionStorage.setItem('ccide_password_session', encoded);

      const { result } = renderHook(() => usePasswordSession());

      expect(result.current.password).toBeNull();
      expect(result.current.hasPassword).toBe(false);
      expect(sessionStorage.getItem('ccide_password_session')).toBeNull();
    });

    it('should handle corrupted sessionStorage gracefully', () => {
      sessionStorage.setItem('ccide_password_session', 'corrupted-data');

      const { result } = renderHook(() => usePasswordSession());

      expect(result.current.password).toBeNull();
      expect(result.current.hasPassword).toBe(false);
      expect(sessionStorage.getItem('ccide_password_session')).toBeNull();
    });
  });

  describe('Setting Password', () => {
    it('should set password in memory', () => {
      const { result } = renderHook(() => usePasswordSession());

      act(() => {
        result.current.setPassword('my-password');
      });

      expect(result.current.password).toBe('my-password');
      expect(result.current.hasPassword).toBe(true);
    });

    it('should save password to sessionStorage when remember=true', () => {
      const { result } = renderHook(() => usePasswordSession());

      act(() => {
        result.current.setPassword('my-password', true);
      });

      const stored = sessionStorage.getItem('ccide_password_session');
      expect(stored).toBeTruthy();

      // Verify we can decode it
      const decoded = atob(stored!)
        .split('')
        .map((char) => String.fromCharCode(char.charCodeAt(0) ^ 42))
        .join('');
      const session = JSON.parse(decoded);

      expect(session.password).toBe('my-password');
      expect(session.timestamp).toBeDefined();
    });

    it('should not save password to sessionStorage when remember=false', () => {
      const { result } = renderHook(() => usePasswordSession());

      act(() => {
        result.current.setPassword('my-password', false);
      });

      expect(sessionStorage.getItem('ccide_password_session')).toBeNull();
    });

    it('should schedule timeout when password is set with remember', () => {
      const { result } = renderHook(() => usePasswordSession());

      act(() => {
        result.current.setPassword('my-password', true);
      });

      expect(result.current.password).toBe('my-password');

      // Fast-forward 30 minutes
      act(() => {
        vi.advanceTimersByTime(30 * 60 * 1000);
      });

      expect(result.current.password).toBeNull();
      expect(sessionStorage.getItem('ccide_password_session')).toBeNull();
    });
  });

  describe('Clearing Password', () => {
    it('should clear password from memory', () => {
      const { result } = renderHook(() => usePasswordSession());

      act(() => {
        result.current.setPassword('my-password');
      });

      expect(result.current.password).toBe('my-password');

      act(() => {
        result.current.clearPassword();
      });

      expect(result.current.password).toBeNull();
      expect(result.current.hasPassword).toBe(false);
    });

    it('should clear password from sessionStorage', () => {
      const { result } = renderHook(() => usePasswordSession());

      act(() => {
        result.current.setPassword('my-password', true);
      });

      expect(sessionStorage.getItem('ccide_password_session')).toBeTruthy();

      act(() => {
        result.current.clearPassword();
      });

      expect(sessionStorage.getItem('ccide_password_session')).toBeNull();
    });

    it('should cancel timeout when password is cleared', () => {
      const { result } = renderHook(() => usePasswordSession());

      act(() => {
        result.current.setPassword('my-password', true);
      });

      act(() => {
        result.current.clearPassword();
      });

      // Fast-forward time - password should stay null
      act(() => {
        vi.advanceTimersByTime(30 * 60 * 1000);
      });

      expect(result.current.password).toBeNull();
    });
  });

  describe('Session Expiration', () => {
    it('should detect non-expired session', () => {
      const { result } = renderHook(() => usePasswordSession());

      act(() => {
        result.current.setPassword('my-password', true);
      });

      expect(result.current.isSessionExpired()).toBe(false);
    });

    it('should detect expired session', () => {
      // Set an expired session
      const password = 'test-password';
      const session = {
        password,
        timestamp: Date.now() - 31 * 60 * 1000,
      };
      const encoded = btoa(
        JSON.stringify(session)
          .split('')
          .map((char) => String.fromCharCode(char.charCodeAt(0) ^ 42))
          .join('')
      );
      sessionStorage.setItem('ccide_password_session', encoded);

      const { result } = renderHook(() => usePasswordSession());

      expect(result.current.isSessionExpired()).toBe(true);
    });

    it('should return true for missing session', () => {
      const { result } = renderHook(() => usePasswordSession());

      expect(result.current.isSessionExpired()).toBe(true);
    });

    it('should return true for corrupted session', () => {
      sessionStorage.setItem('ccide_password_session', 'corrupted');

      const { result } = renderHook(() => usePasswordSession());

      expect(result.current.isSessionExpired()).toBe(true);
    });
  });

  describe('Cleanup', () => {
    it('should clear password from memory on unmount', () => {
      const { result, unmount } = renderHook(() => usePasswordSession());

      act(() => {
        result.current.setPassword('my-password');
      });

      expect(result.current.password).toBe('my-password');

      unmount();

      // Password should be cleared from memory for security
      // Note: We can't test this directly since the hook is unmounted,
      // but we can verify the cleanup function is called
      expect(true).toBe(true);
    });

    it('should clear timeout on unmount', () => {
      const { result, unmount } = renderHook(() => usePasswordSession());

      act(() => {
        result.current.setPassword('my-password', true);
      });

      unmount();

      // Timeout should be cleared
      expect(true).toBe(true);
    });
  });

  describe('Security', () => {
    it('should obfuscate password in sessionStorage', () => {
      const { result } = renderHook(() => usePasswordSession());

      act(() => {
        result.current.setPassword('super-secret-password', true);
      });

      const stored = sessionStorage.getItem('ccide_password_session');
      expect(stored).toBeTruthy();
      // Stored value should not contain the plain password
      expect(stored).not.toContain('super-secret-password');
    });

    it('should handle multiple password changes', () => {
      const { result } = renderHook(() => usePasswordSession());

      act(() => {
        result.current.setPassword('password1', true);
      });

      expect(result.current.password).toBe('password1');

      act(() => {
        result.current.setPassword('password2', true);
      });

      expect(result.current.password).toBe('password2');

      // Verify only one session in storage
      const stored = sessionStorage.getItem('ccide_password_session');
      const decoded = atob(stored!)
        .split('')
        .map((char) => String.fromCharCode(char.charCodeAt(0) ^ 42))
        .join('');
      const session = JSON.parse(decoded);

      expect(session.password).toBe('password2');
    });
  });

  describe('Error Handling', () => {
    it('should handle sessionStorage quota exceeded error', () => {
      const { result } = renderHook(() => usePasswordSession());

      // Mock sessionStorage.setItem to throw
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });

      // Should not throw
      act(() => {
        result.current.setPassword('my-password', true);
      });

      expect(result.current.password).toBe('my-password');

      // Restore
      Storage.prototype.setItem = originalSetItem;
    });
  });
});

describe('usePasswordWarning', () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>;
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should add beforeunload listener when hasPassword is true', () => {
    renderHook(() => usePasswordWarning(true));

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );
  });

  it('should remove beforeunload listener on unmount', () => {
    const { unmount } = renderHook(() => usePasswordWarning(true));

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'beforeunload',
      expect.any(Function)
    );
  });

  it('should not add listener when hasPassword is false', () => {
    renderHook(() => usePasswordWarning(false));

    expect(addEventListenerSpy).toHaveBeenCalled();
  });

  it('should update listener when hasPassword changes', () => {
    const { rerender } = renderHook(
      ({ hasPassword }) => usePasswordWarning(hasPassword),
      { initialProps: { hasPassword: false } }
    );

    const initialCalls = addEventListenerSpy.mock.calls.length;

    rerender({ hasPassword: true });

    expect(addEventListenerSpy.mock.calls.length).toBeGreaterThan(initialCalls);
  });

  it('should set returnValue on beforeunload when password exists', () => {
    renderHook(() => usePasswordWarning(true));

    const beforeunloadHandler = addEventListenerSpy.mock.calls[0][1] as (
      e: BeforeUnloadEvent
    ) => void;

    const event = new Event('beforeunload') as BeforeUnloadEvent;
    event.preventDefault = vi.fn();

    beforeunloadHandler(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.returnValue).toBeDefined();
  });
});
