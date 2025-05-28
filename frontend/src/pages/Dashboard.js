import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Plus, 
  FileText, 
  Radio, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Calendar,
  Search
} from 'lucide-react';

import { useAuthStore } from '../store';
import { inspectionsAPI, broadcastersAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatDistanceToNow, format } from 'date-fns';

const Dashboard = () => {
  const { user } = useAuthStore();

  // Fetch recent inspections
  const { data: inspections = [], isLoading: inspectionsLoading } = useQuery({
    queryKey: ['inspections'],
    queryFn: () => inspectionsAPI.getAll().then(res => res.data.results || res.data),
  });

  // Fetch broadcasters count
  const { data: broadcasters = [], isLoading: broadcastersLoading } = useQuery({
    queryKey: ['broadcasters'],
    queryFn: () => broadcastersAPI.getAll().then(res => res.data.results || res.data),
  });

  // Calculate stats
  const stats = React.useMemo(() => {
    const totalInspections = inspections.length;
    const draftInspections = inspections.filter(i => i.status === 'draft').length;
    const completedInspections = inspections.filter(i => i.status === 'completed').length;
    const todayInspections = inspections.filter(i => {
      const today = new Date().toISOString().split('T')[0];
      return i.inspection_date === today || i.created_at?.split('T')[0] === today;
    }).length;

    return {
      total: totalInspections,
      drafts: draftInspections,
      completed: completedInspections,
      today: todayInspections,
      broadcasters: broadcasters.length,
    };
  }, [inspections, broadcasters]);

  const recentInspections = inspections.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.first_name || user?.username}!
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {format(new Date(), 'EEEE, MMMM d, yyyy')} • {user?.department}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              to="/inspection/new/step-1"
              className="btn btn-primary inline-flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Inspection
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Inspections</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {inspectionsLoading ? '...' : stats.total}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Draft Inspections</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {inspectionsLoading ? '...' : stats.drafts}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {inspectionsLoading ? '...' : stats.completed}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Radio className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Broadcasters</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {broadcastersLoading ? '...' : stats.broadcasters}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Link
          to="/inspection/new/step-1"
          className="card hover:shadow-lg transition-shadow duration-200 group"
        >
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Plus className="h-8 w-8 text-green-600 group-hover:text-green-700" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-green-700">
                  Start New Inspection
                </h3>
                <p className="text-sm text-gray-500">
                  Begin a new FM/TV inspection form
                </p>
              </div>
            </div>
          </div>
        </Link>

        <Link
          to="/inspections"
          className="card hover:shadow-lg transition-shadow duration-200 group"
        >
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Search className="h-8 w-8 text-blue-600 group-hover:text-blue-700" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-700">
                  Search Inspections
                </h3>
                <p className="text-sm text-gray-500">
                  Find and manage existing inspections
                </p>
              </div>
            </div>
          </div>
        </Link>

        <Link
          to="/broadcasters"
          className="card hover:shadow-lg transition-shadow duration-200 group"
        >
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Radio className="h-8 w-8 text-purple-600 group-hover:text-purple-700" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-purple-700">
                  Manage Broadcasters
                </h3>
                <p className="text-sm text-gray-500">
                  View and edit broadcaster information
                </p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Inspections */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Recent Inspections</h3>
            <Link
              to="/inspections"
              className="text-sm text-ca-blue hover:text-blue-700 font-medium"
            >
              View all
            </Link>
          </div>
        </div>
        <div className="card-body p-0">
          {inspectionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : recentInspections.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No inspections yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first inspection.
              </p>
              <div className="mt-4">
                <Link to="/inspection/new/step-1" className="btn btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  New Inspection
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {recentInspections.map((inspection) => (
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
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          inspection.status === 'completed' ? 'bg-green-100 text-green-800' :
                          inspection.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {inspection.status}
                        </span>
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-gray-600 truncate">
                          {inspection.broadcaster_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {inspection.updated_at && `Updated ${formatDistanceToNow(new Date(inspection.updated_at))} ago`}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <Link
                        to={inspection.status === 'completed' 
                          ? `/inspection/${inspection.id}/preview`
                          : `/inspection/${inspection.id}/step-1`
                        }
                        className="text-ca-blue hover:text-blue-700 text-sm font-medium"
                      >
                        {inspection.status === 'completed' ? 'View' : 'Continue'}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;