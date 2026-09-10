import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { clearAccessToken, onSessionEnded } from '../api/session';
import { refreshAccessToken } from '../api/http';
import { fetchPrincipal, login as loginRequest, logout as logoutRequest } from './auth.api';
import type { AuthPrincipal } from './auth.api';

export type AuthStatus = 'restoring' | 'authenticated' | 'anonymous';

export interface AuthContextValue {
  status: AuthStatus;
  principal: AuthPrincipal | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /**
   * UI-only convenience for hiding controls the principal cannot use.
   * NEVER a security boundary — every one of these actions is independently
   * enforced by PermissionsGuard on the server.
   */
  can: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('restoring');
  const [principal, setPrincipal] = useState<AuthPrincipal | null>(null);

  const endSession = useCallback(() => {
    clearAccessToken();
    setPrincipal(null);
    setStatus('anonymous');
  }, []);

  // The fetch layer ends the session when a silent refresh fails. Routing
  // reacts to `status`, so there is one place that decides you are logged
  // out rather than an imperative redirect scattered through the API code.
  useEffect(() => {
    onSessionEnded(endSession);
    return () => onSessionEnded(null);
  }, [endSession]);

  // On boot there is no access token (memory-only by design), so try to
  // trade the httpOnly refresh cookie for one. This is what makes a hard
  // refresh or a bookmarked deep link keep the session.
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const refreshed = await refreshAccessToken();
      if (cancelled) return;
      if (!refreshed) {
        setStatus('anonymous');
        return;
      }
      try {
        const me = await fetchPrincipal();
        if (cancelled) return;
        setPrincipal(me);
        setStatus('authenticated');
      } catch {
        if (!cancelled) endSession();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [endSession]);

  const login = useCallback(async (email: string, password: string) => {
    await loginRequest(email, password);
    const me = await fetchPrincipal();
    setPrincipal(me);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // Server-side revocation failed (offline, already-expired token).
      // Clearing locally is still correct and strictly safer than leaving
      // the user on an authenticated-looking screen.
    } finally {
      endSession();
    }
  }, [endSession]);

  const can = useCallback(
    (permission: string) => principal?.permissionCodes.includes(permission) ?? false,
    [principal],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ status, principal, login, logout, can }),
    [status, principal, login, logout, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth mesti digunakan di dalam <AuthProvider>');
  return ctx;
}
