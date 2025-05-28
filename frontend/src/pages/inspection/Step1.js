// src/pages/inspection/Step1.js - FIXED VERSION with proper broadcaster dropdown
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChevronRight, ChevronLeft, Save, AlertCircle, Plus, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

import { useFormStore } from '../../store';
import { broadcastersAPI, inspectionsAPI } from '../../services/api';
import StepIndicator from '../../components/StepIndicator';
import ProgressBar from '../../components/ProgressBar';
import LoadingSpinner from '../../components/LoadingSpinner';

// Form validation schema
const schema = yup.object({
  // Broadcaster info
  broadcaster_name: yup.string().required('Broadcaster name is required'),
  po_box: yup.string(),
  postal_code: yup.string(),
  town: yup.string(),
  location: yup.string(),
  street: yup.string(),
  phone_numbers: yup.string(),
  contact_name: yup.string(),
  contact_address: yup.string(),
  contact_phone: yup.string(),
  contact_email: yup.string().email('Invalid email format'),
  
  // General data
  station_type: yup.string().required('Station type is required'),
  transmitting_site_name: yup.string().required('Transmitting site name is required'),
  longitude: yup.string(),
  latitude: yup.string(),
  physical_location: yup.string(),
  physical_street: yup.string(),
  physical_area: yup.string(),
  altitude: yup.string(),
  land_owner_name: yup.string(),
  other_telecoms_operator: yup.boolean(),
  telecoms_operator_details: yup.string(),
});

const STEPS = [
  { id: 1, title: 'Admin & General' },
  { id: 2, title: 'Tower Info' },
  { id: 3, title: 'Transmitter' },
  { id: 4, title: 'Antenna & Final' },
];

const Step1 = () => {
  const navigate = useNavigate();
  const { id: inspectionId } = useParams();
  const isEditing = Boolean(inspectionId);

  const [showBroadcasterDropdown, setShowBroadcasterDropdown] = useState(false);
  const [broadcasterSearch, setBroadcasterSearch] = useState('');

  const { 
    formData, 
    setFormData, 
    setCurrentStep, 
    setCurrentInspection,
    setAutoSaveStatus,
    setLastSaved,
    validationErrors,
    setValidationErrors 
  } = useFormStore();

  // Load existing inspection if editing
  const { data: existingInspection, isLoading: inspectionLoading } = useQuery({
    queryKey: ['inspection', inspectionId],
    queryFn: () => inspectionsAPI.getById(inspectionId).then(res => res.data),
    enabled: isEditing,
  });

  // Load broadcasters for dropdown
  const { data: broadcastersResponse, isLoading: broadcastersLoading, refetch: refetchBroadcasters } = useQuery({
    queryKey: ['broadcasters'],
    queryFn: () => broadcastersAPI.getAll().then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Extract broadcasters array safely
  const broadcasters = React.useMemo(() => {
    if (!broadcastersResponse) return [];
    
    // Handle different response formats
    if (Array.isArray(broadcastersResponse)) {
      return broadcastersResponse;
    }
    if (broadcastersResponse.results && Array.isArray(broadcastersResponse.results)) {
      return broadcastersResponse.results;
    }
    if (broadcastersResponse.data && Array.isArray(broadcastersResponse.data)) {
      return broadcastersResponse.data;
    }
    
    console.warn('Unexpected broadcasters response format:', broadcastersResponse);
    return [];
  }, [broadcastersResponse]);

  // Filter broadcasters based on search
  const filteredBroadcasters = React.useMemo(() => {
    if (!broadcasterSearch.trim()) return broadcasters;
    
    return broadcasters.filter(broadcaster =>
      broadcaster.name?.toLowerCase().includes(broadcasterSearch.toLowerCase()) ||
      broadcaster.town?.toLowerCase().includes(broadcasterSearch.toLowerCase())
    );
  }, [broadcasters, broadcasterSearch]);

  // Form setup
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
    trigger,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: formData,
  });

  const watchedValues = watch();
  const selectedBroadcasterName = watch('broadcaster_name');

  // Auto-populate broadcaster data when selected
  useEffect(() => {
    if (selectedBroadcasterName && broadcasters.length > 0) {
      const broadcaster = broadcasters.find(b => b.name === selectedBroadcasterName);
      if (broadcaster) {
        setValue('po_box', broadcaster.po_box || '');
        setValue('postal_code', broadcaster.postal_code || '');
        setValue('town', broadcaster.town || '');
        setValue('location', broadcaster.location || '');
        setValue('street', broadcaster.street || '');
        setValue('phone_numbers', broadcaster.phone_numbers || '');
        setValue('contact_name', broadcaster.contact_name || '');
        setValue('contact_address', broadcaster.contact_address || '');
        setValue('contact_phone', broadcaster.contact_phone || '');
        setValue('contact_email', broadcaster.contact_email || '');
        
        toast.success('Broadcaster details populated');
        setShowBroadcasterDropdown(false);
      }
    }
  }, [selectedBroadcasterName, broadcasters, setValue]);

  // Auto-save mutation
  const autoSaveMutation = useMutation({
    mutationFn: async (data) => {
      console.log('🔍 Starting save with data:', data);
      
      try {
        // Step 1: Handle broadcaster (create or find)
        let broadcasterId = null;
        
        if (data.broadcaster_name) {
          const existingBroadcaster = broadcasters.find(b => b.name === data.broadcaster_name);
          
          if (existingBroadcaster) {
            broadcasterId = existingBroadcaster.id;
            console.log('✅ Using existing broadcaster:', existingBroadcaster);
          } else {
            console.log('🆕 Creating new broadcaster...');
            try {
              const broadcasterResponse = await broadcastersAPI.create({
                name: data.broadcaster_name,
                po_box: data.po_box || '',
                postal_code: data.postal_code || '',
                town: data.town || '',
                location: data.location || '',
                street: data.street || '',
                phone_numbers: data.phone_numbers || '',
                contact_name: data.contact_name || '',
                contact_address: data.contact_address || '',
                contact_phone: data.contact_phone || '',
                contact_email: data.contact_email || '',
              });
              broadcasterId = broadcasterResponse.data.id;
              console.log('✅ New broadcaster created:', broadcasterResponse.data);
              
              // Refresh broadcasters list
              await refetchBroadcasters();
            } catch (broadcasterError) {
              console.error('❌ Broadcaster creation failed:', broadcasterError);
              // Use the first available broadcaster as fallback
              const fallbackBroadcaster = broadcasters[0];
              if (fallbackBroadcaster) {
                broadcasterId = fallbackBroadcaster.id;
                console.log('📝 Using fallback broadcaster:', fallbackBroadcaster);
              } else {
                throw new Error('No broadcaster available and creation failed');
              }
            }
          }
        } else {
          // No broadcaster name provided, use the first available
          const fallbackBroadcaster = broadcasters[0];
          if (fallbackBroadcaster) {
            broadcasterId = fallbackBroadcaster.id;
            console.log('📝 Using first available broadcaster:', fallbackBroadcaster);
          }
        }

        // Step 2: Prepare inspection data with all Step 1 fields
        const inspectionData = {
          status: 'draft',
          inspection_date: new Date().toISOString().split('T')[0],
          
          // Include all Step 1 fields
          broadcaster_name: data.broadcaster_name || '',
          po_box: data.po_box || '',
          postal_code: data.postal_code || '',
          town: data.town || '',
          location: data.location || '',
          street: data.street || '',
          phone_numbers: data.phone_numbers || '',
          contact_name: data.contact_name || '',
          contact_phone: data.contact_phone || '',
          contact_email: data.contact_email || '',
          contact_address: data.contact_address || '',
          station_type: data.station_type || '',
          transmitting_site_name: data.transmitting_site_name || '',
          longitude: data.longitude || '',
          latitude: data.latitude || '',
          physical_location: data.physical_location || '',
          physical_street: data.physical_street || '',
          physical_area: data.physical_area || '',
          altitude: data.altitude || '',
          land_owner_name: data.land_owner_name || '',
          other_telecoms_operator: data.other_telecoms_operator || false,
          telecoms_operator_details: data.telecoms_operator_details || '',
        };

        // Only include broadcaster if we have one
        if (broadcasterId) {
          inspectionData.broadcaster = broadcasterId;
        }

        // Step 3: Create or update inspection
        let inspection;
        
        if (isEditing && inspectionId && inspectionId !== 'undefined') {
          console.log('📝 Updating existing inspection:', inspectionId);
          const response = await inspectionsAPI.update(inspectionId, inspectionData);
          inspection = response.data;
          console.log('✅ Inspection updated successfully:', inspection);
        } else {
          console.log('🆕 Creating new inspection...');
          
          // Make sure we have broadcaster for creation
          if (!broadcasterId) {
            throw new Error('Broadcaster is required for new inspections');
          }
          
          const response = await inspectionsAPI.create(inspectionData);
          inspection = response.data;
          console.log('✅ New inspection created:', inspection);
        }

        return inspection;
      } catch (error) {
        console.error('❌ Save operation failed:', error);
        throw error;
      }
    },
    onMutate: () => {
      setAutoSaveStatus('saving');
      console.log('🔄 Auto-save started...');
    },
    onSuccess: (inspection) => {
      setAutoSaveStatus('saved');
      setLastSaved(new Date().toISOString());
      console.log('✅ Auto-save successful:', inspection);
      
      if (!isEditing && inspection) {
        // First save - redirect to editing mode
        console.log('🔀 Redirecting to edit mode for inspection:', inspection.id);
        navigate(`/inspection/${inspection.id}/step-1`, { replace: true });
        setCurrentInspection(inspection);
      }
    },
    onError: (error) => {
      setAutoSaveStatus('error');
      console.error('❌ Auto-save failed:', error);
      
      // Show user-friendly error messages
      if (error.code === 'ERR_NETWORK') {
        toast.error('Network error - check server connection');
      } else if (error.response?.status === 400) {
        const errorMsg = error.response.data?.message || 'Validation error occurred';
        toast.error(`Save failed: ${errorMsg}`);
      } else if (error.response?.status === 404) {
        toast.error('Inspection not found - please refresh and try again');
      } else {
        toast.error('Save failed - please try again');
      }
    },
  });

  // Auto-save effect
  useEffect(() => {
    if (isDirty && Object.keys(watchedValues).length > 0) {
      const timeoutId = setTimeout(() => {
        console.log('Auto-save triggered');
        autoSaveMutation.mutate(watchedValues);
        setFormData(watchedValues);
      }, 10000); // 10 seconds

      return () => clearTimeout(timeoutId);
    }
  }, [watchedValues, isDirty, autoSaveMutation, setFormData]);

  // Set current step
  useEffect(() => {
    setCurrentStep(1);
  }, [setCurrentStep]);

  // Load existing data
  useEffect(() => {
    if (existingInspection) {
      setCurrentInspection(existingInspection);
      // Populate form with existing data
      Object.keys(existingInspection).forEach(key => {
        if (existingInspection[key] !== null && existingInspection[key] !== undefined) {
          setValue(key, existingInspection[key]);
        }
      });
    }
  }, [existingInspection, setCurrentInspection, setValue]);

  // Manual save
  const onSave = async (data) => {
    try {
      console.log('Manual save triggered');
      await trigger(); // Validate form
      
      const response = await autoSaveMutation.mutateAsync(data);
      setFormData(data);
      toast.success('Progress saved successfully');
      
      if (!isEditing && response) {
        navigate(`/inspection/${response.id}/step-1`, { replace: true });
      }
    } catch (error) {
      console.error('Manual save error:', error);
      toast.error('Failed to save progress');
    }
  };

  // Navigate to next step
  const onNext = async (data) => {
    try {
      const isValid = await trigger();
      if (!isValid) {
        setValidationErrors(errors);
        toast.error('Please fix the validation errors before continuing');
        return;
      }

      setValidationErrors({});
      await onSave(data);
      
      if (isEditing) {
        navigate(`/inspection/${inspectionId}/step-2`);
      } else {
        // Will be handled by the save redirect
        setTimeout(() => {
          navigate('../step-2', { relative: 'path' });
        }, 1000);
      }
    } catch (error) {
      toast.error('Please save your progress before continuing');
    }
  };

  // Handle broadcaster selection
  const handleBroadcasterSelect = (broadcaster) => {
    setValue('broadcaster_name', broadcaster.name);
    setBroadcasterSearch(broadcaster.name);
    setShowBroadcasterDropdown(false);
  };

  // Handle broadcaster search input
  const handleBroadcasterSearchChange = (e) => {
    const value = e.target.value;
    setBroadcasterSearch(value);
    setValue('broadcaster_name', value);
    setShowBroadcasterDropdown(value.length > 0);
  };

  if (inspectionLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  const progress = 25; // Step 1 = 25%

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditing ? 'Edit Inspection' : 'New Inspection'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Step 1: Administrative Information & General Data
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <ProgressBar progress={progress} className="w-32 h-2" />
            </div>
          </div>
          
          <StepIndicator steps={STEPS} currentStep={1} className="justify-center sm:justify-start" />
        </div>
      </div>

      {/* Validation Errors Summary */}
      {Object.keys(validationErrors).length > 0 && (
        <div className="validation-summary">
          <div className="flex items-center mb-2">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <h3 className="text-sm font-medium text-red-800">
              Please fix the following errors:
            </h3>
          </div>
          <ul className="validation-list">
            {Object.entries(validationErrors).map(([field, error]) => (
              <li key={field}>{error.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onNext)} className="space-y-6">
        {/* Administrative Information */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">
              Administrative Information
            </h2>
          </div>
          <div className="card-body">
            <div className="mobile-form">
              {/* Broadcaster Name with Search Dropdown */}
              <div className="relative">
                <label className="form-label">
                  Name of Broadcaster *
                </label>
                <div className="relative">
                  <input
                    {...register('broadcaster_name')}
                    value={broadcasterSearch}
                    onChange={handleBroadcasterSearchChange}
                    onFocus={() => setShowBroadcasterDropdown(true)}
                    className={`form-input ${errors.broadcaster_name ? 'form-input-error' : ''}`}
                    placeholder="Search for broadcaster..."
                    autoComplete="off"
                  />
                  
                  {/* Dropdown */}
                  {showBroadcasterDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {broadcastersLoading ? (
                        <div className="px-4 py-3 text-center">
                          <LoadingSpinner size="sm" />
                        </div>
                      ) : filteredBroadcasters.length > 0 ? (
                        <>
                          {filteredBroadcasters.map((broadcaster) => (
                            <button
                              key={broadcaster.id}
                              type="button"
                              onClick={() => handleBroadcasterSelect(broadcaster)}
                              className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                            >
                              <div className="font-medium">{broadcaster.name}</div>
                              {broadcaster.town && (
                                <div className="text-sm text-gray-500">{broadcaster.town}</div>
                              )}
                            </button>
                          ))}
                          
                          {/* Add New Broadcaster Option */}
                          <div className="border-t border-gray-200">
                            <button
                              type="button"
                              onClick={() => {
                                const currentData = watchedValues;
                                localStorage.setItem('inspectionDraft', JSON.stringify(currentData));
                                navigate('/broadcasters', { 
                                  state: { 
                                    returnTo: `/inspection/${inspectionId || 'new'}/step-1`,
                                    newBroadcasterName: broadcasterSearch
                                  }
                                });
                              }}
                              className="w-full px-4 py-3 text-left text-blue-600 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none flex items-center"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add "{broadcasterSearch}" as new broadcaster
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="px-4 py-3">
                          <div className="text-gray-500 text-center mb-3">
                            No broadcasters found
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const currentData = watchedValues;
                              localStorage.setItem('inspectionDraft', JSON.stringify(currentData));
                              navigate('/broadcasters', { 
                                state: { 
                                  returnTo: `/inspection/${inspectionId || 'new'}/step-1`,
                                  newBroadcasterName: broadcasterSearch
                                }
                              });
                            }}
                            className="w-full px-3 py-2 text-blue-600 hover:bg-blue-50 rounded flex items-center justify-center"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add "{broadcasterSearch}" as new broadcaster
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Click outside to close dropdown */}
                {showBroadcasterDropdown && (
                  <div 
                    className="fixed inset-0 z-5" 
                    onClick={() => setShowBroadcasterDropdown(false)}
                  />
                )}
                
                {errors.broadcaster_name && (
                  <p className="form-error">{errors.broadcaster_name.message}</p>
                )}
                
                {/* Manage Broadcasters Link */}
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const currentData = watchedValues;
                      localStorage.setItem('inspectionDraft', JSON.stringify(currentData));
                      navigate('/broadcasters', { 
                        state: { 
                          returnTo: `/inspection/${inspectionId || 'new'}/step-1`
                        }
                      });
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Manage Broadcasters
                  </button>
                </div>
              </div>

              {/* Rest of the form remains the same... */}
              {/* Address Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">P.O. Box</label>
                  <input
                    {...register('po_box')}
                    className="form-input"
                    placeholder="P.O. Box number"
                  />
                </div>
                <div>
                  <label className="form-label">Postal Code</label>
                  <input
                    {...register('postal_code')}
                    className="form-input"
                    placeholder="Postal code"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Town</label>
                <input
                  {...register('town')}
                  className="form-input"
                  placeholder="Town/City"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Location</label>
                  <input
                    {...register('location')}
                    className="form-input"
                    placeholder="Location"
                  />
                </div>
                <div>
                  <label className="form-label">Street</label>
                  <input
                    {...register('street')}
                    className="form-input"
                    placeholder="Street address"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <label className="form-label">Phone Number(s)</label>
                <textarea
                  {...register('phone_numbers')}
                  className="form-input"
                  rows="2"
                  placeholder="Enter phone numbers (separate multiple numbers with commas)"
                />
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-md font-medium text-gray-900 mb-4">
                  Contact Person
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Name</label>
                    <input
                      {...register('contact_name')}
                      className="form-input"
                      placeholder="Contact person name"
                    />
                  </div>
                  <div>
                    <label className="form-label">Phone</label>
                    <input
                      {...register('contact_phone')}
                      className="form-input"
                      placeholder="Contact phone number"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Email</label>
                  <input
                    {...register('contact_email')}
                    type="email"
                    className={`form-input ${errors.contact_email ? 'form-input-error' : ''}`}
                    placeholder="Contact email address"
                  />
                  {errors.contact_email && (
                    <p className="form-error">{errors.contact_email.message}</p>
                  )}
                </div>

                <div>
                  <label className="form-label">Address</label>
                  <textarea
                    {...register('contact_address')}
                    className="form-input"
                    rows="3"
                    placeholder="Contact person address"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* General Data */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">
              General Data
            </h2>
          </div>
          <div className="card-body">
            <div className="mobile-form">
              {/* Station Type */}
              <div>
                <label className="form-label">Type of Station *</label>
                <select
                  {...register('station_type')}
                  className={`form-input ${errors.station_type ? 'form-input-error' : ''}`}
                >
                  <option value="">Select station type</option>
                  <option value="AM">AM Radio</option>
                  <option value="FM">FM Radio</option>
                  <option value="TV">Television</option>
                </select>
                {errors.station_type && (
                  <p className="form-error">{errors.station_type.message}</p>
                )}
              </div>

              {/* Transmitting Site */}
              <div>
                <label className="form-label">Name of the Transmitting Site *</label>
                <input
                  {...register('transmitting_site_name')}
                  className={`form-input ${errors.transmitting_site_name ? 'form-input-error' : ''}`}
                  placeholder="Transmitting site name"
                />
                {errors.transmitting_site_name && (
                  <p className="form-error">{errors.transmitting_site_name.message}</p>
                )}
              </div>

              {/* Geographical Coordinates */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-md font-medium text-gray-900 mb-4">
                  Geographical Coordinates
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Longitude (dd mm ss) E</label>
                    <input
                      {...register('longitude')}
                      className="form-input"
                      placeholder="e.g., 36 48 12"
                    />
                  </div>
                  <div>
                    <label className="form-label">Latitude (dd mm ss) N/S</label>
                    <input
                      {...register('latitude')}
                      className="form-input"
                      placeholder="e.g., 01 17 35 S"
                    />
                  </div>
                </div>
              </div>

              {/* Physical Address */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-md font-medium text-gray-900 mb-4">
                  Physical Address
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">Location</label>
                    <input
                      {...register('physical_location')}
                      className="form-input"
                      placeholder="Physical location"
                    />
                  </div>
                  <div>
                    <label className="form-label">Street</label>
                    <input
                      {...register('physical_street')}
                      className="form-input"
                      placeholder="Street"
                    />
                  </div>
                  <div>
                    <label className="form-label">Area</label>
                    <input
                      {...register('physical_area')}
                      className="form-input"
                      placeholder="Area"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Altitude (m above sea level)</label>
                  <input
                    {...register('altitude')}
                    className="form-input"
                    placeholder="Altitude in meters"
                  />
                </div>
                <div>
                  <label className="form-label">Name of the Land Owner</label>
                  <input
                    {...register('land_owner_name')}
                    className="form-input"
                    placeholder="Land owner name"
                  />
                </div>
              </div>

              {/* Other Telecoms Operator */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center space-x-3">
                  <input
                    {...register('other_telecoms_operator')}
                    type="checkbox"
                    className="h-4 w-4 text-ca-blue focus:ring-ca-blue border-gray-300 rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Other Telecoms Operator on site?
                  </label>
                </div>
                
                {watch('other_telecoms_operator') && (
                  <div className="mt-4">
                    <label className="form-label">If yes, elaborate</label>
                    <textarea
                      {...register('telecoms_operator_details')}
                      className="form-input"
                      rows="3"
                      placeholder="Provide details about other telecoms operators"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="btn btn-outline"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>

          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              type="button"
              onClick={handleSubmit(onSave)}
              disabled={autoSaveMutation.isPending}
              className="btn btn-secondary"
            >
              {autoSaveMutation.isPending ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Draft
            </button>

            <button
              type="submit"
              disabled={autoSaveMutation.isPending}
              className="btn btn-primary"
            >
              Continue to Tower Info
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Step1;