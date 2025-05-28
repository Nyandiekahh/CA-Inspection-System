// src/components/ProgressBar.js
import React from 'react';

const ProgressBar = ({ progress, showPercentage = true, className = '' }) => {
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);
  
  return (
    <div className={`progress-bar relative ${className}`}>
      <div 
        className="progress-fill"
        style={{ width: `${normalizedProgress}%` }}
      />
      {showPercentage && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-gray-700">
            {Math.round(normalizedProgress)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;