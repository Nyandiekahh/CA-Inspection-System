import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Eye, EyeOff, Lock, User, Wifi, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuthStore, useUIStore } from '../store';
import { authAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

// Validation schema
const schema = yup.object({
  username: yup
    .string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters'),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const { setUser, isAuthenticated } = useAuthStore();
  const { isOnline } = useUIStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
  });

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // In your Login.js component, replace the onSubmit function:

const onSubmit = async (data) => {
  if (!isOnline) {
    toast.error('You need to be online to login');
    return;
  }

  try {
    const response = await authAPI.login(data);
    
    // 🔧 FIX: Extract BOTH user and token from response
    const { user, token } = response.data;
    
    console.log('🎯 Login response:', {
      hasUser: !!user,
      hasToken: !!token,
      tokenPreview: token ? token.substring(0, 10) + '...' : 'none'
    });
    
    // 🔧 FIX: Pass BOTH user and token to setUser
    setUser(user, token);
    
    toast.success('Login successful!');
  } catch (error) {
    const message = error.response?.data?.detail || 
                  error.response?.data?.message ||
                  'Login failed. Please check your credentials.';
    toast.error(message);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-ca-blue rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-2xl">CA</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your inspection account
          </p>
        </div>

        {/* Connection Status */}
        <div className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg ${
          isOnline ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {isOnline ? (
            <Wifi className="w-4 h-4" />
          ) : (
            <WifiOff className="w-4 h-4" />
          )}
          <span className="text-sm font-medium">
            {isOnline ? 'Connected' : 'Offline'}
          </span>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="form-label">
                Username / Employee ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('username')}
                  type="text"
                  autoComplete="username"
                  className={`form-input pl-10 ${errors.username ? 'form-input-error' : ''}`}
                  placeholder="Enter your username"
                  disabled={isSubmitting}
                />
              </div>
              {errors.username && (
                <p className="form-error">{errors.username.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`form-input pl-10 pr-10 ${errors.password ? 'form-input-error' : ''}`}
                  placeholder="Enter your password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="form-error">{errors.password.message}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting || !isOnline}
              className="btn btn-primary w-full text-base py-3 touch-target"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            Demo Credentials
          </h3>
          <div className="text-xs text-blue-700 space-y-1">
            <div>
              <strong>Admin:</strong> username: admin, password: admin123
            </div>
            <div>
              <strong>Inspector:</strong> username: inspector1, password: password123
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Communications Authority of Kenya
          </p>
          <p className="text-xs text-gray-400 mt-1">
            FM & TV Inspection System v1.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;