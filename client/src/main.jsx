import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught app error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="root-error">
          <div className="root-error__card">
            <h2>Something went wrong</h2>
            <p>
              {this.state.error?.message || 'An unexpected error occurred while rendering the page.'}
            </p>
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const rawClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const trimmedClientId = String(rawClientId || '').trim();
const googleClientId = (trimmedClientId && !trimmedClientId.startsWith('your-google-') && trimmedClientId.length > 10)
  ? trimmedClientId
  : '100000000000-dummyclientid.apps.googleusercontent.com';

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <GoogleOAuthProvider clientId={googleClientId}>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        </AuthProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </ErrorBoundary>
);
