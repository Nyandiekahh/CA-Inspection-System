// src/components/OfflineIndicator.js
import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useUIStore } from '../store';

const OfflineIndicator = () => {
  const { isOnline } = useUIStore();

  if (isOnline) return null;

  return (
    <div className="offline-banner">
      <div className="flex items-center">
        <WifiOff className="w-5 h-5 text-orange-500 mr-2" />
        <div>
          <p className="text-sm font-medium text-orange-800">
            You're currently offline
          </p>
          <p className="text-xs text-orange-700">
            Your changes will be saved locally and synced when you're back online.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OfflineIndicator;