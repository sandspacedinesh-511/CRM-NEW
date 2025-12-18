import { Outlet } from 'react-router-dom';
import MarketingNavbar from '../components/marketing/Navbar';

function MarketingLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <MarketingNavbar />
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>
    </div>
  );
}

export default MarketingLayout;