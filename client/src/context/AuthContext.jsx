// ============================================
// AuthContext.jsx - Authentication State
// ============================================
// Auth states:
//   loading        — initial session check in progress (do NOT assume logged out)
//   authenticated  — user object present, token valid
//   unauthenticated — check complete, no valid session
//
// isAuthenticating — true while an OAuth / login request is in-flight.
//   ProtectedRoute must treat this like "loading" and NEVER redirect to /login
//   while a login attempt is still being processed.
// ============================================

import { createContext, useState, useEffect, useRef, useCallback } from 'react';
import { getMe } from '../services/authService.js';

const AuthContext = createContext(null);

function AuthProvider({ children }) {
  // ── Core auth state ──────────────────────────────────────────────────────
  const [user, setUser] = useState(null);

  // "loading" = initial session check not yet finished.
  // Start as true so ProtectedRoute always shows a spinner on cold load.
  const [loading, setLoading] = useState(true);

  // "isAuthenticating" = an OAuth / login request is currently in-flight.
  // While true, ProtectedRoute must NOT redirect to /login.
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Guard against double-invocation in React StrictMode dev mode.
  const checkInProgress = useRef(false);

  // ── Initial session hydration ────────────────────────────────────────────
  // Called once on mount to restore session from localStorage token.
  const checkAuth = useCallback(async () => {
    // Prevent concurrent checks (React StrictMode double-effect guard)
    if (checkInProgress.current) {
      console.debug('[Auth] checkAuth: already in progress, skipping duplicate');
      return;
    }
    checkInProgress.current = true;

    console.debug('[Auth] Session check started');
    const token = localStorage.getItem('token');

    if (!token) {
      console.debug('[Auth] Session check result: no token → unauthenticated');
      setLoading(false);
      checkInProgress.current = false;
      return;
    }

    try {
      console.debug('[Auth] Session check: token found, verifying with /auth/me');
      const userData = await getMe();
      console.debug('[Auth] Session check result: authenticated', userData?.email);
      setUser(userData);
    } catch (error) {
      console.warn('[Auth] Session check result: token invalid, clearing →', error.message);
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
      checkInProgress.current = false;
    }
  }, []);

  useEffect(() => {
    console.debug('[Auth] Auth initialization started');
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── login() — called by LoginPage after a successful API response ─────────
  // Stores the token, updates user state, then returns a Promise that resolves
  // only after the React state update has been flushed.  This lets the caller
  // safely navigate() AFTER the state is live — no race condition.
  const login = useCallback((token, userData) => {
    console.debug('[Auth] User authenticated, storing token and updating state');
    localStorage.setItem('token', token);
    setUser(userData);
    // Note: navigate() must be called by the component AFTER this function
    // returns; React batches the setState above with the render triggered by
    // navigate(), so the ProtectedRoute will see `user !== null` on that render.
  }, []);

  // ── logout() ─────────────────────────────────────────────────────────────
  const logoutUser = useCallback(() => {
    console.debug('[Auth] User logged out');
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticating,
        setIsAuthenticating,
        login,
        logout: logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext, AuthProvider };
