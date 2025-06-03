// src/pages/inspection/Step3.js
import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChevronRight, ChevronLeft, Save, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

import { useFormStore } from '../../store';
import { inspectionsAPI } from '../../services/api';
import StepIndicator from '../../components/StepIndicator';
import ProgressBar from '../../components/ProgressBar';
import LoadingSpinner from '../../components/LoadingSpinner';

const schema = yup.object({
  // Exciter
  exciter_manufacturer: yup.string(),
  exciter_model_number: yup.string(),
  exciter_serial_number: yup.string(),
  exciter_nominal_power: yup.string(),
  exciter_actual_reading: yup.string(),
  
  // Amplifier
  amplifier_manufacturer: yup.string(),
  amplifier_model_number: yup.string(),
  amplifier_serial_number: yup.string(),
  amplifier_nominal_power: yup.string(),
  amplifier_actual_reading: yup.string(),
  rf_output_connector_type: yup.string(),
  frequency_range: yup.string(),
  transmit_frequency: yup.string(),
  frequency_stability: yup.string(),
  harmonics_suppression_level: yup.string(),
  spurious_emission_level: yup.string(),
  has_internal_audio_limiter: yup.boolean(),
  has_internal_stereo_coder: yup.boolean(),
  transmitter_catalog_attached: yup.boolean(),
  transmit_bandwidth: yup.string(),
  
  // Filter
  filter_type: yup.string(),
  filter_manufacturer: yup.string(),
  filter_model_number: yup.string(),
  filter_serial_number: yup.string(),
  filter_frequency: yup.string(),
});

const STEPS = [
  { id: 1, title: 'Admin & General' },
  { id: 2, title: 'Tower Info' },
  { id: 3, title: 'Transmitter' },
  { id: 4, title: 'Antenna & Final' },
];

const Step3 = () => {
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
  const watchFilterType = watch('filter_type');

  // Auto-save mutation - EXACT SAME PATTERN AS STEP 1 & 2
  const autoSaveMutation = useMutation({
    mutationFn: async (data) => {
      console.log('🔍 [Step3] Starting save with data:', data);
      
      try {
        // Prepare inspection data with transmitter fields - JUST LIKE STEP 1 & 2
        const inspectionData = {
          status: 'draft',
          inspection_date: new Date().toISOString().split('T')[0],
          // Add transmitter fields directly to inspection record
          exciter_manufacturer: data.exciter_manufacturer || '',
          exciter_model_number: data.exciter_model_number || '',
          exciter_serial_number: data.exciter_serial_number || '',
          exciter_nominal_power: data.exciter_nominal_power || '',
          exciter_actual_reading: data.exciter_actual_reading || '',
          
          amplifier_manufacturer: data.amplifier_manufacturer || '',
          amplifier_model_number: data.amplifier_model_number || '',
          amplifier_serial_number: data.amplifier_serial_number || '',
          amplifier_nominal_power: data.amplifier_nominal_power || '',
          amplifier_actual_reading: data.amplifier_actual_reading || '',
          rf_output_connector_type: data.rf_output_connector_type || '',
          frequency_range: data.frequency_range || '',
          transmit_frequency: data.transmit_frequency || '',
          frequency_stability: data.frequency_stability || '',
          harmonics_suppression_level: data.harmonics_suppression_level || '',
          spurious_emission_level: data.spurious_emission_level || '',
          has_internal_audio_limiter: data.has_internal_audio_limiter || false,
          has_internal_stereo_coder: data.has_internal_stereo_coder || false,
          transmitter_catalog_attached: data.transmitter_catalog_attached || false,
          transmit_bandwidth: data.transmit_bandwidth || '',
          
          filter_type: data.filter_type || '',
          filter_manufacturer: data.filter_manufacturer || '',
          filter_model_number: data.filter_model_number || '',
          filter_serial_number: data.filter_serial_number || '',
          filter_frequency: data.filter_frequency || '',
        };

        // Keep existing broadcaster if available
        if (existingInspection?.broadcaster) {
          inspectionData.broadcaster = existingInspection.broadcaster;
        }

        // Update inspection record - EXACT SAME AS STEP 1 & 2
        let inspection;
        
        if (isEditing && inspectionId && inspectionId !== 'undefined') {
          console.log('📝 [Step3] Updating existing inspection:', inspectionId);
          console.log('📝 [Step3] Update data:', inspectionData);
          
          try {
            const response = await inspectionsAPI.update(inspectionId, inspectionData);
            inspection = response.data;
            console.log('✅ [Step3] Inspection updated successfully:', inspection);
          } catch (updateError) {
            console.error('❌ [Step3] Update failed:', updateError);
            console.error('❌ [Step3] Update error details:', updateError.response?.data);
            throw updateError;
          }
        } else {
          console.log('🆕 [Step3] Creating new inspection...');
          console.log('🆕 [Step3] Create data:', inspectionData);
          
          try {
            const response = await inspectionsAPI.create(inspectionData);
            inspection = response.data;
            console.log('✅ [Step3] New inspection created:', inspection);
          } catch (createError) {
            console.error('❌ [Step3] Creation failed:', createError);
            console.error('❌ [Step3] Creation error details:', createError.response?.data);
            throw createError;
          }
        }

        return inspection;
      } catch (error) {
        console.error('❌ [Step3] Save operation failed:', error);
        console.error('📄 [Step3] Error response:', error.response?.data);
        
        // Log specific error information
        if (error.response?.status === 400) {
          console.error('🚫 [Step3] Bad Request Details:', {
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
      console.log('🔄 [Step3] Auto-save started...');
    },
    onSuccess: (inspection) => {
      setAutoSaveStatus('saved');
      setLastSaved(new Date().toISOString());
      console.log('✅ [Step3] Auto-save successful:', inspection);
    },
    onError: (error) => {
      setAutoSaveStatus('error');
      console.error('❌ [Step3] Auto-save failed:', error);
      
      // Show user-friendly error messages - EXACT SAME AS STEP 1 & 2
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

  // Auto-save effect - EXACT SAME AS STEP 1 & 2
  useEffect(() => {
    if (isDirty && Object.keys(watchedValues).length > 0) {
      const timeoutId = setTimeout(() => {
        console.log('[Step3] Auto-save triggered');
        autoSaveMutation.mutate(watchedValues);
        setFormData(watchedValues);
      }, 10000); // 10 seconds

      return () => clearTimeout(timeoutId);
    }
  }, [watchedValues, isDirty, autoSaveMutation, setFormData]);

  // Set current step
  useEffect(() => {
    setCurrentStep(3);
  }, [setCurrentStep]);

  // Load existing data - EXACT SAME AS STEP 1 & 2
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

  // Manual save - EXACT SAME AS STEP 1 & 2
  const onSave = async (data) => {
    try {
      console.log('[Step3] Manual save triggered');
      await trigger(); // Validate form
      
      const response = await autoSaveMutation.mutateAsync(data);
      setFormData(data);
      toast.success('Transmitter information saved successfully');
      
      return response;
    } catch (error) {
      console.error('[Step3] Manual save error:', error);
      toast.error('Failed to save transmitter information');
    }
  };

  // Navigate to next step - EXACT SAME AS STEP 1 & 2
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
      
      navigate(`/inspection/${inspectionId}/step-4`);
    } catch (error) {
      toast.error('Please save your progress before continuing');
    }
  };

  // Navigate to previous step
  const onPrevious = () => {
    setFormData({ ...formData, ...watchedValues });
    navigate(`/inspection/${inspectionId}/step-2`);
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

  const progress = 75; // Step 3 = 75%

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Transmitter Information</h1>
              <p className="text-sm text-gray-600 mt-1">Step 3: Exciter, Amplifier & Filter details</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <ProgressBar progress={progress} className="w-32 h-2" />
            </div>
          </div>
          <StepIndicator steps={STEPS} currentStep={3} className="justify-center sm:justify-start" />
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

      <form onSubmit={handleSubmit(onNext)} className="space-y-6">
        {/* Exciter */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">A. EXCITER</h2>
          </div>
          <div className="card-body">
            <div className="mobile-form">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Manufacturer</label>
                  <input
                    {...register('exciter_manufacturer')}
                    className="form-input"
                    placeholder="Exciter manufacturer"
                  />
                </div>

                <div>
                  <label className="form-label">Model Number</label>
                  <input
                    {...register('exciter_model_number')}
                    className="form-input"
                    placeholder="Model number"
                  />
                </div>

                <div>
                  <label className="form-label">Serial Number</label>
                  <input
                    {...register('exciter_serial_number')}
                    className="form-input"
                    placeholder="Serial number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Nominal Power (W)</label>
                  <input
                    {...register('exciter_nominal_power')}
                    className="form-input"
                    placeholder="Nominal power"
                  />
                </div>

                <div>
                  <label className="form-label">Actual Reading</label>
                  <input
                    {...register('exciter_actual_reading')}
                    className="form-input"
                    placeholder="Actual reading"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Amplifier */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">B. AMPLIFIER</h2>
          </div>
          <div className="card-body">
            <div className="mobile-form">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Manufacturer</label>
                  <input
                    {...register('amplifier_manufacturer')}
                    className="form-input"
                    placeholder="Amplifier manufacturer"
                  />
                </div>

                <div>
                  <label className="form-label">Model Number</label>
                  <input
                    {...register('amplifier_model_number')}
                    className="form-input"
                    placeholder="Model number"
                  />
                </div>

                <div>
                  <label className="form-label">Serial Number</label>
                  <input
                    {...register('amplifier_serial_number')}
                    className="form-input"
                    placeholder="Serial number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Nominal Power (W)</label>
                  <input
                    {...register('amplifier_nominal_power')}
                    className="form-input"
                    placeholder="Nominal power"
                  />
                </div>

                <div>
                  <label className="form-label">Actual Reading</label>
                  <input
                    {...register('amplifier_actual_reading')}
                    className="form-input"
                    placeholder="Actual reading"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">RF output connector type</label>
                <input
                  {...register('rf_output_connector_type')}
                  className="form-input"
                  placeholder="RF output connector type"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Frequency Range</label>
                  <input
                    {...register('frequency_range')}
                    className="form-input"
                    placeholder="Frequency range"
                  />
                </div>

                <div>
                  <label className="form-label">Transmit Frequency (MHz or TV Channel Number)</label>
                  <input
                    {...register('transmit_frequency')}
                    className="form-input"
                    placeholder="Transmit frequency"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Frequency Stability (ppm)</label>
                  <input
                    {...register('frequency_stability')}
                    className="form-input"
                    placeholder="Frequency stability"
                  />
                </div>

                <div>
                  <label className="form-label">Harmonics Suppression Level (dB)</label>
                  <input
                    {...register('harmonics_suppression_level')}
                    className="form-input"
                    placeholder="Harmonics suppression level"
                  />
                </div>

                <div>
                  <label className="form-label">Spurious Emission Level (dB)</label>
                  <input
                    {...register('spurious_emission_level')}
                    className="form-input"
                    placeholder="Spurious emission level"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <input
                      {...register('has_internal_audio_limiter')}
                      type="checkbox"
                      className="h-4 w-4 text-ca-blue focus:ring-ca-blue border-gray-300 rounded"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Internal Audio Limiter
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      {...register('has_internal_stereo_coder')}
                      type="checkbox"
                      className="h-4 w-4 text-ca-blue focus:ring-ca-blue border-gray-300 rounded"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Internal Stereo Coder
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <input
                      {...register('transmitter_catalog_attached')}
                      type="checkbox"
                      className="h-4 w-4 text-ca-blue focus:ring-ca-blue border-gray-300 rounded"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Transmitter Catalog (attach)
                    </label>
                  </div>
                </div>

                <div className="mt-4">
                  <div>
                    <label className="form-label">Transmit Bandwidth (-26dB)</label>
                    <input
                      {...register('transmit_bandwidth')}
                      className="form-input"
                      placeholder="Transmit bandwidth"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">FILTER</h2>
          </div>
          <div className="card-body">
            <div className="mobile-form">
              <div>
  <label className="form-label">Type (Select Filter Type)</label>
  <select
    {...register('filter_type')}
    className="form-input"
  >
    <option value="">Select filter type</option>
    <option value="standard_band_pass">Standard Band Pass Filter</option>
    <option value="notch">Notch Filter</option>
    <option value="high_q_triple_cavity">High-Q Triple Cavity Filter</option>
  </select>
</div>


              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Manufacturer</label>
                  <input
                    {...register('filter_manufacturer')}
                    className="form-input"
                    placeholder="Filter manufacturer"
                  />
                </div>

                <div>
                  <label className="form-label">Model Number</label>
                  <input
                    {...register('filter_model_number')}
                    className="form-input"
                    placeholder="Model number"
                  />
                </div>

                <div>
                  <label className="form-label">Serial Number</label>
                  <input
                    {...register('filter_serial_number')}
                    className="form-input"
                    placeholder="Serial number"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Frequency (MHz) or TV Channel Number</label>
                <input
                  {...register('filter_frequency')}
                  className="form-input"
                  placeholder="Filter frequency"
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
            Previous: Tower Info
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
              Continue to Final Step
              <ChevronRight className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Step3;