import './index.css';
import Navbar from '../../components/Navbar';

function HomeLayout({ children }) {
  return (
    <div className="home-layout">
      <Navbar />
      <main className="home-layout__main">{children}</main>
    </div>
  );
}

export default HomeLayout;
