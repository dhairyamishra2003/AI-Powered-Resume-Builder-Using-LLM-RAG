// ============================================
// Navbar.jsx - Top Navigation Bar
// ============================================

import './index.css';
import { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext.jsx';
import { HiArrowRightOnRectangle, HiDocumentText, HiChatBubbleBottomCenterText } from 'react-icons/hi2';
import FeedbackModal from '../FeedbackModal/index.jsx';

function Navbar({ title, showBack = false }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar__left">
        {showBack && (
          <Link to="/home" className="navbar__back">
            <HiDocumentText />
            Dashboard
          </Link>
        )}
        {!showBack && (
          <>
            <Link to="/home" className="navbar-brand">
              <div className="navbar-logo">
                <HiDocumentText />
              </div>
              <span className="navbar-title">AI Resume Builder</span>
            </Link>
            {user && (
              <div className="nav-links">
                <Link
                  to="/home"
                  className={`nav-link ${location.pathname === '/home' ? 'nav-link-active' : ''}`}
                >
                  Home
                </Link>
                <Link
                  to="/templates"
                  className={`nav-link ${location.pathname === '/templates' ? 'nav-link-active' : ''}`}
                >
                  Templates
                </Link>
                <Link
                  to="/dashboard"
                  className={`nav-link ${location.pathname === '/dashboard' ? 'nav-link-active' : ''}`}
                >
                  Dashboard
                </Link>
              </div>
            )}
          </>
        )}
        {title && (
          <>
            <span className="navbar-breadcrumb">/</span>
            <span className="navbar-page-title">{title}</span>
          </>
        )}
      </div>

      <div className="navbar__right">
        <button
          type="button"
          className="navbar-feedback-btn"
          onClick={() => setIsFeedbackOpen(true)}
          title="Give Feedback"
          aria-label="Give Feedback"
        >
          <HiChatBubbleBottomCenterText />
          <span>Feedback</span>
        </button>

        {user && (
          <>
            <div className="navbar__user">
              {user.picture ? (
                <img src={user.picture} alt={user.name} className="user-avatar" />
              ) : (
                <div className="user-avatar-placeholder">
                  {user.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <span className="navbar__user-name">{user.name}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn" title="Logout">
              <HiArrowRightOnRectangle />
            </button>
          </>
        )}
      </div>

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </nav>
  );
}

export default Navbar;
