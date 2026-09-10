import './index.css';

function AuthLayout({ children }) {
  return (
    <main className="auth-layout">
      <section className="auth-layout__panel">{children}</section>
    </main>
  );
}

export default AuthLayout;
