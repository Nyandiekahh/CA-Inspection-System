// src/pages/inspection/Step4.js
import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChevronRight, ChevronLeft, Save, FileText, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import { useFormStore } from '../../store';
import { inspectionsAPI } from '../../services/api';
import StepIndicator from '../../components/StepIndicator';
import ProgressBar from '../../components/ProgressBar';
import LoadingSpinner from '../../components/LoadingSpinner';

const schema = yup.object({
  // Antenna System
  height_on_tower: yup.string(),
  antenna_type: yup.string(),
  antenna_manufacturer: yup.string(),
  antenna_model_number: yup.string(),
  polarization: yup.string(),
  horizontal_pattern: yup.string(),
  beam_width_3db: yup.string(),
  max_gain_azimuth: yup.string(),
  horizontal_pattern_table: yup.string(),
  has_mechanical_tilt: yup.boolean(),
  mechanical_tilt_degree: yup.string(),
  has_electrical_tilt: yup.boolean(),
  electrical_tilt_degree: yup.string(),
  has_null_fill: yup.boolean(),
  null_fill_percentage: yup.string(),
  vertical_pattern_table: yup.string(),
  antenna_gain: yup.string(),
  estimated_antenna_losses: yup.string(),
  estimated_feeder_losses: yup.string(),
  estimated_multiplexer_losses: yup.string(),
  effective_radiated_power: yup.string(),
  antenna_catalog_attached: yup.boolean(),
  
  // Studio Link
  studio_manufacturer: yup.string(),
  studio_model_number: yup.string(),
  studio_serial_number: yup.string(),
  studio_frequency: yup.string(),
  studio_polarization: yup.string(),
  signal_description: yup.string(),
  
  // Final Info
  technical_personnel: yup.string(),
  other_observations: yup.string(),
});

const STEPS = [
  { id: 1, title: 'Admin & General' },
  { id: 2, title: 'Tower Info' },
  { id: 3, title: 'Transmitter' },
  { id: 4, title: 'Antenna & Final' },
];

const Step4 = () => {
  const navigate = useNavigate();
  const { id: inspectionId } = useParams();
  const isEditing = Boolean(inspectionId);

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
  const watchPolarization = watch('polarization');
  const watchHorizontalPattern = watch('horizontal_pattern');
  const watchHasMechanicalTilt = watch('has_mechanical_tilt');
  const watchHasElectricalTilt = watch('has_electrical_tilt');
  const watchHasNullFill = watch('has_null_fill');

  // Auto-save mutation - EXACT SAME PATTERN AS STEP 1, 2 & 3
  const autoSaveMutation = useMutation({
    mutationFn: async (data) => {
      console.log('🔍 [Step4] Starting save with data:', data);
      
      try {
        // Prepare inspection data with antenna fields - JUST LIKE STEP 1, 2 & 3
        const inspectionData = {
          status: 'draft',
          inspection_date: new Date().toISOString().split('T')[0],
          // Add antenna fields directly to inspection record
          height_on_tower: data.height_on_tower || '',
          antenna_type: data.antenna_type || '',
          manufacturer: data.manufacturer || '',
          model_number: data.model_number || '',
          polarization: data.polarization || '',
          horizontal_pattern: data.horizontal_pattern || '',
          beam_width_3db: data.beam_width_3db || '',
          max_gain_azimuth: data.max_gain_azimuth || '',
          horizontal_pattern_table: data.horizontal_pattern_table || '',
          has_mechanical_tilt: data.has_mechanical_tilt || false,
          mechanical_tilt_degree: data.mechanical_tilt_degree || '',
          has_electrical_tilt: data.has_electrical_tilt || false,
          electrical_tilt_degree: data.electrical_tilt_degree || '',
          has_null_fill: data.has_null_fill || false,
          null_fill_percentage: data.null_fill_percentage || '',
          vertical_pattern_table: data.vertical_pattern_table || '',
          antenna_gain: data.antenna_gain || '',
          estimated_antenna_losses: data.estimated_antenna_losses || '',
          estimated_feeder_losses: data.estimated_feeder_losses || '',
          estimated_multiplexer_losses: data.estimated_multiplexer_losses || '',
          effective_radiated_power: data.effective_radiated_power || '',
          antenna_catalog_attached: data.antenna_catalog_attached || false,
          
          // Studio Link fields
          studio_manufacturer: data.studio_manufacturer || '',
          studio_model_number: data.studio_model_number || '',
          studio_serial_number: data.studio_serial_number || '',
          studio_frequency: data.studio_frequency || '',
          studio_polarization: data.studio_polarization || '',
          signal_description: data.signal_description || '',
          
          // Final info fields
          technical_personnel: data.technical_personnel || '',
          other_observations: data.other_observations || '',
        };

        // Keep existing broadcaster if available
        if (existingInspection?.broadcaster) {
          inspectionData.broadcaster = existingInspection.broadcaster;
        }

        // Update inspection record - EXACT SAME AS STEP 1, 2 & 3
        let inspection;
        
        if (isEditing && inspectionId && inspectionId !== 'undefined') {
          console.log('📝 [Step4] Updating existing inspection:', inspectionId);
          console.log('📝 [Step4] Update data:', inspectionData);
          
          try {
            const response = await inspectionsAPI.update(inspectionId, inspectionData);
            inspection = response.data;
            console.log('✅ [Step4] Inspection updated successfully:', inspection);
          } catch (updateError) {
            console.error('❌ [Step4] Update failed:', updateError);
            console.error('❌ [Step4] Update error details:', updateError.response?.data);
            throw updateError;
          }
        } else {
          console.log('🆕 [Step4] Creating new inspection...');
          console.log('🆕 [Step4] Create data:', inspectionData);
          
          try {
            const response = await inspectionsAPI.create(inspectionData);
            inspection = response.data;
            console.log('✅ [Step4] New inspection created:', inspection);
          } catch (createError) {
            console.error('❌ [Step4] Creation failed:', createError);
            console.error('❌ [Step4] Creation error details:', createError.response?.data);
            throw createError;
          }
        }

        return inspection;
      } catch (error) {
        console.error('❌ [Step4] Save operation failed:', error);
        console.error('📄 [Step4] Error response:', error.response?.data);
        
        // Log specific error information
        if (error.response?.status === 400) {
          console.error('🚫 [Step4] Bad Request Details:', {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers
          });
        }
        
        throw error;
      }
    },
    onMutate: () => {
      setAutoSaveStatus('saving');
      console.log('🔄 [Step4] Auto-save started...');
    },
    onSuccess: (inspection) => {
      setAutoSaveStatus('saved');
      setLastSaved(new Date().toISOString());
      console.log('✅ [Step4] Auto-save successful:', inspection);
    },
    onError: (error) => {
      setAutoSaveStatus('error');
      console.error('❌ [Step4] Auto-save failed:', error);
      
      // Show user-friendly error messages - EXACT SAME AS STEP 1, 2 & 3
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

  // Complete inspection mutation - SEPARATE FOR FINAL COMPLETION
  const completeMutation = useMutation({
    mutationFn: async (data) => {
      console.log('🔍 [Step4] Completing inspection with data:', data);
      
      try {
        // Mark inspection as completed
        const inspectionData = {
          status: 'completed',
          completed_at: new Date().toISOString(),
          // Include all the antenna and final data
          height_on_tower: data.height_on_tower || '',
          antenna_type: data.antenna_type || '',
          manufacturer: data.manufacturer || '',
          model_number: data.model_number || '',
          polarization: data.polarization || '',
          horizontal_pattern: data.horizontal_pattern || '',
          beam_width_3db: data.beam_width_3db || '',
          max_gain_azimuth: data.max_gain_azimuth || '',
          horizontal_pattern_table: data.horizontal_pattern_table || '',
          has_mechanical_tilt: data.has_mechanical_tilt || false,
          mechanical_tilt_degree: data.mechanical_tilt_degree || '',
          has_electrical_tilt: data.has_electrical_tilt || false,
          electrical_tilt_degree: data.electrical_tilt_degree || '',
          has_null_fill: data.has_null_fill || false,
          null_fill_percentage: data.null_fill_percentage || '',
          vertical_pattern_table: data.vertical_pattern_table || '',
          antenna_gain: data.antenna_gain || '',
          estimated_antenna_losses: data.estimated_antenna_losses || '',
          estimated_feeder_losses: data.estimated_feeder_losses || '',
          estimated_multiplexer_losses: data.estimated_multiplexer_losses || '',
          effective_radiated_power: data.effective_radiated_power || '',
          antenna_catalog_attached: data.antenna_catalog_attached || false,
          studio_manufacturer: data.studio_manufacturer || '',
          studio_model_number: data.studio_model_number || '',
          studio_serial_number: data.studio_serial_number || '',
          studio_frequency: data.studio_frequency || '',
          studio_polarization: data.studio_polarization || '',
          signal_description: data.signal_description || '',
          technical_personnel: data.technical_personnel || '',
          other_observations: data.other_observations || '',
        };

        // Keep existing broadcaster
        if (existingInspection?.broadcaster) {
          inspectionData.broadcaster = existingInspection.broadcaster;
        }

        const response = await inspectionsAPI.update(inspectionId, inspectionData);
        console.log('✅ [Step4] Inspection completed successfully:', response.data);
        return response.data;
      } catch (error) {
        console.error('❌ [Step4] Completion failed:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast.success('Inspection completed successfully!');
    },
    onError: (error) => {
      console.error('❌ [Step4] Completion failed:', error);
      toast.error('Failed to complete inspection');
    },
  });

  // Auto-save effect - EXACT SAME AS STEP 1, 2 & 3
  useEffect(() => {
    if (isDirty && Object.keys(watchedValues).length > 0) {
      const timeoutId = setTimeout(() => {
        console.log('[Step4] Auto-save triggered');
        autoSaveMutation.mutate(watchedValues);
        setFormData(watchedValues);
      }, 10000); // 10 seconds

      return () => clearTimeout(timeoutId);
    }
  }, [watchedValues, isDirty, autoSaveMutation, setFormData]);

  // Set current step
  useEffect(() => {
    setCurrentStep(4);
  }, [setCurrentStep]);

  // Load existing data - EXACT SAME AS STEP 1, 2 & 3
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

  // Manual save - EXACT SAME AS STEP 1, 2 & 3
  const onSave = async (data) => {
    try {
      console.log('[Step4] Manual save triggered');
      await trigger(); // Validate form
      
      const response = await autoSaveMutation.mutateAsync(data);
      setFormData(data);
      toast.success('Antenna information saved successfully');
      
      return response;
    } catch (error) {
      console.error('[Step4] Manual save error:', error);
      toast.error('Failed to save antenna information');
    }
  };

  // Complete inspection
  const onComplete = async (data) => {
    try {
      const isValid = await trigger();
      if (!isValid) {
        setValidationErrors(errors);
        toast.error('Please fix the validation errors before completing');
        return;
      }

      setValidationErrors({});
      await completeMutation.mutateAsync(data);
      setFormData(data);
      
      // Navigate to preview or dashboard
      navigate(`/inspection/${inspectionId}/preview`);
    } catch (error) {
      toast.error('Please save your progress before completing');
    }
  };

  // Navigate to previous step
  const onPrevious = () => {
    setFormData({ ...formData, ...watchedValues });
    navigate(`/inspection/${inspectionId}/step-3`);
  };

  // Loading state
  if (inspectionLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="xl" />
      </div>
    );
  }

  // Redirect if no inspection ID
  if (!inspectionId) {
    toast.error('No inspection found. Please start from Step 1.');
    navigate('/inspection/new/step-1');
    return null;
  }

  const progress = 100; // Step 4 = 100%

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Final Step</h1>
              <p className="text-sm text-gray-600 mt-1">Step 4: Antenna System & Other Information</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <ProgressBar progress={progress} className="w-32 h-2" />
            </div>
          </div>
          <StepIndicator steps={STEPS} currentStep={4} className="justify-center sm:justify-start" />
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

      <form onSubmit={handleSubmit(onComplete)} className="space-y-6">
        {/* Antenna System */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">ANTENNA SYSTEM</h2>
          </div>
          <div className="card-body">
            <div className="mobile-form">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Height the Antenna on the Tower/Mast (m)</label>
                  <input
                    {...register('height_on_tower')}
                    className="form-input"
                    placeholder="Height in meters"
                  />
                </div>

                <div>
                  <label className="form-label">Type of Antenna</label>
                  <input
                    {...register('antenna_type')}
                    className="form-input"
                    placeholder="Antenna type"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Antenna Manufacturer</label>
                  <input
                    {...register('manufacturer')}
                    className="form-input"
                    placeholder="Manufacturer"
                  />
                </div>

                <div>
                  <label className="form-label">Antenna Model Number</label>
                  <input
                    {...register('model_number')}
                    className="form-input"
                    placeholder="Model number"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-md font-medium text-gray-900 mb-4">Polarization & Pattern</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Polarization</label>
                    <select {...register('polarization')} className="form-input">
                      <option value="">Select polarization</option>
                      <option value="vertical">Vertical</option>
                      <option value="horizontal">Horizontal</option>
                      <option value="circular">Circular</option>
                      <option value="elliptical">Elliptical</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Horizontal Pattern</label>
                    <select {...register('horizontal_pattern')} className="form-input">
                      <option value="">Select pattern</option>
                      <option value="omni_directional">Omni directional</option>
                      <option value="directional">Directional</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Beam width measured at - 3 dB Level</label>
                    <input
                      {...register('beam_width_3db')}
                      className="form-input"
                      placeholder="Beam width"
                    />
                  </div>

                  <div>
                    <label className="form-label">Degrees azimuth for the max gain related to N</label>
                    <input
                      {...register('max_gain_azimuth')}
                      className="form-input"
                      placeholder="Azimuth degrees"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Table of azimuth (DbK) value of the Horizontal Pattern (Attach)</label>
                  <textarea
                    {...register('horizontal_pattern_table')}
                    className="form-input"
                    rows="3"
                    placeholder="Describe horizontal pattern table or reference attachment"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-md font-medium text-gray-900 mb-4">Vertical Pattern</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <input
                        {...register('has_mechanical_tilt')}
                        type="checkbox"
                        className="h-4 w-4 text-ca-blue focus:ring-ca-blue border-gray-300 rounded"
                      />
                      <label className="text-sm font-medium text-gray-700">
                        Mechanical tilt?
                      </label>
                    </div>
                    {watchHasMechanicalTilt && (
                      <div>
                        <label className="form-label">Degree of Tilt</label>
                        <input
                          {...register('mechanical_tilt_degree')}
                          className="form-input"
                          placeholder="Degrees"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <input
                        {...register('has_electrical_tilt')}
                        type="checkbox"
                        className="h-4 w-4 text-ca-blue focus:ring-ca-blue border-gray-300 rounded"
                      />
                      <label className="text-sm font-medium text-gray-700">
                        Electrical tilt?
                      </label>
                    </div>
                    {watchHasElectricalTilt && (
                      <div>
                        <label className="form-label">Degree of Tilt</label>
                        <input
                          {...register('electrical_tilt_degree')}
                          className="form-input"
                          placeholder="Degrees"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <input
                        {...register('has_null_fill')}
                        type="checkbox"
                        className="h-4 w-4 text-ca-blue focus:ring-ca-blue border-gray-300 rounded"
                      />
                      <label className="text-sm font-medium text-gray-700">
                        Null fill?
                      </label>
                    </div>
                    {watchHasNullFill && (
                      <div>
                        <label className="form-label">% of filling</label>
                        <input
                          {...register('null_fill_percentage')}
                          className="form-input"
                          placeholder="Percentage"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="form-label">Table of azimuth (DbK) value of the Vertical Pattern (Attach)</label>
                  <textarea
                    {...register('vertical_pattern_table')}
                    className="form-input"
                    rows="3"
                    placeholder="Describe vertical pattern table or reference attachment"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-md font-medium text-gray-900 mb-4">System Performance</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Gain of the Antenna System</label>
                    <input
                      {...register('antenna_gain')}
                      className="form-input"
                      placeholder="Antenna gain"
                    />
                  </div>

                  <div>
                    <label className="form-label">Estimated antenna losses (splitter, harnesses, null fill losses, etc) (dB)</label>
                    <input
                      {...register('estimated_antenna_losses')}
                      className="form-input"
                      placeholder="Antenna losses"
                    />
                  </div>

                  <div>
                    <label className="form-label">Estimated losses in the feeder (dB)</label>
                    <input
                      {...register('estimated_feeder_losses')}
                      className="form-input"
                      placeholder="Feeder losses"
                    />
                  </div>

                  <div>
                    <label className="form-label">Estimated losses in multiplexer (dB)</label>
                    <input
                      {...register('estimated_multiplexer_losses')}
                      className="form-input"
                      placeholder="Multiplexer losses"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Effective Radiated Power (kW)</label>
                  <input
                    {...register('effective_radiated_power')}
                    className="form-input"
                    placeholder="Effective radiated power"
                  />
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    {...register('antenna_catalog_attached')}
                    type="checkbox"
                    className="h-4 w-4 text-ca-blue focus:ring-ca-blue border-gray-300 rounded"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Antenna Catalog (attach)
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Studio to Transmitter Link */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">STUDIO TO TRANSMITTER LINK</h2>
          </div>
          <div className="card-body">
            <div className="mobile-form">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Manufacturer</label>
                  <input
                    {...register('studio_manufacturer')}
                    className="form-input"
                    placeholder="Studio link manufacturer"
                  />
                </div>

                <div>
                  <label className="form-label">Model Number</label>
                  <input
                    {...register('studio_model_number')}
                    className="form-input"
                    placeholder="Model number"
                  />
                </div>

                <div>
                  <label className="form-label">Serial Number</label>
                  <input
                    {...register('studio_serial_number')}
                    className="form-input"
                    placeholder="Serial number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Frequency (MHz)</label>
                  <input
                    {...register('studio_frequency')}
                    className="form-input"
                    placeholder="Frequency"
                  />
                </div>

                <div>
                  <label className="form-label">Polarization</label>
                  <input
                    {...register('studio_polarization')}
                    className="form-input"
                    placeholder="Polarization"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Description of Signal Reception and or Re-transmission</label>
                <textarea
                  {...register('signal_description')}
                  className="form-input"
                  rows="4"
                  placeholder="Describe signal reception and re-transmission details"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Other Information */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">OTHER INFORMATION</h2>
          </div>
          <div className="card-body">
            <div className="mobile-form">
              <div>
                <label className="form-label">Name of Technical Personnel responsible for Maintenance</label>
                <input
                  {...register('technical_personnel')}
                  className="form-input"
                  placeholder="Technical personnel name"
                />
              </div>

              <div>
                <label className="form-label">Any Other Observations</label>
                <textarea
                  {...register('other_observations')}
                  className="form-input"
                  rows="6"
                  placeholder="Additional observations, notes, or comments about this inspection"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          <button
            type="button"
            onClick={onPrevious}
            className="btn btn-outline"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous: Transmitter
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
              disabled={completeMutation.isPending}
              className="btn btn-success"
            >
              {completeMutation.isPending ? (
                <LoadingSpinner size="sm" className="mr-2" />
              ) : (
                <FileText className="w-4 h-4 mr-2" />
              )}
              Complete Inspection
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Step4;