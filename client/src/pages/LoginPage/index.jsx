import './index.css';
import { useContext, useState } from 'react';
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
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      const result = isRegister
        ? await register(name, email, password)
        : await emailLogin(email, password);
      login(result.token, result.user);
      toast.success(isRegister ? 'Account created!' : 'Welcome back!');
      navigate('/home');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const result = await googleLogin(credentialResponse.credential);
      login(result.token, result.user);
      toast.success('Welcome!');
      navigate('/home');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Google login failed');
    }
  };

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

          <div className="login-card__google">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => toast.error('Google login failed')}
              theme="outline"
              size="large"
              width="100%"
              text={isRegister ? 'signup_with' : 'signin_with'}
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
