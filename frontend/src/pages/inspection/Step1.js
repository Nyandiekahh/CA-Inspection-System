// src/pages/inspection/Step1.js - COMPLETE FIXED VERSION
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChevronRight, ChevronLeft, AlertCircle, Plus, ExternalLink, Radio } from 'lucide-react';
import toast from 'react-hot-toast';

import { useFormStore } from '../../store';
import { broadcastersAPI, programsAPI, inspectionsAPI } from '../../services/api';
import StepIndicator from '../../components/StepIndicator';
import ProgressBar from '../../components/ProgressBar';
import LoadingSpinner from '../../components/LoadingSpinner';
import GPSLocationComponent from '../../components/GPSLocationComponent';

// Form validation schema - ALL FIELDS OPTIONAL
const schema = yup.object({
  // All fields are optional now
  program_name: yup.string(),
  air_status: yup.string(),
  off_air_reason: yup.string().when('air_status', {
    is: 'off_air',
    then: (schema) => schema.required('Reason for being OFF AIR is required when status is OFF AIR'),
    otherwise: (schema) => schema.notRequired(),
  }),
  broadcaster_name: yup.string(),
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
  station_type: yup.string(),
  transmitting_site_name: yup.string(),
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
  { id: 1, title: 'Program & General' },
  { id: 2, title: 'Tower Info' },
  { id: 3, title: 'Transmitter' },
  { id: 4, title: 'Antenna & Final' },
];

const Step1 = () => {
  const navigate = useNavigate();
  const { id: inspectionId } = useParams();
  const isEditing = Boolean(inspectionId);

  // Program dropdown state
  const [showProgramDropdown, setShowProgramDropdown] = useState(false);
  const [programSearch, setProgramSearch] = useState('');
  
  // Broadcaster dropdown state  
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

  // Load programs for dropdown
  const { data: programsResponse, isLoading: programsLoading, refetch: refetchPrograms } = useQuery({
    queryKey: ['programs'],
    queryFn: () => programsAPI.getAll().then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Load broadcasters for dropdown
  const { data: broadcastersResponse, isLoading: broadcastersLoading, refetch: refetchBroadcasters } = useQuery({
    queryKey: ['broadcasters'],
    queryFn: () => broadcastersAPI.getAll().then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Extract programs array safely
  const programs = React.useMemo(() => {
    if (!programsResponse) return [];
    
    if (Array.isArray(programsResponse)) {
      return programsResponse;
    }
    if (programsResponse.results && Array.isArray(programsResponse.results)) {
      return programsResponse.results;
    }
    if (programsResponse.data && Array.isArray(programsResponse.data)) {
      return programsResponse.data;
    }
    
    console.warn('Unexpected programs response format:', programsResponse);
    return [];
  }, [programsResponse]);

  // Extract broadcasters array safely
  const broadcasters = React.useMemo(() => {
    if (!broadcastersResponse) return [];
    
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

  // Filter programs based on search
  const filteredPrograms = React.useMemo(() => {
    if (!programSearch.trim()) return programs;
    
    return programs.filter(program =>
      program.name?.toLowerCase().includes(programSearch.toLowerCase()) ||
      program.description?.toLowerCase().includes(programSearch.toLowerCase())
    );
  }, [programs, programSearch]);

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
  const selectedProgramName = watch('program_name');
  const selectedBroadcasterName = watch('broadcaster_name');
  const airStatus = watch('air_status');

  // Auto-populate associated broadcasters when program is selected
  useEffect(() => {
    if (selectedProgramName && programs.length > 0) {
      const program = programs.find(p => p.name === selectedProgramName);
      if (program && program.broadcaster_names && program.broadcaster_names.length > 0) {
        // If program has associated broadcasters, suggest the first one
        const firstBroadcaster = program.broadcaster_names[0];
        if (!selectedBroadcasterName) {
          setValue('broadcaster_name', firstBroadcaster);
          setBroadcasterSearch(firstBroadcaster);
          toast.success(`Associated broadcaster "${firstBroadcaster}" auto-selected`);
        }
        setShowProgramDropdown(false);
      }
    }
  }, [selectedProgramName, programs, selectedBroadcasterName, setValue]);

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

  // Auto-save mutation - IMPROVED ERROR HANDLING
  const autoSaveMutation = useMutation({
    mutationFn: async (data) => {
      console.log('🔍 [Step1] Starting save with data:', data);
      
      try {
        // Only auto-save if there's meaningful data (not just empty form)
        const hasData = data.program_name || data.broadcaster_name || data.station_type || 
                       data.transmitting_site_name || data.physical_location || data.land_owner_name ||
                       data.air_status || data.off_air_reason;
        
        if (!hasData) {
          console.log('⏭️ [Step1] No meaningful data to save, skipping auto-save');
          return null;
        }

        let programId = null;
        let broadcasterId = null;

        // Step 1: Handle program (create or find) - OPTIONAL
        if (data.program_name && data.program_name.trim()) {
          const existingProgram = programs.find(p => p.name === data.program_name);
          
          if (existingProgram) {
            programId = existingProgram.id;
            console.log('✅ [Step1] Using existing program:', existingProgram);
          } else {
            console.log('🆕 [Step1] Creating new program...');
            try {
              const programResponse = await programsAPI.create({
                name: data.program_name,
                description: `Program for ${data.broadcaster_name || 'inspection'}`,
              });
              programId = programResponse.data.id;
              console.log('✅ [Step1] New program created:', programResponse.data);
              
              // If we have a broadcaster, associate it with the new program
              if (data.broadcaster_name && data.broadcaster_name.trim()) {
                const broadcaster = broadcasters.find(b => b.name === data.broadcaster_name);
                if (broadcaster) {
                  try {
                    await programsAPI.addBroadcaster(programId, { broadcaster_id: broadcaster.id });
                    console.log('✅ [Step1] Associated broadcaster with new program');
                  } catch (e) {
                    console.warn('⚠️ [Step1] Could not associate broadcaster with program:', e);
                  }
                }
              }
              
              // Refresh programs list
              await refetchPrograms();
            } catch (programError) {
              console.error('❌ [Step1] Program creation failed:', programError);
              console.log('⚠️ [Step1] Program creation failed, continuing without it');
            }
          }
        }

        // Step 2: Handle broadcaster (create or find) - OPTIONAL
        if (data.broadcaster_name && data.broadcaster_name.trim()) {
          const existingBroadcaster = broadcasters.find(b => b.name === data.broadcaster_name);
          
          if (existingBroadcaster) {
            broadcasterId = existingBroadcaster.id;
            console.log('✅ [Step1] Using existing broadcaster:', existingBroadcaster);
          } else {
            console.log('🆕 [Step1] Creating new broadcaster...');
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
              console.log('✅ [Step1] New broadcaster created:', broadcasterResponse.data);
              
              // Associate the program with the new broadcaster
              if (programId) {
                try {
                  await programsAPI.addBroadcaster(programId, { broadcaster_id: broadcasterId });
                  console.log('✅ [Step1] Associated program with new broadcaster');
                } catch (e) {
                  console.warn('⚠️ [Step1] Could not associate program with broadcaster:', e);
                }
              }
              
              // Refresh broadcasters list
              await refetchBroadcasters();
            } catch (broadcasterError) {
              console.error('❌ [Step1] Broadcaster creation failed:', broadcasterError);
              console.log('⚠️ [Step1] Broadcaster creation failed, continuing without it');
            }
          }
        }

        // Step 3: Prepare inspection data with all Step 1 fields INCLUDING THE MISSING ONES
        const inspectionData = {
          status: 'draft',
          inspection_date: new Date().toISOString().split('T')[0],
          
          // FIXED: Include the missing fields that were causing the error
          program_name: data.program_name || '',
          air_status: data.air_status || 'on_air',
          off_air_reason: data.off_air_reason || '',
          
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

        // Include IDs if available
        if (programId) {
          inspectionData.program = programId;
        }
        if (broadcasterId) {
          inspectionData.broadcaster = broadcasterId;
        }

        // Step 4: Create or update inspection
        let inspection;
        
        if (isEditing && inspectionId && inspectionId !== 'undefined') {
          console.log('📝 [Step1] Updating existing inspection:', inspectionId);
          const response = await inspectionsAPI.update(inspectionId, inspectionData);
          inspection = response.data;
          console.log('✅ [Step1] Inspection updated successfully:', inspection);
        } else {
          console.log('🆕 [Step1] Creating new inspection...');
          const response = await inspectionsAPI.create(inspectionData);
          inspection = response.data;
          console.log('✅ [Step1] New inspection created:', inspection);
        }

        return inspection;
      } catch (error) {
        console.error('❌ [Step1] Save operation failed:', error);
        
        // Log detailed error information
        if (error.response) {
          console.error('❌ [Step1] Error response:', error.response.data);
          console.error('❌ [Step1] Error status:', error.response.status);
        }
        
        throw error;
      }
    },
    onMutate: () => {
      setAutoSaveStatus('saving');
      console.log('🔄 [Step1] Auto-save started...');
    },
    onSuccess: (inspection) => {
      setAutoSaveStatus('saved');
      setLastSaved(new Date().toISOString());
      console.log('✅ [Step1] Auto-save successful:', inspection);
      
      if (!isEditing && inspection) {
        // First save - update current inspection but don't redirect yet
        setCurrentInspection(inspection);
        console.log('🔀 [Step1] Inspection saved, ready for navigation');
      }
    },
    onError: (error) => {
      setAutoSaveStatus('error');
      console.error('❌ [Step1] Auto-save failed:', error);
      
      // Show user-friendly error messages but don't block navigation
      if (error.code === 'ERR_NETWORK') {
        toast.error('Network error - data will be saved when connection is restored');
      } else if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData && typeof errorData === 'object') {
          // Handle validation errors
          const errorMessages = Object.entries(errorData).map(([field, messages]) => {
            const messageArray = Array.isArray(messages) ? messages : [messages];
            return `${field}: ${messageArray.join(', ')}`;
          }).join('; ');
          toast.error(`Validation error: ${errorMessages}`);
        } else {
          const errorMsg = errorData?.message || 'Validation error occurred';
          toast.error(`Save failed: ${errorMsg}`);
        }
      } else {
        toast.error('Save failed - data will be retried automatically');
      }
    },
  });

  // Auto-save effect - IMPROVED to prevent unnecessary saves
  useEffect(() => {
    if (isDirty && Object.keys(watchedValues).length > 0) {
      // Check if there's meaningful data to save
      const hasData = watchedValues.program_name || watchedValues.broadcaster_name || 
                     watchedValues.station_type || watchedValues.transmitting_site_name ||
                     watchedValues.physical_location || watchedValues.land_owner_name ||
                     watchedValues.air_status || watchedValues.off_air_reason;
      
      if (hasData) {
        const timeoutId = setTimeout(() => {
          console.log('[Step1] Auto-save triggered');
          autoSaveMutation.mutate(watchedValues);
          setFormData(watchedValues);
        }, 10000); // 10 seconds

        return () => clearTimeout(timeoutId);
      }
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

  // FIXED: Navigate to next step with improved error handling
  const onNext = async (data) => {
    try {
      console.log('🚀 [Step1] Starting navigation with data:', data);
      
      // Set loading state
      setAutoSaveStatus('saving');
      
      // Always save form data to local state first
      setFormData(data);
      
      // Check if there's meaningful data to save to backend
      const hasData = data.program_name || data.broadcaster_name || data.station_type || 
                     data.transmitting_site_name || data.physical_location || data.land_owner_name ||
                     data.air_status || data.off_air_reason;
      
      let inspectionIdToUse = inspectionId;
      
      if (hasData) {
        try {
          console.log('💾 [Step1] Auto-saving before navigation...');
          const inspection = await autoSaveMutation.mutateAsync(data);
          
          if (inspection && inspection.id) {
            inspectionIdToUse = inspection.id;
            console.log('✅ [Step1] Inspection saved with ID:', inspectionIdToUse);
            
            // Update current inspection in store
            setCurrentInspection(inspection);
          }
        } catch (error) {
          // Log error but don't block navigation entirely
          console.warn('[Step1] Save failed but attempting to proceed:', error);
          toast.warning('Could not save all data, but proceeding to next step');
        }
      }
      
      // Navigate to next step
      if (inspectionIdToUse && inspectionIdToUse !== 'undefined') {
        console.log('🧭 [Step1] Navigating to step 2 with inspection ID:', inspectionIdToUse);
        navigate(`/inspection/${inspectionIdToUse}/step-2`);
      } else if (isEditing) {
        console.log('🧭 [Step1] Navigating to step 2 (editing mode)');
        navigate(`/inspection/${inspectionId}/step-2`);
      } else {
        console.log('🧭 [Step1] Navigating to step 2 (new inspection)');
        navigate('../step-2', { relative: 'path' });
      }
      
    } catch (error) {
      // Ensure navigation always works
      console.error('[Step1] Navigation error:', error);
      setFormData(data);
      
      // Try to navigate anyway
      if (isEditing) {
        navigate(`/inspection/${inspectionId}/step-2`);
      } else {
        navigate('../step-2', { relative: 'path' });
      }
    } finally {
      setAutoSaveStatus('idle');
    }
  };

  // Handle program selection
  const handleProgramSelect = (program) => {
    setValue('program_name', program.name);
    setProgramSearch(program.name);
    setShowProgramDropdown(false);
  };

  // Handle program search input
  const handleProgramSearchChange = (e) => {
    const value = e.target.value;
    setProgramSearch(value);
    setValue('program_name', value);
    setShowProgramDropdown(value.length > 0);
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
                Step 1: Program Information & General Data
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
        {/* Program Information - PRIMARY SECTION */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center">
              <Radio className="w-5 h-5 text-ca-blue mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">
                Program Information
              </h2>
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Optional</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              All fields are optional. Fill what you know and proceed to the next step.
            </p>
          </div>
          <div className="card-body">
            <div className="mobile-form">
              {/* Program Name with Search Dropdown */}
              <div className="relative">
                <label className="form-label">
                  Program Name
                  <span className="text-xs text-gray-500 block font-normal">
                    Enter the program name you observe during inspection (optional)
                  </span>
                </label>
                <div className="relative">
                  <input
                    {...register('program_name')}
                    value={programSearch}
                    onChange={handleProgramSearchChange}
                    onFocus={() => setShowProgramDropdown(true)}
                    className={`form-input ${errors.program_name ? 'form-input-error' : ''}`}
                    placeholder="Search for program or enter new program name..."
                    autoComplete="off"
                  />
                  
                  {/* Dropdown */}
                  {showProgramDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                      {programsLoading ? (
                        <div className="px-4 py-3 text-center">
                          <LoadingSpinner size="sm" />
                        </div>
                      ) : filteredPrograms.length > 0 ? (
                        <>
                          {filteredPrograms.map((program) => (
                            <button
                              key={program.id}
                              type="button"
                              onClick={() => handleProgramSelect(program)}
                              className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                            >
                              <div className="font-medium">{program.name}</div>
                              {program.description && (
                                <div className="text-sm text-gray-500">{program.description}</div>
                              )}
                              {program.broadcaster_names && program.broadcaster_names.length > 0 && (
                                <div className="text-xs text-blue-600 mt-1">
                                  Associated with: {program.broadcaster_names.join(', ')}
                                </div>
                              )}
                            </button>
                          ))}
                          
                          {/* Add New Program Option */}
                          <div className="border-t border-gray-200">
                            <button
                              type="button"
                              onClick={() => {
                                setProgramSearch(programSearch);
                                setValue('program_name', programSearch);
                                setShowProgramDropdown(false);
                                toast.success(`"${programSearch}" will be created as a new program`);
                              }}
                              className="w-full px-4 py-3 text-left text-blue-600 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none flex items-center"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Add "{programSearch}" as new program
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="px-4 py-3">
                          <div className="text-gray-500 text-center mb-3">
                            No programs found
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setProgramSearch(programSearch);
                              setValue('program_name', programSearch);
                              setShowProgramDropdown(false);
                              toast.success(`"${programSearch}" will be created as a new program`);
                            }}
                            className="w-full px-3 py-2 text-blue-600 hover:bg-blue-50 rounded flex items-center justify-center"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add "{programSearch}" as new program
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Click outside to close dropdown */}
                {showProgramDropdown && (
                  <div 
                    className="fixed inset-0 z-5" 
                    onClick={() => setShowProgramDropdown(false)}
                  />
                )}
                
                {errors.program_name && (
                  <p className="form-error">{errors.program_name.message}</p>
                )}
              </div>

              {/* Air Status */}
              <div>
                <label className="form-label">
                  Station Status
                  <span className="text-xs text-gray-500 block font-normal">
                    Current operational status of the station (optional)
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      {...register('air_status')}
                      type="radio"
                      value="on_air"
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                    />
                    <div className="ml-3">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-sm font-medium text-gray-900">ON AIR</span>
                      </div>
                      <div className="text-xs text-gray-500">Station is operational</div>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      {...register('air_status')}
                      type="radio"
                      value="off_air"
                      className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                    />
                    <div className="ml-3">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                        <span className="text-sm font-medium text-gray-900">OFF AIR</span>
                      </div>
                      <div className="text-xs text-gray-500">Station not operational</div>
                    </div>
                  </label>
                </div>
                {errors.air_status && (
                  <p className="form-error">{errors.air_status.message}</p>
                )}
              </div>

              {/* Off Air Reason - Conditional */}
              {airStatus === 'off_air' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <label className="form-label text-red-800">
                    Reason for being OFF AIR
                    <span className="text-xs text-red-600 block font-normal">
                      Please explain why the station is not operational
                    </span>
                  </label>
                  <textarea
                    {...register('off_air_reason')}
                    className={`form-input ${errors.off_air_reason ? 'form-input-error' : ''}`}
                    rows="3"
                    placeholder="Explain why the station is not operational (e.g., equipment failure, maintenance, power issues, etc.)"
                  />
                  {errors.off_air_reason && (
                    <p className="form-error">{errors.off_air_reason.message}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Broadcaster Information - SECONDARY SECTION */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Broadcaster Information
              </h2>
              <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Optional</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Fill this if you can identify the broadcaster. This information can be added later.
            </p>
          </div>
          <div className="card-body">
            <div className="mobile-form">
              {/* Broadcaster Name with Search Dropdown */}
              <div className="relative">
                <label className="form-label">
                  Name of Broadcaster
                </label>
                <div className="relative">
                  <input
                    {...register('broadcaster_name')}
                    value={broadcasterSearch}
                    onChange={handleBroadcasterSearchChange}
                    onFocus={() => setShowBroadcasterDropdown(true)}
                    className={`form-input ${errors.broadcaster_name ? 'form-input-error' : ''}`}
                    placeholder="Search for broadcaster or leave blank if unknown..."
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
              Station Technical Information
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Technical details about the station (all optional)
            </p>
          </div>
          <div className="card-body">
            <div className="mobile-form">
              {/* Station Type */}
              <div>
                <label className="form-label">Type of Station</label>
                <select
                  {...register('station_type')}
                  className={`form-input ${errors.station_type ? 'form-input-error' : ''}`}
                >
                  <option value="">Select station type</option>
                  <option value="DAB">DAB (Digital Audio Broadcasting)</option>
                  <option value="FM">FM (Frequency Modulation)</option>
                  <option value="DTT">DTT (Digital Terrestrial Television) / DVB-T</option>
                </select>
                {errors.station_type && (
                  <p className="form-error">{errors.station_type.message}</p>
                )}
              </div>

              {/* Transmitting Site */}
              <div>
                <label className="form-label">Name of the Transmitting Site</label>
                <input
                  {...register('transmitting_site_name')}
                  className={`form-input ${errors.transmitting_site_name ? 'form-input-error' : ''}`}
                  placeholder="Transmitting site name"
                />
                {errors.transmitting_site_name && (
                  <p className="form-error">{errors.transmitting_site_name.message}</p>
                )}
              </div>
                
              {/* GPS Location */}
              <GPSLocationComponent
                setValue={setValue}
                watch={watch}
                register={register}
                errors={errors}
              />
              
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

              {/* Land Owner Information */}
              <div>
                <label className="form-label">Name of the Land Owner</label>
                <input
                  {...register('land_owner_name')}
                  type="text"
                  className="form-input"
                  placeholder="Land owner name"
                  autoComplete="off"
                />
              </div>

              {/* Manual Altitude Input */}
              <div>
                <label className="form-label">Altitude (m above sea level)</label>
                <input
                  key="altitude-input"
                  name="altitude"
                  type="text"
                  className="form-input"
                  placeholder="Altitude in meters"
                  autoComplete="off"
                  onChange={(e) => setValue('altitude', e.target.value)}
                  defaultValue={watch('altitude') || ''}
                  onFocus={(e) => e.target.select()}
                  style={{ pointerEvents: 'auto' }}
                />
                {errors.altitude && (
                  <p className="form-error">{errors.altitude.message}</p>
                )}
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

        {/* Navigation Buttons - SIMPLIFIED */}
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
              type="submit"
              disabled={autoSaveMutation.isPending}
              className="btn btn-primary"
            >
              {autoSaveMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Saving & Continuing...
                </>
              ) : (
                <>
                  Continue to Tower Info
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Step1;