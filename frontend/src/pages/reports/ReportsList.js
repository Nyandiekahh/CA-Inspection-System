import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Eye, 
  FileText,
  ChevronDown,
  X,
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

import { reportsAPI, inspectionsAPI } from '../../services/api';
import { useReportsStore } from '../../store';
import LoadingSpinner from '../../components/LoadingSpinner';
import Card from '../../components/Card';

const ReportsList = () => {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const { 
    filters, 
    searchTerm, 
    setFilters, 
    setSearchTerm, 
    clearFilters,
    getFilteredReports 
  } = useReportsStore();

  // Fetch reports
  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportsAPI.getAll().then(res => res.data.results || res.data),
  });

  // Fetch available inspections for report generation
  const { data: availableInspections = [], isLoading: inspectionsLoading } = useQuery({
    queryKey: ['available-inspections'],
    queryFn: async () => {
      const inspections = await inspectionsAPI.getAll().then(res => res.data.results || res.data);
      const completed = inspections.filter(i => i.status === 'completed');
      
      // Filter out inspections that already have reports
      const reportedInspectionIds = new Set(reports.map(r => r.inspection));
      return completed.filter(i => !reportedInspectionIds.has(i.id));
    },
    enabled: !!reports.length,
  });

  // Filter reports based on current filters
  const filteredReports = reports.filter(report => {
    // Search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        report.reference_number?.toLowerCase().includes(searchLower) ||
        report.title?.toLowerCase().includes(searchLower) ||
        report.broadcaster_name?.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }
    
    // Status filter
    if (filters.status && report.status !== filters.status) {
      return false;
    }
    
    // Report type filter
    if (filters.reportType && report.report_type !== filters.reportType) {
      return false;
    }
    
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplianceIcon = (status) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'minor_violations':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'major_violations':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'non_compliant':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const handleDownload = async (reportId, format = 'pdf') => {
    try {
      const response = format === 'pdf' 
        ? await reportsAPI.downloadPDF(reportId)
        : await reportsAPI.downloadDOCX(reportId);
      
      const blob = new Blob([response.data], {
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Reports</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage and download inspection reports
          </p>
        </div>
        <Link to="/reports" className="btn btn-outline mt-4 sm:mt-0">
          <FileText className="w-4 h-4 mr-2" />
          Reports Dashboard
        </Link>
      </div>

      {/* Available Inspections for Report Generation */}
      {availableInspections.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <Card.Header className="bg-green-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-green-900">
                Ready for Report Generation
              </h3>
              <span className="text-sm text-green-700">
                {availableInspections.length} inspection{availableInspections.length !== 1 ? 's' : ''}
              </span>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableInspections.slice(0, 6).map((inspection) => (
                <div key={inspection.id} className="bg-white p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {inspection.form_number}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {inspection.broadcaster_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(inspection.updated_at))} ago
                      </p>
                    </div>
                    <Link
                      to={`/reports/generate/${inspection.id}`}
                      className="btn btn-sm btn-primary ml-3"
                    >
                      Generate
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            {availableInspections.length > 6 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-green-700">
                  And {availableInspections.length - 6} more inspections ready for reports
                </p>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <Card.Body>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by reference number, title, or broadcaster..."
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
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="form-label">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ status: e.target.value })}
                    className="form-input"
                  >
                    <option value="">All statuses</option>
                    <option value="draft">Draft</option>
                    <option value="pending_review">Pending Review</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                
                <div>
                  <label className="form-label">Report Type</label>
                  <select
                    value={filters.reportType}
                    onChange={(e) => setFilters({ reportType: e.target.value })}
                    className="form-input"
                  >
                    <option value="">All types</option>
                    <option value="fm_radio">FM Radio</option>
                    <option value="tv_broadcast">TV Broadcast</option>
                    <option value="am_radio">AM Radio</option>
                  </select>
                </div>
                
                <div className="sm:col-span-2 flex items-end">
                  {(searchTerm || filters.status || filters.reportType) && (
                    <button
                      onClick={clearFilters}
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

      {/* Reports List */}
      <Card>
        <Card.Body className="p-0">
          {reportsLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm || filters.status || filters.reportType ? 'No reports found' : 'No reports yet'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filters.status || filters.reportType 
                  ? 'Try adjusting your search criteria'
                  : 'Generate your first report from a completed inspection.'
                }
              </p>
              {(!searchTerm && !filters.status && !filters.reportType && availableInspections.length > 0) && (
                <div className="mt-6">
                  <Link to={`/reports/generate/${availableInspections[0].id}`} className="btn btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Generate First Report
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <div key={report.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        <div className={`flex-shrink-0 w-2 h-2 rounded-full ${
                          report.status === 'completed' ? 'bg-green-400' :
                          report.status === 'pending_review' ? 'bg-yellow-400' :
                          'bg-gray-400'
                        }`} />
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {report.reference_number}
                        </p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                          {report.status.replace('_', ' ')}
                        </span>
                        {report.compliance_status && (
                          <div className="flex items-center space-x-1">
                            {getComplianceIcon(report.compliance_status)}
                            <span className="text-xs text-gray-600">
                              {report.compliance_status.replace('_', ' ')}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-gray-600 truncate">
                          {report.broadcaster_name}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-xs text-gray-500">
                            Created: {format(new Date(report.date_created), 'MMM d, yyyy')}
                          </p>
                          {report.date_completed && (
                            <p className="text-xs text-gray-500">
                              Completed: {formatDistanceToNow(new Date(report.date_completed))} ago
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      {/* Download buttons - only for completed reports */}
                      {report.status === 'completed' && (
                        <>
                          {report.generated_pdf && (
                            <button
                              onClick={() => handleDownload(report.id, 'pdf')}
                              className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50 transition-colors"
                              title="Download PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                          {report.generated_docx && (
                            <button
                              onClick={() => handleDownload(report.id, 'docx')}
                              className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50 transition-colors"
                              title="Download Word"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                      
                      {/* View Button */}
                      <Link
                        to={`/reports/view/${report.id}`}
                        className="text-ca-blue hover:text-blue-700 p-2 rounded hover:bg-blue-50"
                        title="View Report"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Summary */}
      {filteredReports.length > 0 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Showing {filteredReports.length} of {reports.length} reports
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsList;