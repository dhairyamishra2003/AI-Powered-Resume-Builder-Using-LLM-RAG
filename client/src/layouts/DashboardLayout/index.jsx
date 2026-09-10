import './index.css';
import Navbar from '../../components/Navbar';

function DashboardLayout({ children }) {
  return (
    <div className="dashboard-layout">
      <Navbar />
      <main className="dashboard-layout__main">{children}</main>
    </div>
  );
}

export default DashboardLayout;
