import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import AutoSaveIndicator from './AutoSaveIndicator';
import OfflineIndicator from './OfflineIndicator';
import { useUIStore } from '../store';

const Layout = () => {
  const { isMobileMenuOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Offline Indicator */}
      <OfflineIndicator />
      
      {/* Navbar */}
      <Navbar />
      
      <div className="flex h-screen pt-16">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Auto-save Indicator */}
          <AutoSaveIndicator />
          
          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-gray-50 focus:outline-none">
            <div className="py-6">
              <div className="mobile-container max-w-7xl mx-auto">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>
      
      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => useUIStore.getState().setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;