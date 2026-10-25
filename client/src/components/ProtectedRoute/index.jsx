// ============================================
// ProtectedRoute.jsx
// ============================================
// Guards authenticated routes.
// CRITICAL: must treat BOTH "loading" (initial session check) AND
// "isAuthenticating" (OAuth / login in-flight) as non-final states.
// NEVER redirect to /login while either flag is true.
// ============================================

import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';

function ProtectedRoute({ children }) {
  const { user, loading, isAuthenticating } = useContext(AuthContext);

  // Show spinner while:
  //   • the initial session check is still running (loading)
  //   • an OAuth / login request is in-flight (isAuthenticating)
  // In both cases we MUST NOT redirect — doing so causes the two-click bug.
  if (loading || isAuthenticating) {
    return (
      <div className="page-bg flex-center min-h-screen">
        <div className="flex-col items-center gap-sm">
          <div className="spinner" />
          <p className="text-muted">
            {isAuthenticating ? 'Signing you in…' : 'Loading…'}
          </p>
        </div>
      </div>
    );
  }

  // Only redirect once we KNOW the user is not authenticated.
  if (!user) return <Navigate to="/login" />;

  return children;
}

export default ProtectedRoute;
