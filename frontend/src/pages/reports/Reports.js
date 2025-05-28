import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  FileText, 
  Plus, 
  Search, 
  Download, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Eye,
  Filter,
  Calendar,
  BarChart3
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

import { reportsAPI, inspectionsAPI } from '../../services/api';
import { useReportsStore } from '../../store';
import LoadingSpinner from '../../components/LoadingSpinner';
import Card from '../../components/Card';

const Reports = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    reportsList, 
    setReportsList, 
    isLoading, 
    setLoading, 
    getReportsStats,
    getFilteredReports 
  } = useReportsStore();

  // Check if we came from inspection list with pre-selected inspection
  const selectedInspection = location.state?.selectedInspection;
  const autoStart = location.state?.autoStart;

  // Fetch reports
  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportsAPI.getAll().then(res => res.data.results || res.data),
  });

  // Fetch completed inspections without reports
  const { data: availableInspections = [], isLoading: inspectionsLoading } = useQuery({
    queryKey: ['available-inspections'],
    queryFn: async () => {
      const inspections = await inspectionsAPI.getAll().then(res => res.data.results || res.data);
      const completed = inspections.filter(i => i.status === 'completed');
      
      // Filter out inspections that already have reports
      const reportedInspectionIds = new Set((reportsData || []).map(r => r.inspection));
      return completed.filter(i => !reportedInspectionIds.has(i.id));
    },
    enabled: !!reportsData,
  });

  // Auto-start report generation if coming from inspection list
  useEffect(() => {
    if (autoStart && selectedInspection) {
      navigate(`/reports/generate/${selectedInspection.id}`);
    }
  }, [autoStart, selectedInspection, navigate]);

  // Update store when data loads
  useEffect(() => {
    if (reportsData) {
      setReportsList(reportsData);
    }
  }, [reportsData, setReportsList]);

  // Set loading state
  useEffect(() => {
    setLoading(reportsLoading);
  }, [reportsLoading, setLoading]);

  const stats = getReportsStats();
  const filteredReports = getFilteredReports();
  const recentReports = filteredReports.slice(0, 5);

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

  const getComplianceColor = (status) => {
    switch (status) {
      case 'compliant':
        return 'text-green-600';
      case 'minor_violations':
        return 'text-yellow-600';
      case 'major_violations':
        return 'text-red-600';
      case 'non_compliant':
        return 'text-red-700';
      default:
        return 'text-gray-600';
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
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-600 mt-1">
            Generate and manage inspection reports
          </p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <Link to="/reports/list" className="btn btn-outline">
            <FileText className="w-4 h-4 mr-2" />
            All Reports
          </Link>
          {availableInspections.length > 0 && (
            <Link to="/reports/list" className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Generate Report
            </Link>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <Card.Body>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Reports</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isLoading ? '...' : stats.total}
                </p>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isLoading ? '...' : stats.completed}
                </p>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Violations Found</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isLoading ? '...' : stats.violations}
                </p>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {isLoading ? '...' : stats.pending}
                </p>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generate New Report */}
        <Card className="hover:shadow-lg transition-shadow duration-200 group">
          <Card.Body>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Plus className="h-8 w-8 text-green-600 group-hover:text-green-700" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-green-700">
                  Generate New Report
                </h3>
                <p className="text-sm text-gray-500">
                  Create reports from completed inspections
                </p>
                {availableInspections.length > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    {availableInspections.length} inspections ready
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4">
              {availableInspections.length > 0 ? (
                <Link to="/reports/list" className="btn btn-primary w-full">
                  Start Generation
                </Link>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-gray-500">No inspections ready for reports</p>
                  <Link to="/inspections" className="text-ca-blue text-sm hover:underline">
                    View inspections
                  </Link>
                </div>
              )}
            </div>
          </Card.Body>
        </Card>

        {/* View All Reports */}
        <Link to="/reports/list" className="card hover:shadow-lg transition-shadow duration-200 group">
          <Card.Body>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Search className="h-8 w-8 text-blue-600 group-hover:text-blue-700" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-700">
                  Browse All Reports
                </h3>
                <p className="text-sm text-gray-500">
                  Search and manage existing reports
                </p>
              </div>
            </div>
          </Card.Body>
        </Link>

        {/* Analytics */}
        <Card className="hover:shadow-lg transition-shadow duration-200 group">
          <Card.Body>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-purple-600 group-hover:text-purple-700" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 group-hover:text-purple-700">
                  Reports Analytics
                </h3>
                <p className="text-sm text-gray-500">
                  View compliance trends and statistics
                </p>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Recent Reports */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Recent Reports</h3>
            <Link
              to="/reports/list"
              className="text-sm text-ca-blue hover:text-blue-700 font-medium"
            >
              View all
            </Link>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : recentReports.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No reports yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Generate your first report from a completed inspection.
              </p>
              {availableInspections.length > 0 && (
                <div className="mt-4">
                  <Link to="/reports/list" className="btn btn-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Generate Report
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {recentReports.map((report) => (
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
                          <span className={`text-xs font-medium ${getComplianceColor(report.compliance_status)}`}>
                            {report.compliance_status === 'compliant' ? 'Compliant' : 'Violations'}
                          </span>
                        )}
                      </div>
                      <div className="mt-1">
                        <p className="text-sm text-gray-600 truncate">
                          {report.broadcaster_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {report.date_created && `Created ${formatDistanceToNow(new Date(report.date_created))} ago`}
                        </p>
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
                              className="text-gray-400 hover:text-gray-600 p-2 rounded hover:bg-gray-100"
                              title="Download PDF"
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

      {/* Available Inspections for Report Generation */}
      {availableInspections.length > 0 && (
        <Card>
          <Card.Header>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Ready for Report Generation
              </h3>
              <span className="text-sm text-gray-500">
                {availableInspections.length} inspection{availableInspections.length !== 1 ? 's' : ''}
              </span>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="divide-y divide-gray-200">
              {availableInspections.slice(0, 3).map((inspection) => (
                <div key={inspection.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {inspection.form_number}
                      </p>
                      <p className="text-sm text-gray-600">
                        {inspection.broadcaster_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Completed {formatDistanceToNow(new Date(inspection.updated_at))} ago
                      </p>
                    </div>
                    <Link
                      to={`/reports/generate/${inspection.id}`}
                      className="btn btn-sm btn-primary"
                    >
                      Generate Report
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            {availableInspections.length > 3 && (
              <div className="p-4 bg-gray-50 border-t">
                <Link
                  to="/reports/list"
                  className="text-center block text-sm text-ca-blue hover:text-blue-700 font-medium"
                >
                  View all {availableInspections.length} ready inspections
                </Link>
              </div>
            )}
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default Reports;