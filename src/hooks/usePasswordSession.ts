import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for managing password session with security features
 *
 * Features:
 * - In-memory password storage
 * - Optional sessionStorage encryption
 * - Auto-clear on tab close
 * - Session timeout
 * - Security cleanup on unmount
 */

const SESSION_STORAGE_KEY = 'ccide_password_session';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

interface PasswordSession {
  password: string;
  timestamp: number;
}

export interface UsePasswordSessionReturn {
  password: string | null;
  hasPassword: boolean;
  setPassword: (password: string, remember?: boolean) => void;
  clearPassword: () => void;
  isSessionExpired: () => boolean;
}

/**
 * Simple encryption for sessionStorage (additional layer of security)
 * Note: This is NOT cryptographically secure, just obfuscation
 */
function obfuscate(text: string): string {
  return btoa(
    text
      .split('')
      .map((char) => String.fromCharCode(char.charCodeAt(0) ^ 42))
      .join('')
  );
}

function deobfuscate(encoded: string): string {
  try {
    return atob(encoded)
      .split('')
      .map((char) => String.fromCharCode(char.charCodeAt(0) ^ 42))
      .join('');
  } catch {
    return '';
  }
}

export function usePasswordSession(): UsePasswordSessionReturn {
  const [password, setPasswordState] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load password from sessionStorage on mount
  useEffect(() => {
    const loadFromSession = () => {
      try {
        const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (stored) {
          const decoded = deobfuscate(stored);
          const session: PasswordSession = JSON.parse(decoded);

          // Check if session is still valid
          const age = Date.now() - session.timestamp;
          if (age < SESSION_TIMEOUT_MS) {
            setPasswordState(session.password);
            scheduleTimeout(SESSION_TIMEOUT_MS - age);
          } else {
            // Session expired, clear it
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
          }
        }
      } catch (error) {
        // Failed to load, clear storage
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    };

    loadFromSession();

    // Cleanup on unmount - clear password from memory
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Overwrite password in memory for security
      setPasswordState(null);
    };
  }, []);

  // Schedule automatic password clearing
  const scheduleTimeout = useCallback((timeoutMs: number) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setPasswordState(null);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }, timeoutMs);
  }, []);

  // Set password and optionally save to sessionStorage
  const setPassword = useCallback(
    (newPassword: string, remember: boolean = false) => {
      setPasswordState(newPassword);

      if (remember) {
        try {
          const session: PasswordSession = {
            password: newPassword,
            timestamp: Date.now(),
          };
          const encoded = obfuscate(JSON.stringify(session));
          sessionStorage.setItem(SESSION_STORAGE_KEY, encoded);
          scheduleTimeout(SESSION_TIMEOUT_MS);
        } catch (error) {
          console.error('Failed to save password to session:', error);
        }
      }
    },
    [scheduleTimeout]
  );

  // Clear password from memory and storage
  const clearPassword = useCallback(() => {
    setPasswordState(null);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Check if session is expired
  const isSessionExpired = useCallback((): boolean => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (!stored) return true;

      const decoded = deobfuscate(stored);
      const session: PasswordSession = JSON.parse(decoded);
      const age = Date.now() - session.timestamp;

      return age >= SESSION_TIMEOUT_MS;
    } catch {
      return true;
    }
  }, []);

  return {
    password,
    hasPassword: password !== null,
    setPassword,
    clearPassword,
    isSessionExpired,
  };
}

/**
 * Warning handler for tab close with password in memory
 */
export function usePasswordWarning(hasPassword: boolean): void {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasPassword) {
        e.preventDefault();
        e.returnValue = 'You have a password stored in memory. Are you sure you want to leave?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasPassword]);
}
