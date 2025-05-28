// src/components/FormField.js
import React from 'react';

const FormField = ({ 
  label, 
  required = false, 
  error, 
  children, 
  className = '',
  description 
}) => {
  return (
    <div className={`form-field ${className}`}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {description && (
        <p className="text-xs text-gray-500 mt-1 mb-2">{description}</p>
      )}
      {children}
      {error && (
        <p className="form-error" role="alert">{error}</p>
      )}
    </div>
  );
};

export default FormField;