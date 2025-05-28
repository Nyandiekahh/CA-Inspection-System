import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  Radio, 
  Plus, 
  BarChart3, 
  Users,
  Settings,
  ChevronRight
} from 'lucide-react';
import { useUIStore, useFormStore } from '../store';

const Sidebar = () => {
  const location = useLocation();
  const { isMobileMenuOpen, setMobileMenuOpen } = useUIStore();
  const { currentInspection, hasUnsavedChanges } = useFormStore();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
    },
    {
      name: 'New Inspection',
      href: '/inspection/new/step-1',
      icon: Plus,
      highlight: true,
    },
    {
      name: 'All Inspections',
      href: '/inspections',
      icon: FileText,
      badge: hasUnsavedChanges ? '•' : null,
    },
    {
      name: 'Broadcasters',
      href: '/broadcasters',
      icon: Radio,
    },
    {
      name: 'Reports',
      href: '/reports',
      icon: BarChart3,
      // Removed disabled: true to make it clickable
    },
    {
      name: 'Users',
      href: '/users',
      icon: Users,
      disabled: true,
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: Settings,
      disabled: true,
    },
  ];

  const isActive = (href) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:top-16 lg:bottom-0 lg:bg-white lg:border-r lg:border-gray-200">
        <div className="flex-1 flex flex-col min-h-0 pt-4 pb-4 overflow-y-auto">
          {/* Current Inspection Status */}
          {currentInspection && (
            <div className="px-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  Current Inspection
                </h4>
                <p className="text-xs text-blue-700">
                  {currentInspection.form_number}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {currentInspection.broadcaster_name}
                </p>
                {hasUnsavedChanges && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 mt-2">
                    Unsaved changes
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="px-3">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <li key={item.name}>
                    {item.disabled ? (
                      <div className="group flex items-center px-2 py-2 text-sm font-medium rounded-lg text-gray-400 cursor-not-allowed">
                        <Icon className="mr-3 h-5 w-5" />
                        {item.name}
                        <span className="ml-auto text-xs">Soon</span>
                      </div>
                    ) : (
                      <Link
                        to={item.href}
                        onClick={handleLinkClick}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                          active
                            ? 'bg-ca-blue text-white'
                            : item.highlight
                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Icon 
                          className={`mr-3 h-5 w-5 ${
                            active 
                              ? 'text-white' 
                              : item.highlight 
                              ? 'text-green-600' 
                              : 'text-gray-500'
                          }`} 
                        />
                        {item.name}
                        {item.badge && (
                          <span className="ml-auto text-red-500 font-bold">
                            {item.badge}
                          </span>
                        )}
                        {active && (
                          <ChevronRight className="ml-auto h-4 w-4" />
                        )}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white transform ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:hidden border-r border-gray-200`}>
        <div className="flex flex-col h-full pt-20 pb-4 overflow-y-auto">
          {/* Current Inspection Status - Mobile */}
          {currentInspection && (
            <div className="px-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="text-sm font-medium text-blue-900 mb-1">
                  Current Inspection
                </h4>
                <p className="text-xs text-blue-700">
                  {currentInspection.form_number}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {currentInspection.broadcaster_name}
                </p>
                {hasUnsavedChanges && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 mt-2">
                    Unsaved changes
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Navigation - Mobile */}
          <nav className="px-3">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <li key={item.name}>
                    {item.disabled ? (
                      <div className="group flex items-center px-2 py-3 text-base font-medium rounded-lg text-gray-400 cursor-not-allowed touch-target">
                        <Icon className="mr-4 h-6 w-6" />
                        {item.name}
                        <span className="ml-auto text-sm">Soon</span>
                      </div>
                    ) : (
                      <Link
                        to={item.href}
                        onClick={handleLinkClick}
                        className={`group flex items-center px-2 py-3 text-base font-medium rounded-lg transition-colors duration-200 touch-target ${
                          active
                            ? 'bg-ca-blue text-white'
                            : item.highlight
                            ? 'bg-green-50 text-green-700 hover:bg-green-100'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Icon 
                          className={`mr-4 h-6 w-6 ${
                            active 
                              ? 'text-white' 
                              : item.highlight 
                              ? 'text-green-600' 
                              : 'text-gray-500'
                          }`} 
                        />
                        {item.name}
                        {item.badge && (
                          <span className="ml-auto text-red-500 font-bold">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main content margin for desktop sidebar */}
      <div className="hidden lg:block lg:w-64 lg:flex-shrink-0" />
    </>
  );
};

export default Sidebar;