// src/pages/ProgramList.js - Program Management Page
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Radio,
  Users,
  X,
  Save,
  ArrowLeft,
  Mic
} from 'lucide-react';
import toast from 'react-hot-toast';

import { programsAPI, broadcastersAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Card from '../components/Card';

// Validation schema for program form
const programSchema = yup.object({
  name: yup.string().required('Program name is required'),
  description: yup.string(),
  broadcasters: yup.array().of(yup.number()),
  });

  // Load broadcasters for association
  const { data: broadcasters = [] } = useQuery({
    queryKey: ['broadcasters'],
    queryFn: () => broadcastersAPI.getAll().then(res => {
      if (Array.isArray(res.data)) return res.data;
      if (res.data.results && Array.isArray(res.data.results)) return res.data.results;
      if (res.data.data && Array.isArray(res.data.data)) return res.data.data;
      return [];
    }),
  });

  // Add program mutation
  const addMutation = useMutation({
    mutationFn: async (data) => {
      const programResponse = await programsAPI.create({
        name: data.name,
        description: data.description,
      });
      
      // Associate with selected broadcasters
      if (selectedBroadcasters.length > 0) {
        for (const broadcasterId of selectedBroadcasters) {
          try {
            await programsAPI.addBroadcaster(programResponse.data.id, { broadcaster_id: broadcasterId });
          } catch (e) {
            console.warn('Could not associate broadcaster:', e);
          }
        }
      }
      
      return programResponse;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries(['programs']);
      toast.success('Program added successfully');
      setShowAddForm(false);
      setSelectedBroadcasters([]);
      reset();
      
      // If we came from inspection form, go back with the new program
      if (returnTo) {
        const draftData = localStorage.getItem('inspectionDraft');
        if (draftData) {
          localStorage.removeItem('inspectionDraft');
        }
        
        toast.success(`Program "${response.data.name}" created! Returning to form...`);
        setTimeout(() => {
          navigate(returnTo, { 
            state: { 
              newProgram: response.data.name,
              restoreDraft: draftData ? JSON.parse(draftData) : null
            }
          });
        }, 1500);
      }
    },
    onError: (error) => {
      console.error('Add program error:', error);
      toast.error('Failed to add program');
    },
  });

  // Update program mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await programsAPI.update(id, {
        name: data.name,
        description: data.description,
      });
      
      // Update broadcaster associations
      const currentProgram = programs.find(p => p.id === id);
      const currentBroadcasterIds = currentProgram?.broadcasters || [];
      
      // Remove broadcasters no longer selected
      for (const broadcasterId of currentBroadcasterIds) {
        if (!selectedBroadcasters.includes(broadcasterId)) {
          try {
            await programsAPI.removeBroadcaster(id, { broadcaster_id: broadcasterId });
          } catch (e) {
            console.warn('Could not remove broadcaster:', e);
          }
        }
      }
      
      // Add newly selected broadcasters
      for (const broadcasterId of selectedBroadcasters) {
        if (!currentBroadcasterIds.includes(broadcasterId)) {
          try {
            await programsAPI.addBroadcaster(id, { broadcaster_id: broadcasterId });
          } catch (e) {
            console.warn('Could not add broadcaster:', e);
          }
        }
      }
      
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['programs']);
      toast.success('Program updated successfully');
      setEditingProgram(null);
      setSelectedBroadcasters([]);
      reset();
    },
    onError: () => {
      toast.error('Failed to update program');
    },
  });

  // Delete program mutation
  const deleteMutation = useMutation({
    mutationFn: programsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['programs']);
      toast.success('Program deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete program');
    },
  });

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(programSchema),
    defaultValues: {
      name: '',
      description: '',
    }
  });

  // Auto-populate form if we have a suggested program name
  useEffect(() => {
    if (newProgramName && !showAddForm) {
      setShowAddForm(true);
      setValue('name', newProgramName);
    }
  }, [newProgramName, setValue, showAddForm]);

  // Filter programs
  const filteredPrograms = programs.filter(program =>
    program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.broadcaster_names?.some(name => 
      name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete program "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (program) => {
    setEditingProgram(program);
    setShowAddForm(true);
    
    // Populate form with existing data
    setValue('name', program.name || '');
    setValue('description', program.description || '');
    
    // Set selected broadcasters
    setSelectedBroadcasters(program.broadcasters || []);
  };

  const onSubmit = (data) => {
    if (editingProgram) {
      updateMutation.mutate({ id: editingProgram.id, data });
    } else {
      addMutation.mutate(data);
    }
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingProgram(null);
    setSelectedBroadcasters([]);
    reset();
  };

  const handleBackToInspection = () => {
    if (returnTo) {
      const draftData = localStorage.getItem('inspectionDraft');
      if (draftData) {
        localStorage.removeItem('inspectionDraft');
      }
      
      navigate(returnTo, { 
        state: { 
          restoreDraft: draftData ? JSON.parse(draftData) : null
        }
      });
    } else {
      navigate('/dashboard');
    }
  };

  const handleBroadcasterToggle = (broadcasterId) => {
    setSelectedBroadcasters(prev => 
      prev.includes(broadcasterId)
        ? prev.filter(id => id !== broadcasterId)
        : [...prev, broadcasterId]
    );
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load programs</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center space-x-3">
            {returnTo && (
              <button
                onClick={handleBackToInspection}
                className="btn btn-outline btn-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Form
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Program Names</h1>
              <p className="text-sm text-gray-600 mt-1">
                {returnTo 
                  ? 'Add a new program to continue with your inspection'
                  : 'Manage program names and their associated broadcasters'
                }
              </p>
            </div>
          </div>
        </div>
        
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary mt-4 sm:mt-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Program
          </button>
        )}
      </div>

      {/* Add/Edit Program Form */}
      {showAddForm && (
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingProgram ? 'Edit Program' : 'Add New Program'}
              </h2>
              <button
                onClick={handleCancelForm}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </Card.Header>
          <Card.Body>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4">Program Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="form-label">Program Name *</label>
                    <input
                      {...register('name')}
                      className={`form-input ${errors.name ? 'form-input-error' : ''}`}
                      placeholder="Enter program name"
                    />
                    {errors.name && <p className="form-error">{errors.name.message}</p>}
                  </div>
                  
                  <div>
                    <label className="form-label">Description</label>
                    <textarea
                      {...register('description')}
                      className="form-input"
                      rows="3"
                      placeholder="Brief description of the program (optional)"
                    />
                  </div>
                </div>
              </div>

              {/* Broadcaster Association */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-md font-medium text-gray-900 mb-4">
                  Associated Broadcasters
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Select which broadcasters operate this program. A program can be associated with multiple broadcasters.
                </p>
                
                {broadcasters.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                    {broadcasters.map((broadcaster) => (
                      <label
                        key={broadcaster.id}
                        className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedBroadcasters.includes(broadcaster.id)}
                          onChange={() => handleBroadcasterToggle(broadcaster.id)}
                          className="h-4 w-4 text-ca-blue focus:ring-ca-blue border-gray-300 rounded"
                        />
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {broadcaster.name}
                          </div>
                          {broadcaster.town && (
                            <div className="text-xs text-gray-500">
                              {broadcaster.town}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p>No broadcasters available</p>
                    <button
                      type="button"
                      onClick={() => navigate('/broadcasters')}
                      className="text-blue-600 hover:text-blue-800 text-sm mt-2"
                    >
                      Add broadcasters first
                    </button>
                  </div>
                )}
                
                {selectedBroadcasters.length > 0 && (
                  <div className="mt-3 text-sm text-gray-600">
                    Selected: {selectedBroadcasters.length} broadcaster(s)
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="btn btn-outline"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {editingProgram ? 'Update' : 'Add'} Program
                </button>
              </div>
            </form>
          </Card.Body>
        </Card>
      )}

      {/* Search */}
      {!showAddForm && (
        <Card>
          <Card.Body>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search programs..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Programs Grid */}
      {!showAddForm && (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredPrograms.length === 0 ? (
            <Card>
              <Card.Body>
                <div className="text-center py-12">
                  <Radio className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    {searchTerm ? 'No programs found' : 'No programs yet'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm 
                      ? 'Try adjusting your search term'
                      : 'Get started by adding your first program.'
                    }
                  </p>
                  {!searchTerm && (
                    <div className="mt-6">
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="btn btn-primary"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Program
                      </button>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrograms.map((program) => (
                <Card key={program.id} hover>
                  <Card.Body>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <Mic className="w-4 h-4 text-ca-blue mr-2" />
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {program.name}
                          </h3>
                        </div>
                        {program.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {program.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 ml-2">
                        <button
                          onClick={() => handleEdit(program)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Edit program"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(program.id, program.name)}
                          className="text-gray-400 hover:text-red-600"
                          disabled={deleteMutation.isPending}
                          title="Delete program"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {program.broadcaster_names && program.broadcaster_names.length > 0 ? (
                        <div>
                          <div className="flex items-center text-sm text-gray-600 mb-1">
                            <Users className="w-4 h-4 mr-1" />
                            Associated Broadcasters:
                          </div>
                          <div className="text-sm">
                            {program.broadcaster_names.map((name, index) => (
                              <span
                                key={index}
                                className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-1 mb-1"
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 italic">
                          No associated broadcasters
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        Added {new Date(program.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}

          {/* Summary */}
          {filteredPrograms.length > 0 && (
            <div className="text-sm text-gray-500 text-center">
              Showing {filteredPrograms.length} of {programs.length} programs
            </div>
          )}
        </>
      )}
    </div>
  );
;

export default ProgramList;