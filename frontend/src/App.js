import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Note: Make sure react-hot-toast is installed
// npm install react-hot-toast
import { Toaster } from 'react-hot-toast';

// Store
import { useAuthStore, useUIStore } from './store';

// Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import InspectionStep1 from './pages/inspection/Step1';
import InspectionStep2 from './pages/inspection/Step2';
import InspectionStep3 from './pages/inspection/Step3';
import InspectionStep4 from './pages/inspection/Step4';
import InspectionPreview from './pages/inspection/Preview';
import InspectionSuccess from './pages/inspection/Success';
import InspectionList from './pages/InspectionList';
import BroadcasterList from './pages/BroadcasterList';
import Reports from './pages/reports/Reports';
import ReportGeneration from './pages/reports/ReportGeneration';
import ReportsList from './pages/reports/ReportsList';
import ReportViewer from './pages/reports/ReportViewer';
import Profile from './pages/Profile';

// Styles
import './index.css';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

function App() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const { setOnlineStatus } = useUIStore();

  // Check authentication on app load
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setOnlineStatus(true);
      // Refetch queries when coming back online
      queryClient.invalidateQueries();
    };
    const handleOffline = () => setOnlineStatus(false);

    // Set initial status
    setOnlineStatus(navigator.onLine);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus]);

  // Service Worker Registration for PWA capabilities
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={
                !isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />
              } 
            />

            {/* Protected Routes */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Dashboard */}
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />

              {/* Inspection Flow - New Inspection */}
              <Route path="inspection/new">
                <Route path="step-1" element={<InspectionStep1 />} />
                <Route path="step-2" element={<InspectionStep2 />} />
                <Route path="step-3" element={<InspectionStep3 />} />
                <Route path="step-4" element={<InspectionStep4 />} />
                <Route path="preview" element={<InspectionPreview />} />
                <Route path="success" element={<InspectionSuccess />} />
                <Route index element={<Navigate to="step-1" replace />} />
              </Route>
              
              {/* Inspection Flow - Edit existing inspection */}
              <Route path="inspection/:id">
                <Route path="step-1" element={<InspectionStep1 />} />
                <Route path="step-2" element={<InspectionStep2 />} />
                <Route path="step-3" element={<InspectionStep3 />} />
                <Route path="step-4" element={<InspectionStep4 />} />
                <Route path="preview" element={<InspectionPreview />} />
                <Route path="report" element={<ReportGeneration />} />
                <Route index element={<Navigate to="step-1" replace />} />
              </Route>

              {/* Lists and Management */}
              <Route path="inspections" element={<InspectionList />} />
              <Route path="broadcasters" element={<BroadcasterList />} />

              {/* Reports Section */}
              <Route path="reports">
                <Route index element={<Reports />} />
                <Route path="list" element={<ReportsList />} />
                <Route path="generate/:inspectionId" element={<ReportGeneration />} />
                <Route path="view/:reportId" element={<ReportViewer />} />
              </Route>

              {/* User Profile */}
              <Route path="profile" element={<Profile />} />

              {/* Catch all - redirect to dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>

            {/* Catch all for unauthenticated users */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>

          {/* Global Toast Notifications */}
          <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={8}
            containerClassName=""
            containerStyle={{}}
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                fontSize: '14px',
                fontWeight: '500',
                padding: '12px 16px',
                borderRadius: '8px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
                style: {
                  background: '#10b981',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
                style: {
                  background: '#ef4444',
                },
              },
              loading: {
                iconTheme: {
                  primary: '#3b82f6',
                  secondary: '#fff',
                },
                style: {
                  background: '#3b82f6',
                },
              },
            }}
          />
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;