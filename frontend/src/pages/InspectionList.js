// src/pages/InspectionList.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Eye, 
  Calendar,
  ChevronDown,
  X,
  FileText,
  Download
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

import { inspectionsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Card from '../components/Card';

const InspectionList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data: inspections = [], isLoading, error } = useQuery({
    queryKey: ['inspections'],
    queryFn: () => inspectionsAPI.getAll().then(res => res.data.results || res.data),
  });

  // Filter inspections
  const filteredInspections = inspections.filter(inspection => {
    const matchesSearch = 
      inspection.form_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inspection.broadcaster_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || inspection.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle generate report click
  const handleGenerateReport = (inspection) => {
    // Navigate to reports page with the inspection pre-selected
    navigate('/reports', { 
      state: { 
        selectedInspection: inspection,
        autoStart: true 
      }
    });
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load inspections</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Inspections</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage and view all inspection forms
          </p>
        </div>
        <Link to="/inspection/new/step-1" className="btn btn-primary mt-4 sm:mt-0">
          <Plus className="w-4 h-4 mr-2" />
          New Inspection
        </Link>
      </div>

      {/* Search and Filters */}
      <Card>
        <Card.Body>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by form number or broadcaster..."
                className="form-input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-outline"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="form-input"
                  >
                    <option value="">All statuses</option>
                    <option value="draft">Draft</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                
                <div className="sm:col-span-2 flex items-end">
                  {(searchTerm || statusFilter) && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setStatusFilter('');
                      }}
                      className="btn btn-outline"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Results */}
      <Card>
        <Card.Body className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredInspections.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm || statusFilter ? 'No inspections found' : 'No inspections yet'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter 
                  ? 'Try adjusting your search criteria'
                  : 'Get started by creating your first inspection.'
                }
              </p>
              {!searchTerm && !statusFilter && (
                <div className="mt-6">
                  <Link to="/inspection/new/step-1" className="btn btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    New Inspection
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredInspections.map((inspection) => (
                <div key={inspection.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className={`flex-shrink-0 w-2 h-2 rounded-full ${
                          inspection.status === 'completed' ? 'bg-green-400' :
                          inspection.status === 'draft' ? 'bg-yellow-400' :
                          'bg-gray-400'
                        }`} />
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {inspection.form_number}
                        </p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}>
                          {inspection.status}
                        </span>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-gray-600 truncate">
                          {inspection.broadcaster_name}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-xs text-gray-500">
                            Inspection: {format(new Date(inspection.inspection_date), 'MMM d, yyyy')}
                          </p>
                          <p className="text-xs text-gray-500">
                            Updated: {formatDistanceToNow(new Date(inspection.updated_at))} ago
                          </p>
                          <p className="text-xs text-gray-500">
                            Inspector: {inspection.inspector_name}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      {/* Generate Report Button - Only for completed inspections */}
                      {inspection.status === 'completed' && (
                        <button
                          onClick={() => handleGenerateReport(inspection)}
                          className="text-purple-600 hover:text-purple-800 flex items-center space-x-1 text-sm font-medium px-3 py-1 rounded hover:bg-purple-50 transition-colors"
                          title="Generate Report"
                        >
                          <FileText className="w-4 h-4" />
                          <span className="hidden sm:inline">Report</span>
                        </button>
                      )}
                      
                      {/* View Button */}
                      <Link
                        to={`/inspection/${inspection.id}/preview`}
                        className="text-gray-400 hover:text-gray-600 p-2 rounded hover:bg-gray-100"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      
                      {/* Edit Button - Only for non-completed inspections */}
                      {inspection.status !== 'completed' && (
                        <Link
                          to={`/inspection/${inspection.id}/step-1`}
                          className="text-ca-blue hover:text-blue-700 p-2 rounded hover:bg-blue-50"
                          title="Edit Inspection"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Summary */}
      {filteredInspections.length > 0 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Showing {filteredInspections.length} of {inspections.length} inspections
          </div>
          
          {/* Bulk Actions for Completed Inspections */}
          {filteredInspections.filter(i => i.status === 'completed').length > 0 && (
            <div className="text-sm text-gray-500">
              <Link 
                to="/reports"
                className="text-purple-600 hover:text-purple-800 font-medium flex items-center space-x-1"
              >
                <Download className="w-4 h-4" />
                <span>Generate Reports</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InspectionList;