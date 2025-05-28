// src/pages/BroadcasterList.js - Enhanced with Add Broadcaster functionality
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
  Building2,
  Phone,
  Mail,
  MapPin,
  X,
  Save,
  ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

import { broadcastersAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Card from '../components/Card';

// Validation schema for broadcaster form
const broadcasterSchema = yup.object({
  name: yup.string().required('Broadcaster name is required'),
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
});

const BroadcasterList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBroadcaster, setEditingBroadcaster] = useState(null);

  // Get return URL and new broadcaster name from navigation state
  const returnTo = location.state?.returnTo;
  const newBroadcasterName = location.state?.newBroadcasterName;

  const { data: broadcasters = [], isLoading, error } = useQuery({
    queryKey: ['broadcasters'],
    queryFn: () => broadcastersAPI.getAll().then(res => {
      // Handle different response formats
      if (Array.isArray(res.data)) return res.data;
      if (res.data.results && Array.isArray(res.data.results)) return res.data.results;
      if (res.data.data && Array.isArray(res.data.data)) return res.data.data;
      return [];
    }),
  });

  // Add broadcaster mutation
  const addMutation = useMutation({
    mutationFn: broadcastersAPI.create,
    onSuccess: (response) => {
      queryClient.invalidateQueries(['broadcasters']);
      toast.success('Broadcaster added successfully');
      setShowAddForm(false);
      reset();
      
      // If we came from inspection form, go back with the new broadcaster
      if (returnTo) {
        // Restore draft data if available
        const draftData = localStorage.getItem('inspectionDraft');
        if (draftData) {
          localStorage.removeItem('inspectionDraft');
        }
        
        toast.success(`Broadcaster "${response.data.name}" created! Returning to form...`);
        setTimeout(() => {
          navigate(returnTo, { 
            state: { 
              newBroadcaster: response.data.name,
              restoreDraft: draftData ? JSON.parse(draftData) : null
            }
          });
        }, 1500);
      }
    },
    onError: (error) => {
      console.error('Add broadcaster error:', error);
      toast.error('Failed to add broadcaster');
    },
  });

  // Update broadcaster mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => broadcastersAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['broadcasters']);
      toast.success('Broadcaster updated successfully');
      setEditingBroadcaster(null);
      reset();
    },
    onError: () => {
      toast.error('Failed to update broadcaster');
    },
  });

  // Delete broadcaster mutation
  const deleteMutation = useMutation({
    mutationFn: broadcastersAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['broadcasters']);
      toast.success('Broadcaster deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete broadcaster');
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
    resolver: yupResolver(broadcasterSchema),
    defaultValues: {
      name: '',
      po_box: '',
      postal_code: '',
      town: '',
      location: '',
      street: '',
      phone_numbers: '',
      contact_name: '',
      contact_address: '',
      contact_phone: '',
      contact_email: '',
    }
  });

  // Auto-populate form if we have a suggested broadcaster name
  useEffect(() => {
    if (newBroadcasterName && !showAddForm) {
      setShowAddForm(true);
      setValue('name', newBroadcasterName);
    }
  }, [newBroadcasterName, setValue, showAddForm]);

  // Filter broadcasters
  const filteredBroadcasters = broadcasters.filter(broadcaster =>
    broadcaster.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    broadcaster.town?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    broadcaster.contact_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (broadcaster) => {
    setEditingBroadcaster(broadcaster);
    setShowAddForm(true);
    
    // Populate form with existing data
    Object.keys(broadcaster).forEach(key => {
      setValue(key, broadcaster[key] || '');
    });
  };

  const onSubmit = (data) => {
    if (editingBroadcaster) {
      updateMutation.mutate({ id: editingBroadcaster.id, data });
    } else {
      addMutation.mutate(data);
    }
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingBroadcaster(null);
    reset();
  };

  const handleBackToInspection = () => {
    if (returnTo) {
      // Restore draft data if available
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

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load broadcasters</p>
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
              <h1 className="text-2xl font-bold text-gray-900">Broadcasters</h1>
              <p className="text-sm text-gray-600 mt-1">
                {returnTo 
                  ? 'Add a new broadcaster to continue with your inspection'
                  : 'Manage broadcaster information and contacts'
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
            Add Broadcaster
          </button>
        )}
      </div>

      {/* Add/Edit Broadcaster Form */}
      {showAddForm && (
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingBroadcaster ? 'Edit Broadcaster' : 'Add New Broadcaster'}
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
                <h3 className="text-md font-medium text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="form-label">Broadcaster Name *</label>
                    <input
                      {...register('name')}
                      className={`form-input ${errors.name ? 'form-input-error' : ''}`}
                      placeholder="Enter broadcaster name"
                    />
                    {errors.name && <p className="form-error">{errors.name.message}</p>}
                  </div>
                  
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
                  
                  <div>
                    <label className="form-label">Town/City</label>
                    <input
                      {...register('town')}
                      className="form-input"
                      placeholder="Town or city"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Location</label>
                    <input
                      {...register('location')}
                      className="form-input"
                      placeholder="General location"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="form-label">Street Address</label>
                    <input
                      {...register('street')}
                      className="form-input"
                      placeholder="Street address"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="form-label">Phone Numbers</label>
                    <textarea
                      {...register('phone_numbers')}
                      className="form-input"
                      rows="2"
                      placeholder="Phone numbers (separate multiple with commas)"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-md font-medium text-gray-900 mb-4">Contact Person</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="form-label">Contact Name</label>
                    <input
                      {...register('contact_name')}
                      className="form-input"
                      placeholder="Contact person name"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label">Contact Phone</label>
                    <input
                      {...register('contact_phone')}
                      className="form-input"
                      placeholder="Contact phone number"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="form-label">Contact Email</label>
                    <input
                      {...register('contact_email')}
                      type="email"
                      className={`form-input ${errors.contact_email ? 'form-input-error' : ''}`}
                      placeholder="Contact email address"
                    />
                    {errors.contact_email && <p className="form-error">{errors.contact_email.message}</p>}
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="form-label">Contact Address</label>
                    <textarea
                      {...register('contact_address')}
                      className="form-input"
                      rows="3"
                      placeholder="Contact person address"
                    />
                  </div>
                </div>
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
                  {editingBroadcaster ? 'Update' : 'Add'} Broadcaster
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
                placeholder="Search broadcasters..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Broadcasters Grid */}
      {!showAddForm && (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredBroadcasters.length === 0 ? (
            <Card>
              <Card.Body>
                <div className="text-center py-12">
                  <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    {searchTerm ? 'No broadcasters found' : 'No broadcasters yet'}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm 
                      ? 'Try adjusting your search term'
                      : 'Get started by adding your first broadcaster.'
                    }
                  </p>
                  {!searchTerm && (
                    <div className="mt-6">
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="btn btn-primary"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Broadcaster
                      </button>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBroadcasters.map((broadcaster) => (
                <Card key={broadcaster.id} hover>
                  <Card.Body>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 truncate">
                          {broadcaster.name}
                        </h3>
                        {broadcaster.town && (
                          <div className="flex items-center mt-1 text-sm text-gray-500">
                            <MapPin className="w-4 h-4 mr-1" />
                            {broadcaster.town}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(broadcaster)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Edit broadcaster"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(broadcaster.id, broadcaster.name)}
                          className="text-gray-400 hover:text-red-600"
                          disabled={deleteMutation.isPending}
                          title="Delete broadcaster"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {broadcaster.contact_name && (
                        <div className="text-sm">
                          <span className="font-medium">Contact:</span> {broadcaster.contact_name}
                        </div>
                      )}
                      
                      {broadcaster.contact_phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2" />
                          {broadcaster.contact_phone}
                        </div>
                      )}
                      
                      {broadcaster.contact_email && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-4 h-4 mr-2" />
                          {broadcaster.contact_email}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        Added {new Date(broadcaster.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}

          {/* Summary */}
          {filteredBroadcasters.length > 0 && (
            <div className="text-sm text-gray-500 text-center">
              Showing {filteredBroadcasters.length} of {broadcasters.length} broadcasters
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BroadcasterList;