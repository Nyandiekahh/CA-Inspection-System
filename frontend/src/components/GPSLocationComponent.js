// src/components/GPSLocationComponent.js
import React, { useState } from 'react';
import { MapPin, Loader2, AlertCircle, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const GPSLocationComponent = ({ setValue, watch, register, errors }) => {
  const [loading, setLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const [accuracy, setAccuracy] = useState(null);

  // Convert decimal degrees to degrees minutes seconds format
  const decimalToDMS = (decimal, isLongitude = false) => {
    const abs = Math.abs(decimal);
    const degrees = Math.floor(abs);
    const minutes = Math.floor((abs - degrees) * 60);
    const seconds = Math.round(((abs - degrees) * 60 - minutes) * 60);
    
    // Determine direction
    let direction;
    if (isLongitude) {
      direction = decimal >= 0 ? 'E' : 'W';
    } else {
      direction = decimal >= 0 ? 'N' : 'S';
    }
    
    return `${degrees.toString().padStart(2, '0')} ${minutes.toString().padStart(2, '0')} ${seconds.toString().padStart(2, '0')} ${direction}`;
  };

  // Get current GPS location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    setLocationStatus('Getting location...');

    const options = {
      enableHighAccuracy: true, // Use GPS if available
      timeout: 15000, // 15 second timeout
      maximumAge: 60000 // Accept cached position up to 1 minute old
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, altitude, accuracy: posAccuracy } = position.coords;
        
        // Convert to DMS format for your form
        const latitudeDMS = decimalToDMS(latitude, false);
        const longitudeDMS = decimalToDMS(longitude, true);
        
        // Update form fields
        setValue('latitude', latitudeDMS);
        setValue('longitude', longitudeDMS);
        
        // Update altitude if available (in meters)
        if (altitude !== null) {
          setValue('altitude', Math.round(altitude).toString());
        } else {
          // If altitude not available from GPS, show a note using correct toast syntax
          toast('Altitude not available from GPS - you may need to enter manually', {
            icon: 'ℹ️',
            duration: 4000,
          });
        }
        
        setAccuracy(posAccuracy);
        setLocationStatus('Location updated successfully');
        setLoading(false);
        
        // Show success message with coordinates
        toast.success(`Location updated! Accuracy: ±${Math.round(posAccuracy)}m`);
        
        console.log('GPS Location obtained:', {
          latitude: latitude,
          longitude: longitude,
          altitude: altitude,
          accuracy: posAccuracy,
          latitudeDMS: latitudeDMS,
          longitudeDMS: longitudeDMS
        });
      },
      (error) => {
        setLoading(false);
        setLocationStatus('');
        
        let errorMessage;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. Please check your GPS/location services.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timeout. Please try again.';
            break;
          default:
            errorMessage = 'An error occurred while retrieving location.';
            break;
        }
        
        toast.error(errorMessage);
        console.error('GPS Error:', error);
      },
      options
    );
  };

  // Check if location is supported and get permission status
  const checkLocationSupport = () => {
    if (!navigator.geolocation) {
      return { supported: false, message: 'Geolocation not supported' };
    }
    
    if (!window.isSecureContext) {
      return { 
        supported: false, 
        message: 'HTTPS required for GPS functionality' 
      };
    }
    
    return { supported: true };
  };

  const locationSupport = checkLocationSupport();
  const currentLatitude = watch('latitude');
  const currentLongitude = watch('longitude');
  const currentAltitude = watch('altitude');
  
  // Check if coordinates look like they were populated by GPS (DMS format)
  const hasGPSCoordinates = currentLatitude && currentLongitude && 
    (currentLatitude.includes(' ') && currentLongitude.includes(' '));

  return (
    <div className="border-t border-gray-200 pt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-md font-medium text-gray-900">
          Geographical Coordinates
        </h3>
        
        {/* GPS Button */}
        {locationSupport.supported ? (
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={loading}
            className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Getting GPS...
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4 mr-2" />
                Get GPS Location
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center text-sm text-gray-500">
            <AlertCircle className="w-4 h-4 mr-1" />
            {locationSupport.message}
          </div>
        )}
      </div>

      {/* Status indicator */}
      {locationStatus && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center">
            <Check className="w-4 h-4 text-blue-600 mr-2" />
            <span className="text-sm text-blue-800">{locationStatus}</span>
            {accuracy && (
              <span className="ml-2 text-xs text-blue-600">
                (±{Math.round(accuracy)}m accuracy)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Coordinate input fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="form-label">Longitude (dd mm ss) E</label>
          <input
            {...register('longitude')}
            className="form-input"
            placeholder="e.g., 36 48 12 E"
          />
          <p className="text-xs text-gray-500 mt-1">
            Format: degrees minutes seconds direction
          </p>
        </div>
        <div>
          <label className="form-label">Latitude (dd mm ss) N/S</label>
          <input
            {...register('latitude')}
            className="form-input"
            placeholder="e.g., 01 17 35 S"
          />
          <p className="text-xs text-gray-500 mt-1">
            Format: degrees minutes seconds direction
          </p>
        </div>
      </div>

      {/* Altitude field */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Altitude (m above sea level)</label>
          <input
            {...register('altitude')}
            className="form-input"
            placeholder="Altitude in meters"
          />
          <p className="text-xs text-gray-500 mt-1">
            GPS altitude may be inaccurate - verify if needed
          </p>
        </div>
        
        {/* Show current coordinates summary if available */}
        {hasGPSCoordinates && (
          <div className="flex flex-col justify-center">
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <h4 className="text-sm font-medium text-green-800 mb-1">
                Current Coordinates:
              </h4>
              <div className="text-xs text-green-700 space-y-1">
                <div>Lat: {currentLatitude}</div>
                <div>Lng: {currentLongitude}</div>
                {currentAltitude && <div>Alt: {currentAltitude}m</div>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Help text */}
      <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
        <div className="flex items-start">
          <AlertCircle className="w-4 h-4 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-gray-600">
            <strong>GPS Tips:</strong>
            <ul className="mt-1 space-y-1 list-disc list-inside text-xs">
              <li>Works best outdoors with clear sky view</li>
              <li>Mobile devices typically more accurate than laptops</li>
              <li>Coordinates auto-convert to degrees/minutes/seconds format</li>
              <li>You can still enter coordinates manually if GPS is unavailable</li>
              <li>Altitude from GPS may be less accurate than horizontal position</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GPSLocationComponent;