// src/components/ValidationSummary.js
import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ValidationSummary = ({ errors, onDismiss, className = '' }) => {
  if (!errors || Object.keys(errors).length === 0) return null;

  return (
    <div className={`validation-summary ${className}`} role="alert">
      <div className="flex items-start justify-between">
        <div className="flex items-center mb-2">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
          <h3 className="text-sm font-medium text-red-800">
            Please fix the following errors:
          </h3>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-600"
            aria-label="Dismiss validation errors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <ul className="validation-list">
        {Object.entries(errors).map(([field, error]) => (
          <li key={field}>
            <strong>{field.replace('_', ' ')}:</strong> {error.message || error}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ValidationSummary;