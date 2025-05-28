// src/components/AutoSaveIndicator.js
import React from 'react';
import { Save, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { useFormStore } from '../store';
import { formatDistanceToNow } from 'date-fns';

const AutoSaveIndicator = () => {
  const { autoSaveStatus, lastSaved, hasUnsavedChanges } = useFormStore();

  if (!lastSaved && !hasUnsavedChanges) return null;

  const getStatusIcon = () => {
    switch (autoSaveStatus) {
      case 'saving':
        return <Save className="w-4 h-4 animate-spin" />;
      case 'saved':
        return <CheckCircle className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    switch (autoSaveStatus) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return lastSaved ? `Saved ${formatDistanceToNow(new Date(lastSaved))} ago` : 'Saved';
      case 'error':
        return 'Save failed - Click to retry';
      default:
        return hasUnsavedChanges ? 'Unsaved changes' : '';
    }
  };

  const getStatusColor = () => {
    switch (autoSaveStatus) {
      case 'saving':
        return 'autosave-saving';
      case 'saved':
        return 'autosave-saved';
      case 'error':
        return 'autosave-error';
      default:
        return 'autosave-indicator';
    }
  };

  return (
    <div className={`autosave-indicator ${getStatusColor()} px-4 py-2 bg-white border-b border-gray-200`}>
      {getStatusIcon()}
      <span>{getStatusText()}</span>
    </div>
  );
};

export default AutoSaveIndicator;