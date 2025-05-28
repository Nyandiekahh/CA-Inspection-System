// Enhanced Report Generation Component - COMPLETE REPLACEMENT
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FileText, 
  Upload, 
  Download, 
  Save, 
  Eye, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Calculator,
  Image as ImageIcon,
  ArrowLeft,
  Camera,
  X,
  Plus,
  Check
} from 'lucide-react';
import { toast } from 'react-hot-toast';

import { reportsAPI, inspectionsAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import Card from '../../components/Card';

const EnhancedReportGeneration = () => {
  const { inspectionId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [generationStep, setGenerationStep] = useState(1); // 1: Setup, 2: Images, 3: Content, 4: Generate
  const [reportData, setReportData] = useState({
    findings: '',
    observations: '',
    conclusions: '',
    recommendations: '',
    include_images: true,
    formats: ['pdf']
  });
  
  // Enhanced image management with categories
  const [imageCategories, setImageCategories] = useState({
    site_overview: { files: [], hasImage: false, optional: true },
    tower_structure: { files: [], hasImage: false, optional: false },
    exciter: { files: [], hasImage: false, optional: false },
    amplifier: { files: [], hasImage: false, optional: false },
    antenna_system: { files: [], hasImage: false, optional: false },
    filter: { files: [], hasImage: false, optional: true },
    studio_link: { files: [], hasImage: false, optional: true },
    transmitter_room: { files: [], hasImage: false, optional: true },
    equipment_rack: { files: [], hasImage: false, optional: true },
    other: { files: [], hasImage: false, optional: true }
  });
  
  const [erpCalculations, setErpCalculations] = useState([]);
  const [reportId, setReportId] = useState(null);

  // Image category labels and descriptions
  const imageCategoryInfo = {
    site_overview: {
      label: 'Site Overview',
      description: 'Overall view of the transmitter site',
      icon: '🏢'
    },
    tower_structure: {
      label: 'Tower/Mast Structure',
      description: 'Tower or mast supporting the antenna',
      icon: '🗼'
    },
    exciter: {
      label: 'Exciter Equipment',
      description: 'Exciter unit and related equipment',
      icon: '📻'
    },
    amplifier: {
      label: 'Amplifier Equipment',
      description: 'Power amplifier and associated equipment',
      icon: '🔊'
    },
    antenna_system: {
      label: 'Antenna System',
      description: 'Antenna and mounting hardware',
      icon: '📡'
    },
    filter: {
      label: 'Filter Equipment',
      description: 'Band pass filters and combiners',
      icon: '🔧'
    },
    studio_link: {
      label: 'Studio to Transmitter Link',
      description: 'STL equipment and connections',
      icon: '📶'
    },
    transmitter_room: {
      label: 'Transmitter Room',
      description: 'Interior view of transmitter facility',
      icon: '🏠'
    },
    equipment_rack: {
      label: 'Equipment Rack',
      description: 'Equipment racks and installations',
      icon: '⚡'
    },
    other: {
      label: 'Other Equipment',
      description: 'Any other relevant equipment',
      icon: '📷'
    }
  };

  // Fetch inspection data
  const { data: inspection, isLoading: inspectionLoading } = useQuery({
    queryKey: ['inspection', inspectionId],
    queryFn: () => inspectionsAPI.getById(inspectionId).then(res => res.data),
    enabled: !!inspectionId
  });

  // Create report mutation
  const createReportMutation = useMutation({
    mutationFn: () => reportsAPI.createFromInspection(inspectionId),
    onSuccess: (response) => {
      setReportId(response.data.report_id);
      toast.success('Report structure created successfully!');
      setGenerationStep(2);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create report');
    }
  });

  // Image upload mutation
  const imageUploadMutation = useMutation({
    mutationFn: (formData) => reportsAPI.uploadImages(formData),
    onSuccess: (response) => {
      toast.success(`${response.data.total_uploaded} images uploaded successfully!`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to upload images');
    }
  });

  // ERP calculation mutation
  const erpCalculationMutation = useMutation({
    mutationFn: (data) => reportsAPI.bulkCalculateERP(data),
    onSuccess: (response) => {
      toast.success(`ERP calculations completed!`);
      setErpCalculations(response.data.calculations);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to calculate ERP');
    }
  });

  // Generate documents mutation
  const generateDocumentsMutation = useMutation({
    mutationFn: (data) => reportsAPI.generateDocuments(reportId, data),
    onSuccess: () => {
      toast.success('Professional documents generated successfully!');
      queryClient.invalidateQueries(['reports']);
      navigate(`/reports/view/${reportId}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to generate documents');
    }
  });

  // Initialize report creation
  useEffect(() => {
    if (inspection && !reportId) {
      createReportMutation.mutate();
    }
  }, [inspection]);

  const handleCategoryImageUpload = (category, event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      setImageCategories(prev => ({
        ...prev,
        [category]: {
          ...prev[category],
          files: files,
          hasImage: true
        }
      }));
    }
  };

  const handleNoImageAvailable = (category) => {
    setImageCategories(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        files: [],
        hasImage: false
      }
    }));
  };

  const removeCategoryImage = (category) => {
    setImageCategories(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        files: [],
        hasImage: false
      }
    }));
  };

  const uploadAllImages = async () => {
    if (!reportId) return;

    const formData = new FormData();
    formData.append('report_id', reportId);

    let imageIndex = 0;
    Object.entries(imageCategories).forEach(([category, data]) => {
      if (data.files.length > 0) {
        data.files.forEach((file) => {
          formData.append(`image_${imageIndex}`, file);
          formData.append(`image_${imageIndex}_type`, category);
          formData.append(`image_${imageIndex}_caption`, 
            `${imageCategoryInfo[category].label} - ${file.name.split('.')[0]}`);
          formData.append(`image_${imageIndex}_position`, 'equipment_section');
          imageIndex++;
        });
      }
    });

    if (imageIndex > 0) {
      imageUploadMutation.mutate(formData);
    }
  };

  const calculateERP = () => {
    if (!reportId || !inspection) return;

    const channelData = {
      report_id: reportId,
      channels: [{
        channel_number: 'CH.1',
        frequency_mhz: inspection.transmit_frequency || 'Unknown',
        forward_power_w: parseFloat(inspection.amplifier_actual_reading || 0),
        antenna_gain_dbd: parseFloat(inspection.antenna_gain || 11.0),
        losses_db: 1.5
      }]
    };

    erpCalculationMutation.mutate(channelData);
  };

  const generateDocuments = () => {
    if (!reportId) return;

    const generationData = {
      formats: reportData.formats,
      include_images: reportData.include_images,
      custom_observations: reportData.observations,
      custom_conclusions: reportData.conclusions,
      custom_recommendations: reportData.recommendations
    };

    generateDocumentsMutation.mutate(generationData);
  };

  const getStepStatus = (step) => {
    if (step < generationStep) return 'completed';
    if (step === generationStep) return 'current';
    return 'upcoming';
  };

  const steps = [
    { number: 1, name: 'Setup', description: 'Initialize report structure' },
    { number: 2, name: 'Images', description: 'Upload equipment photos' },
    { number: 3, name: 'Content', description: 'Review and customize' },
    { number: 4, name: 'Generate', description: 'Create final documents' }
  ];

  const getTotalImagesSelected = () => {
    return Object.values(imageCategories).reduce((total, cat) => total + cat.files.length, 0);
  };

  const getRequiredImagesStatus = () => {
    const requiredCategories = Object.entries(imageCategories)
      .filter(([_, data]) => !data.optional);
    
    const completedRequired = requiredCategories
      .filter(([_, data]) => data.files.length > 0).length;
    
    return {
      completed: completedRequired,
      total: requiredCategories.length,
      allComplete: completedRequired === requiredCategories.length
    };
  };

  if (inspectionLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Professional Report Generation</h1>
            <p className="text-sm text-gray-600">
              {inspection?.broadcaster?.name} - {inspection?.form_number}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <Card.Body>
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    getStepStatus(step.number) === 'completed' ? 'bg-green-100 text-green-800' :
                    getStepStatus(step.number) === 'current' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-400'
                  }`}>
                    {getStepStatus(step.number) === 'completed' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm font-medium text-gray-900">{step.name}</p>
                    <p className="text-xs text-gray-500">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    getStepStatus(step.number + 1) !== 'upcoming' ? 'bg-green-200' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Step 1: Setup */}
      {generationStep === 1 && (
        <Card>
          <Card.Header>
            <h3 className="text-lg font-medium">Report Structure Setup</h3>
          </Card.Header>
          <Card.Body>
            {createReportMutation.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="lg" />
                <span className="ml-3 text-gray-600">Creating professional report structure...</span>
              </div>
            ) : createReportMutation.isError ? (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Setup Failed</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {createReportMutation.error?.response?.data?.error || 'Failed to create report structure'}
                </p>
                <button
                  onClick={() => createReportMutation.mutate()}
                  className="mt-4 btn btn-primary"
                >
                  Retry Setup
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Report Structure Created</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Professional CA inspection report structure has been initialized successfully.
                </p>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Step 2: Enhanced Image Upload */}
      {generationStep === 2 && (
        <div className="space-y-6">
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Equipment Photography</h3>
                <div className="text-sm text-gray-500">
                  {getTotalImagesSelected()} images selected
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">📸 Photography Guidelines</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Take clear, well-lit photos of each equipment category</li>
                    <li>• Include equipment nameplates and serial numbers when visible</li>
                    <li>• Use "No Image Available" if equipment is not accessible or doesn't exist</li>
                    <li>• Photos will be automatically positioned in the report</li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(imageCategoryInfo).map(([category, info]) => {
                  const categoryData = imageCategories[category];
                  const isRequired = !categoryData.optional;
                  
                  return (
                    <div key={category} className={`border rounded-lg p-4 ${
                      isRequired ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{info.icon}</span>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">
                              {info.label}
                              {isRequired && <span className="text-red-500 ml-1">*</span>}
                            </h4>
                            <p className="text-xs text-gray-500">{info.description}</p>
                          </div>
                        </div>
                        {categoryData.files.length > 0 && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>

                      {categoryData.files.length > 0 ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            {categoryData.files.map((file, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={file.name}
                                  className="w-full h-20 object-cover rounded border"
                                />
                                <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => removeCategoryImage(category)}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Remove Images
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="border-2 border-dashed border-gray-300 rounded p-3 text-center">
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={(e) => handleCategoryImageUpload(category, e)}
                              className="hidden"
                              id={`upload-${category}`}
                            />
                            <label htmlFor={`upload-${category}`} className="cursor-pointer">
                              <Camera className="mx-auto h-6 w-6 text-gray-400 mb-1" />
                              <span className="text-xs text-gray-600">Upload Photos</span>
                            </label>
                          </div>
                          
                          <button
                            onClick={() => handleNoImageAvailable(category)}
                            className="w-full text-xs text-gray-500 hover:text-gray-700 border border-gray-300 rounded px-2 py-1"
                          >
                            ❌ No Image Available
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {(() => {
                    const status = getRequiredImagesStatus();
                    return (
                      <span>
                        Required sections: {status.completed}/{status.total} 
                        {status.allComplete ? ' ✅' : ' ⏳'}
                      </span>
                    );
                  })()}
                </div>
                
                <div className="flex space-x-3">
                  {getTotalImagesSelected() > 0 && (
                    <button
                      onClick={uploadAllImages}
                      disabled={imageUploadMutation.isLoading}
                      className="btn btn-outline"
                    >
                      {imageUploadMutation.isLoading ? (
                        <>
                          <LoadingSpinner size="sm" />
                          <span className="ml-2">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload All Images
                        </>
                      )}
                    </button>
                  )}
                  
                  <button
                    onClick={() => setGenerationStep(3)}
                    className="btn btn-primary"
                  >
                    Continue to Content
                  </button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Step 3: Content Review - CONTINUING FROM WHERE IT CUT OFF */}
      {generationStep === 3 && (
        <div className="space-y-6">
          {/* ERP Calculations */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium">ERP Calculations</h3>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Equipment Data</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Forward Power:</span>
                      <span className="ml-2 font-medium">{inspection?.amplifier_actual_reading || 'N/A'} W</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Antenna Gain:</span>
                      <span className="ml-2 font-medium">{inspection?.antenna_gain || 'N/A'} dBd</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Frequency:</span>
                      <span className="ml-2 font-medium">{inspection?.transmit_frequency || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {erpCalculations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Calculated Results</h4>
                    <div className="bg-white border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Channel</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ERP (dBW)</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">ERP (kW)</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {erpCalculations.map((calc, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 text-sm text-gray-900">{calc.channel_number}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{calc.erp_dbw}</td>
                              <td className="px-4 py-2 text-sm text-gray-900">{calc.erp_kw}</td>
                              <td className="px-4 py-2 text-sm">
                                <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                                  calc.is_compliant ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {calc.is_compliant ? 'Compliant' : 'Non-Compliant'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <button
                  onClick={calculateERP}
                  disabled={erpCalculationMutation.isLoading}
                  className="btn btn-outline"
                >
                  {erpCalculationMutation.isLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">Calculating...</span>
                    </>
                  ) : (
                    <>
                      <Calculator className="w-4 h-4 mr-2" />
                      Calculate ERP
                    </>
                  )}
                </button>
              </div>
            </Card.Body>
          </Card>

          {/* Content Customization */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium">Report Content</h3>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Observations
                  </label>
                  <textarea
                    rows={3}
                    value={reportData.observations}
                    onChange={(e) => setReportData(prev => ({
                      ...prev,
                      observations: e.target.value
                    }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Any additional observations to include in the report..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conclusions
                  </label>
                  <textarea
                    rows={3}
                    value={reportData.conclusions}
                    onChange={(e) => setReportData(prev => ({
                      ...prev,
                      conclusions: e.target.value
                    }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Conclusions drawn from the inspection (auto-generated if left blank)..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recommendations
                  </label>
                  <textarea
                    rows={3}
                    value={reportData.recommendations}
                    onChange={(e) => setReportData(prev => ({
                      ...prev,
                      recommendations: e.target.value
                    }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Recommendations for the broadcaster (auto-generated if left blank)..."
                  />
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setGenerationStep(2)}
                  className="btn btn-outline"
                >
                  Back to Images
                </button>
                <button
                  onClick={() => setGenerationStep(4)}
                  className="btn btn-primary"
                >
                  Proceed to Generation
                </button>
              </div>
            </Card.Body>
          </Card>
        </div>
      )}

      {/* Step 4: Generate Documents */}
      {generationStep === 4 && (
        <Card>
          <Card.Header>
            <h3 className="text-lg font-medium">Generate Professional Documents</h3>
          </Card.Header>
          <Card.Body>
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-900 mb-2">🎯 Ready for Generation</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Report structure: ✅ Created</li>
                  <li>• Equipment images: ✅ {getTotalImagesSelected()} uploaded</li>
                  <li>• ERP calculations: ✅ {erpCalculations.length > 0 ? 'Completed' : 'Ready'}</li>
                  <li>• Professional formatting: ✅ CA template applied</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Formats
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={reportData.formats.includes('pdf')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setReportData(prev => ({
                              ...prev,
                              formats: [...prev.formats, 'pdf']
                            }));
                          } else {
                            setReportData(prev => ({
                              ...prev,
                              formats: prev.formats.filter(f => f !== 'pdf')
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">📄 PDF Document</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={reportData.formats.includes('docx')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setReportData(prev => ({
                              ...prev,
                              formats: [...prev.formats, 'docx']
                            }));
                          } else {
                            setReportData(prev => ({
                              ...prev,
                              formats: prev.formats.filter(f => f !== 'docx')
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">📝 Word Document</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Generation Options
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={reportData.include_images}
                        onChange={(e) => setReportData(prev => ({
                          ...prev,
                          include_images: e.target.checked
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">📷 Include uploaded images</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setGenerationStep(3)}
                    className="btn btn-outline"
                  >
                    Back to Content
                  </button>
                  
                  <button
                    onClick={generateDocuments}
                    disabled={generateDocumentsMutation.isLoading || reportData.formats.length === 0}
                    className="btn btn-primary btn-lg"
                  >
                    {generateDocumentsMutation.isLoading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Generating Professional Documents...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-5 h-5 mr-2" />
                        Generate Professional Report
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Preview of what will be generated */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">📋 Report Preview</h4>
                <div className="text-sm text-gray-700 space-y-2">
                  <div className="flex justify-between">
                    <span>Reference Number:</span>
                    <span className="font-medium">{reportId ? 'Auto-generated' : 'Pending'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Station Type:</span>
                    <span className="font-medium">{inspection?.station_type || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Broadcaster:</span>
                    <span className="font-medium">{inspection?.broadcaster?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Inspection Date:</span>
                    <span className="font-medium">{inspection?.inspection_date || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Images to Include:</span>
                    <span className="font-medium">
                      {reportData.include_images ? getTotalImagesSelected() : 0} images
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Document Format:</span>
                    <span className="font-medium">
                      {reportData.formats.join(', ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default EnhancedReportGeneration;