import './index.css';
import { useContext, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import AuthLayout from '../../layouts/AuthLayout';
import { AuthContext } from '../../context/AuthContext.jsx';
import { emailLogin, googleLogin, register } from '../../services/authService.js';
import { HiCheck, HiDocumentText, HiShieldCheck, HiSparkles } from 'react-icons/hi2';

function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const googleLoginInFlight = useRef(false);
  const { login, setIsAuthenticating } = useContext(AuthContext);
  const navigate = useNavigate();

  // ── Email / Password login ────────────────────────────────────────────────
  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const result = isRegister
        ? await register(name, email, password)
        : await emailLogin(email, password);

      // Update auth state first, then navigate.
      login(result.token, result.user);
      toast.success(isRegister ? 'Account created!' : 'Welcome back!');
      navigate('/home');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Google OAuth login ────────────────────────────────────────────────────
  // FIX: isAuthenticating is set to true BEFORE the API call so that
  // ProtectedRoute never sees user===null while authentication is in-flight.
  // It is cleared in every exit path (success OR error).
  const handleGoogleSuccess = async (credentialResponse) => {
    if (googleLoginInFlight.current || isLoading || !credentialResponse.credential) return;
    googleLoginInFlight.current = true;
    setIsLoading(true);
    console.debug('[Auth] OAuth button clicked');
    console.debug('[Auth] OAuth request started — credential received from Google');

    // Signal to ProtectedRoute: "we are authenticating, do not redirect"
    setIsAuthenticating(true);

    try {
      console.debug('[Auth] Exchanging Google credential with backend /auth/google');
      const result = await googleLogin(credentialResponse.credential);
      console.debug('[Auth] Backend response received — token and user data OK');

      // Store token + update user in AuthContext BEFORE navigating.
      // React will batch this state update with the navigation re-render,
      // so ProtectedRoute will see user !== null on the first render at /home.
      login(result.token, result.user);

      console.debug('[Auth] Auth state updated — redirecting to /home');
      toast.success('Welcome!');
      navigate('/home');
    } catch (error) {
      console.error('[Auth] Google login error:', error.message);
      toast.error(error.response?.data?.message || error.message || 'Google login failed');
    } finally {
      // Always clear the authenticating flag so the UI is never stuck
      setIsAuthenticating(false);
      setIsLoading(false);
      googleLoginInFlight.current = false;
      console.debug('[Auth] isAuthenticating cleared');
    }
  };

  const handleGoogleError = () => {
    console.error('[Auth] Google OAuth popup closed or failed');
    setIsAuthenticating(false);
    toast.error('Google login failed. Please try again.');
  };

  const googleButtonDisabled = isLoading;

  return (
    <AuthLayout>
      <div className="login-page">
        <Link to="/" className="login-page__brand">
          <span className="login-page__logo"><HiDocumentText /></span>
          <span>AI Resume Builder</span>
        </Link>

        <section className="login-card">
          <header className="login-card__header">
            <h1 className="heading-lg">{isRegister ? 'Create your account' : 'Welcome back'}</h1>
            <p className="text-muted">{isRegister ? 'Start building AI-powered resumes.' : 'Sign in to continue building.'}</p>
          </header>

          {/* Google OAuth button — disabled while any auth is in progress */}
          <div className={`login-card__google${googleButtonDisabled ? ' login-card__google--disabled' : ''}`}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="outline"
              size="large"
              width="100%"
              text={isRegister ? 'signup_with' : 'signin_with'}
              // Prevent re-clicks while auth is in-flight
              click_listener={() => {
                if (googleButtonDisabled) return false;
                console.debug('[Auth] Google button clicked');
              }}
            />
          </div>

          <div className="login-divider"><span>or</span></div>

          <form className="login-form" onSubmit={handleSubmit}>
            {isRegister && (
              <div className="form-group">
                <label className="label-text" htmlFor="name">Name</label>
                <input id="name" value={name} onChange={(event) => setName(event.target.value)} className="input-field" placeholder="Your full name" required />
              </div>
            )}
            <div className="form-group">
              <label className="label-text" htmlFor="email">Email</label>
              <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="input-field" placeholder="you@example.com" required />
            </div>
            <div className="form-group">
              <label className="label-text" htmlFor="password">Password</label>
              <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="input-field" placeholder="At least 6 characters" minLength={6} required />
            </div>
            <button type="submit" disabled={isLoading} className="btn btn-primary login-form__submit">
              {isLoading ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <p className="login-switch text-muted">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}
            <button type="button" onClick={() => setIsRegister((value) => !value)}>
              {isRegister ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </section>

        <Link to="/" className="login-page__back">&larr; Back to Home</Link>
        <div className="login-trust">
          <span><HiShieldCheck /> Secure login</span>
          <span><HiSparkles /> AI-powered</span>
          <span><HiCheck /> Free to start</span>
        </div>
      </div>
    </AuthLayout>
  );
}

export default LoginPage;
