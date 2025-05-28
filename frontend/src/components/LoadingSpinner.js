// src/components/LoadingSpinner.js
import React from 'react';

const LoadingSpinner = ({ size = 'md', className = '', color = 'primary' }) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    primary: 'border-ca-blue',
    white: 'border-white',
    gray: 'border-gray-600'
  };

  return (
    <div className={`loading-spinner ${sizeClasses[size]} ${colorClasses[color]} ${className}`} />
  );
};

export default LoadingSpinner;