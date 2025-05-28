import React from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Bell, User } from 'lucide-react';
import { useAuthStore, useUIStore } from '../store';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const { isMobileMenuOpen, setMobileMenuOpen } = useUIStore();

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      logout();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      logout(); // Force logout even if API call fails
    }
  };

  return (
    <nav className="fixed top-0 z-50 w-full bg-white shadow-sm border-b border-gray-200">
      <div className="px-3 py-3 lg:px-5 lg:pl-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center justify-start">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg lg:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
            
            {/* Logo */}
            <Link to="/dashboard" className="flex ml-2 md:mr-24">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-ca-blue rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">CA</span>
                </div>
                <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap text-gray-900">
                  Inspection System
                </span>
              </div>
            </Link>
          </div>
          
          <div className="flex items-center">
            <div className="flex items-center ml-3">
              {/* Notifications */}
              <button className="p-2 text-gray-500 rounded-lg hover:text-gray-900 hover:bg-gray-100 focus:ring-4 focus:ring-gray-300">
                <Bell className="w-5 h-5" />
              </button>
              
              {/* User menu */}
              <div className="flex items-center ml-3">
                <div className="flex items-center text-sm">
                  <div className="mr-3 text-right hidden sm:block">
                    <div className="font-medium text-gray-900">
                      {user?.first_name} {user?.last_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user?.employee_id} • {user?.department}
                    </div>
                  </div>
                  
                  <div className="relative">
                    <button
                      className="flex text-sm bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-300"
                      onClick={handleLogout}
                    >
                      <div className="w-8 h-8 bg-ca-blue rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;