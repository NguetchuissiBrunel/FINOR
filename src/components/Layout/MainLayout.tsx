import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { PWAInstallModal } from '../PWA/PWAInstallModal';

export const MainLayout = () => {
  return (
    <div className="layout-wrapper">
      <div className="bg-decorations">
        <div className="logo-watermark"></div>
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
        <div className="circle circle-3"></div>
        <div className="circle circle-4"></div>
      </div>
      <Navbar />
      <main className="main-content">
        <div className="container">
          <Outlet />
        </div>
      </main>
      <PWAInstallModal />
    </div>
  );
};
