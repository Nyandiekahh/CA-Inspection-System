import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Download, 
  Eye, 
  Edit, 
  Share2, 
  FileText, 
  Calendar, 
  User, 
  MapPin, 
  Radio,
  Antenna,
  Zap,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  ExternalLink,
  Image as ImageIcon,
  Calculator
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

import { reportsAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Card from '../../components/Card';

const ReportViewer = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch report data
  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ['report', reportId],
    queryFn: () => reportsAPI.getById(reportId).then(res => res.data),
    enabled: !!reportId
  });

  // Fetch report preview data (more detailed info)
  const { data: previewData, isLoading: previewLoading } = useQuery({
    queryKey: ['report-preview', reportId],
    queryFn: () => reportsAPI.getPreviewData(reportId).then(res => res.data),
    enabled: !!reportId
  });

  // Fetch ERP calculations
  const { data: erpCalculations = [], isLoading: erpLoading } = useQuery({
    queryKey: ['erp-calculations', reportId],
    queryFn: () => reportsAPI.getERPCalculations(reportId).then(res => res.data),
    enabled: !!reportId
  });

  // Fetch report images
  const { data: images = [], isLoading: imagesLoading } = useQuery({
    queryKey: ['report-images', reportId],
    queryFn: () => reportsAPI.getImages(reportId).then(res => res.data),
    enabled: !!reportId
  });

  const handleDownload = async (format) => {
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
      a.download = `${report.reference_number.replace('/', '_')}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success(`${format.toUpperCase()} downloaded successfully!`);
    } catch (error) {
      toast.error(`Failed to download ${format.toUpperCase()}`);
    }
  };

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

  const getComplianceIcon = (status) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'minor_violations':
      case 'major_violations':
      case 'non_compliant':
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  if (reportLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Report not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The requested report could not be found.
        </p>
        <button
          onClick={() => navigate('/reports')}
          className="mt-4 btn btn-primary"
        >
          Back to Reports
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Eye },
    { id: 'technical', name: 'Technical Data', icon: Radio },
    { id: 'calculations', name: 'ERP Calculations', icon: Calculator },
    { id: 'images', name: 'Images', icon: ImageIcon },
    { id: 'violations', name: 'Violations', icon: AlertTriangle }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/reports')}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
            <p className="text-sm text-gray-600">{report.reference_number}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {report.status === 'completed' && (
            <>
              {report.generated_pdf && (
                <button
                  onClick={() => handleDownload('pdf')}
                  className="btn btn-outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </button>
              )}
              {report.generated_docx && (
                <button
                  onClick={() => handleDownload('docx')}
                  className="btn btn-outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Word
                </button>
              )}
            </>
          )}
          
          <button
            onClick={() => navigate(`/reports/generate/${report.inspection_details?.id}`)}
            className="btn btn-primary"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Report
          </button>
        </div>
      </div>

      {/* Report Status and Info */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card>
          <Card.Body>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Status</p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                  {report.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {getComplianceIcon(report.compliance_status)}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Compliance</p>
                <p className={`text-sm font-medium ${getComplianceColor(report.compliance_status)}`}>
                  {report.compliance_status === 'compliant' ? 'Compliant' : 
                   report.compliance_status === 'minor_violations' ? 'Minor Violations' :
                   report.compliance_status === 'major_violations' ? 'Major Violations' :
                   'Non-Compliant'}
                </p>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Created</p>
                <p className="text-sm font-medium text-gray-900">
                  {format(new Date(report.date_created), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <User className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Inspector</p>
                <p className="text-sm font-medium text-gray-900">
                  {report.inspector_name || 'Unknown'}
                </p>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium">Basic Information</h3>
            </Card.Header>
            <Card.Body>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Broadcaster</dt>
                  <dd className="mt-1 text-sm text-gray-900">{report.broadcaster_name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Report Type</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">
                    {report.report_type.replace('_', ' ')}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Inspection Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {report.inspection_details?.inspection_date && 
                     format(new Date(report.inspection_details.inspection_date), 'MMM d, yyyy')
                    }
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Form Number</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {report.inspection_details?.form_number}
                  </dd>
                </div>
              </dl>
            </Card.Body>
          </Card>

          {/* Site Information */}
          {previewData?.site_info && (
            <Card>
              <Card.Header>
                <h3 className="text-lg font-medium">Site Information</h3>
              </Card.Header>
              <Card.Body>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Site Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{previewData.site_info.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Location</dt>
                    <dd className="mt-1 text-sm text-gray-900">{previewData.site_info.physical_location}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Coordinates</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {previewData.site_info.coordinates?.latitude}, {previewData.site_info.coordinates?.longitude}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Elevation</dt>
                    <dd className="mt-1 text-sm text-gray-900">{previewData.site_info.elevation} m</dd>
                  </div>
                </dl>
              </Card.Body>
            </Card>
          )}

          {/* Violation Summary */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium">Violation Summary</h3>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-semibold text-gray-900">{report.violation_summary?.total || 0}</p>
                  <p className="text-xs text-gray-500">Total Violations</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-red-600">{report.violation_summary?.major || 0}</p>
                  <p className="text-xs text-gray-500">Major</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-yellow-600">{report.violation_summary?.minor || 0}</p>
                  <p className="text-xs text-gray-500">Minor</p>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Generation Status */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium">Document Status</h3>
            </Card.Header>
            <Card.Body>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">PDF Document</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                    report.generated_pdf ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {report.generated_pdf ? 'Generated' : 'Not Generated'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Word Document</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                    report.generated_docx ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {report.generated_docx ? 'Generated' : 'Not Generated'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Images</span>
                  <span className="text-sm text-gray-900">{report.total_images || 0}</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      )}

      {activeTab === 'technical' && previewData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tower Information */}
          {previewData.tower_info && (
            <Card>
              <Card.Header>
                <h3 className="text-lg font-medium">Tower Information</h3>
              </Card.Header>
              <Card.Body>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Owner</dt>
                    <dd className="mt-1 text-sm text-gray-900">{previewData.tower_info.owner}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Height</dt>
                    <dd className="mt-1 text-sm text-gray-900">{previewData.tower_info.height} m</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Type</dt>
                    <dd className="mt-1 text-sm text-gray-900">{previewData.tower_info.type}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Manufacturer</dt>
                    <dd className="mt-1 text-sm text-gray-900">{previewData.tower_info.manufacturer}</dd>
                  </div>
                </dl>
              </Card.Body>
            </Card>
          )}

          {/* Transmitter Information */}
          {previewData.transmitter_info && (
            <Card>
              <Card.Header>
                <h3 className="text-lg font-medium">Transmitter Information</h3>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Exciter</h4>
                    <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
                      <div>
                        <dt className="text-xs text-gray-500">Manufacturer</dt>
                        <dd className="text-sm text-gray-900">{previewData.transmitter_info.exciter?.manufacturer}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Model</dt>
                        <dd className="text-sm text-gray-900">{previewData.transmitter_info.exciter?.model}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Serial</dt>
                        <dd className="text-sm text-gray-900">{previewData.transmitter_info.exciter?.serial}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Power</dt>
                        <dd className="text-sm text-gray-900">{previewData.transmitter_info.exciter?.power} W</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Amplifier</h4>
                    <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
                      <div>
                        <dt className="text-xs text-gray-500">Manufacturer</dt>
                        <dd className="text-sm text-gray-900">{previewData.transmitter_info.amplifier?.manufacturer}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Model</dt>
                        <dd className="text-sm text-gray-900">{previewData.transmitter_info.amplifier?.model}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Serial</dt>
                        <dd className="text-sm text-gray-900">{previewData.transmitter_info.amplifier?.serial}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">Power</dt>
                        <dd className="text-sm text-gray-900">{previewData.transmitter_info.amplifier?.power} W</dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500">Frequency</dt>
                    <dd className="mt-1 text-sm text-gray-900">{previewData.transmitter_info.frequency}</dd>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Antenna Information */}
          {previewData.antenna_info && (
            <Card>
              <Card.Header>
                <h3 className="text-lg font-medium">Antenna Information</h3>
              </Card.Header>
              <Card.Body>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Manufacturer</dt>
                    <dd className="mt-1 text-sm text-gray-900">{previewData.antenna_info.manufacturer}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Model</dt>
                    <dd className="mt-1 text-sm text-gray-900">{previewData.antenna_info.model}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Type</dt>
                    <dd className="mt-1 text-sm text-gray-900">{previewData.antenna_info.type}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Gain</dt>
                    <dd className="mt-1 text-sm text-gray-900">{previewData.antenna_info.gain} dBd</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Height on Tower</dt>
                    <dd className="mt-1 text-sm text-gray-900">{previewData.antenna_info.height_on_tower} m</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Polarization</dt>
                    <dd className="mt-1 text-sm text-gray-900">{previewData.antenna_info.polarization}</dd>
                  </div>
                </dl>
              </Card.Body>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'calculations' && (
        <div className="space-y-6">
          {erpLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : erpCalculations.length > 0 ? (
            <Card>
              <Card.Header>
                <h3 className="text-lg font-medium">ERP Calculations</h3>
              </Card.Header>
              <Card.Body className="p-0">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Channel
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Frequency
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Forward Power
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Antenna Gain
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ERP (dBW)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ERP (kW)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {erpCalculations.map((calc, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {calc.channel_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {calc.frequency_mhz}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {calc.forward_power_w} W
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {calc.antenna_gain_dbd} dBd
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {calc.erp_dbw} dBW
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {calc.erp_kw} kW
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              calc.is_compliant 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {calc.is_compliant ? 'Compliant' : 'Non-Compliant'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card.Body>
            </Card>
          ) : (
            <Card>
              <Card.Body>
                <div className="text-center py-8">
                  <Calculator className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No ERP Calculations</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No ERP calculations have been performed for this report yet.
                  </p>
                </div>
              </Card.Body>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'images' && (
        <div className="space-y-6">
          {imagesLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : images.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image, index) => (
                <Card key={index}>
                  <Card.Body className="p-0">
                    <img
                      src={image.image_url}
                      alt={image.caption}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                    <div className="p-4">
                      <h4 className="text-sm font-medium text-gray-900">{image.caption}</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Type: {image.image_type.replace('_', ' ')}
                      </p>
                      {image.description && (
                        <p className="text-xs text-gray-600 mt-2">{image.description}</p>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <Card.Body>
                <div className="text-center py-8">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No Images</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No images have been uploaded for this report yet.
                  </p>
                </div>
              </Card.Body>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'violations' && (
        <div className="space-y-6">
          {previewData?.violations && previewData.violations.length > 0 ? (
            <div className="space-y-4">
              {previewData.violations.map((violation, index) => (
                <Card key={index}>
                  <Card.Body>
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                        violation.severity === 'major' ? 'bg-red-100' : 'bg-yellow-100'
                      }`}>
                        <AlertTriangle className={`w-4 h-4 ${
                          violation.severity === 'major' ? 'text-red-600' : 'text-yellow-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900">{violation.type}</h4>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            violation.severity === 'major' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {violation.severity}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">{violation.description}</p>
                        {violation.recommendation && (
                          <p className="mt-2 text-sm text-blue-600">
                            <strong>Recommendation:</strong> {violation.recommendation}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <Card.Body>
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No Violations Found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    This inspection found no violations. The station is compliant.
                  </p>
                </div>
              </Card.Body>
            </Card>
          )}
        </div>
      )}

      {/* Report Content */}
      {(report.findings || report.observations || report.conclusions || report.recommendations) && (
        <Card>
          <Card.Header>
            <h3 className="text-lg font-medium">Report Content</h3>
          </Card.Header>
          <Card.Body>
            <div className="space-y-6">
              {report.findings && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Findings</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.findings}</p>
                </div>
              )}
              
              {report.observations && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Observations</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.observations}</p>
                </div>
              )}
              
              {report.conclusions && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Conclusions</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.conclusions}</p>
                </div>
              )}
              
              {report.recommendations && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Recommendations</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.recommendations}</p>
                </div>
              )}
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default ReportViewer;