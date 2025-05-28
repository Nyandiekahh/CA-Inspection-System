// src/pages/Profile.js
import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { User, Save, Shield, Clock } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

import { useAuthStore } from '../store';
import { authAPI } from '../services/api';
import Card from '../components/Card';
import FormField from '../components/FormField';
import LoadingSpinner from '../components/LoadingSpinner';

const Profile = () => {
  const { user, setUser } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: {
      first_name: user?.first_name || '',
      last_name: user?.last_name || '',
      email: user?.email || '',
      phone_number: user?.phone_number || '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: authAPI.updateProfile,
    onSuccess: (response) => {
      setUser(response.data);
      toast.success('Profile updated successfully');
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const onSubmit = (data) => {
    updateMutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage your account information and preferences
        </p>
      </div>

      {/* Profile Info */}
      <Card>
        <Card.Header>
          <div className="flex items-center">
            <User className="w-5 h-5 mr-2 text-gray-600" />
            <h2 className="text-lg font-semibold">Personal Information</h2>
          </div>
        </Card.Header>
        <Card.Body>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="First Name" error={errors.first_name?.message}>
                <input
                  {...register('first_name', { required: 'First name is required' })}
                  className={`form-input ${errors.first_name ? 'form-input-error' : ''}`}
                  placeholder="First name"
                />
              </FormField>

              <FormField label="Last Name" error={errors.last_name?.message}>
                <input
                  {...register('last_name', { required: 'Last name is required' })}
                  className={`form-input ${errors.last_name ? 'form-input-error' : ''}`}
                  placeholder="Last name"
                />
              </FormField>
            </div>

            <FormField label="Email" error={errors.email?.message}>
              <input
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Invalid email format'
                  }
                })}
                type="email"
                className={`form-input ${errors.email ? 'form-input-error' : ''}`}
                placeholder="Email address"
              />
            </FormField>

            <FormField label="Phone Number">
              <input
                {...register('phone_number')}
                className="form-input"
                placeholder="Phone number"
              />
            </FormField>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!isDirty || updateMutation.isPending}
                className="btn btn-primary"
              >
                {updateMutation.isPending ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </button>
            </div>
          </form>
        </Card.Body>
      </Card>

      {/* Account Info */}
      <Card>
        <Card.Header>
          <div className="flex items-center">
            <Shield className="w-5 h-5 mr-2 text-gray-600" />
            <h2 className="text-lg font-semibold">Account Information</h2>
          </div>
        </Card.Header>
        <Card.Body>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Username</label>
                <div className="form-input bg-gray-50 text-gray-600">
                  {user?.username}
                </div>
              </div>

              <div>
                <label className="form-label">Employee ID</label>
                <div className="form-input bg-gray-50 text-gray-600">
                  {user?.employee_id}
                </div>
              </div>
            </div>

            <div>
              <label className="form-label">Department</label>
              <div className="form-input bg-gray-50 text-gray-600">
                {user?.department}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Account Created</label>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="w-4 h-4 mr-2" />
                  {user?.date_joined && format(new Date(user.date_joined), 'PPP')}
                </div>
              </div>

              <div>
                <label className="form-label">Role</label>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {user?.is_inspector ? 'Inspector' : 'User'}
                </span>
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Profile;