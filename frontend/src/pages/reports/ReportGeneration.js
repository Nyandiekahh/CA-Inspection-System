// Enhanced Report Generation Component - UPDATED VERSION (ERP Fetching & DOCX Only)
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
  Image as ImageIcon,
  ArrowLeft,
  Camera,
  X,
  Plus,
  Check,
  Edit3,
  Trash2
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
    formats: ['docx'] // CHANGED: Only DOCX format
  });
  
  // Updated image management - simplified to required categories only
  const [imageCategories, setImageCategories] = useState({
    site_overview: { 
      photos: [], // Array of {file, description, id}
      hasPhotos: false
    },
    tower_mast: { 
      photos: [], 
      hasPhotos: false
    },
    transmitter_equipment: { 
      photos: [], 
      hasPhotos: false
    },
    antenna: { 
      photos: [], 
      hasPhotos: false
    },
    studio_transmitter_link: { 
      photos: [], 
      hasPhotos: false
    },
    filter_equipment: { 
      photos: [], 
      hasPhotos: false
    },
    other_equipment: { 
      photos: [], 
      hasPhotos: false
    }
  });
  
  // REMOVED: erpCalculations state - will fetch from inspection data
  const [reportId, setReportId] = useState(null);
  const [photoDescriptionModal, setPhotoDescriptionModal] = useState(null);
  const [editingPhoto, setEditingPhoto] = useState(null);

  // Image category labels and descriptions - Updated to match backend
  const imageCategoryInfo = {
    site_overview: {
      label: 'Site Overview',
      description: 'Overall view of the transmitter site and surroundings',
      icon: '🏢'
    },
    tower_mast: {
      label: 'Tower/Mast Structure',
      description: 'Tower or mast supporting the antenna system',
      icon: '🗼'
    },
    transmitter_equipment: {
      label: 'Transmitter Equipment',
      description: 'Exciter, amplifier, and related transmitter equipment',
      icon: '📻'
    },
    antenna: {
      label: 'Antenna System',
      description: 'Antenna and mounting hardware on the tower',
      icon: '📡'
    },
    studio_transmitter_link: {
      label: 'Studio to Transmitter Link',
      description: 'STL equipment and connections between studio and transmitter',
      icon: '📶'
    },
    filter_equipment: {
      label: 'Filter Equipment',
      description: 'Band pass filters, combiners, and related filtering equipment',
      icon: '🔧'
    },
    other_equipment: {
      label: 'Other Equipment',
      description: 'Any other relevant equipment not covered in specific categories',
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

  // REMOVED: ERP calculation mutation - no longer needed

  // Generate documents mutation
  const generateDocumentsMutation = useMutation({
    mutationFn: (data) => reportsAPI.generateDocuments(reportId, data),
    onSuccess: () => {
      toast.success('Professional document generated successfully!');
      queryClient.invalidateQueries(['reports']);
      navigate(`/reports/view/${reportId}`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to generate document');
    }
  });

  // Initialize report creation
  useEffect(() => {
    if (inspection && !reportId) {
      createReportMutation.mutate();
    }
  }, [inspection]);

  // Handle file selection for a category
  const handleCategoryFileSelection = (category, event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      // For each file, we'll prompt for description
      const newPhotos = files.map(file => ({
        id: Date.now() + Math.random(), // Unique ID
        file: file,
        description: '', // Will be filled by user
        name: file.name
      }));
      
      // Open description modal for the first photo
      if (newPhotos.length > 0) {
        setPhotoDescriptionModal({
          category,
          photos: newPhotos,
          currentIndex: 0
        });
      }
    }
    // Reset file input
    event.target.value = '';
  };

  // Handle photo description submission
  const handlePhotoDescriptionSubmit = (description) => {
    if (!photoDescriptionModal) return;
    
    const { category, photos, currentIndex } = photoDescriptionModal;
    const updatedPhotos = [...photos];
    updatedPhotos[currentIndex].description = description;
    
    if (currentIndex < photos.length - 1) {
      // Move to next photo
      setPhotoDescriptionModal({
        ...photoDescriptionModal,
        photos: updatedPhotos,
        currentIndex: currentIndex + 1
      });
    } else {
      // All photos have descriptions, add to category
      setImageCategories(prev => ({
        ...prev,
        [category]: {
          photos: [...prev[category].photos, ...updatedPhotos],
          hasPhotos: true
        }
      }));
      setPhotoDescriptionModal(null);
    }
  };

  // Handle photo description edit
  const handleEditPhotoDescription = (category, photoId) => {
    const categoryData = imageCategories[category];
    const photo = categoryData.photos.find(p => p.id === photoId);
    if (photo) {
      setEditingPhoto({
        category,
        photoId,
        description: photo.description
      });
    }
  };

  // Save edited photo description
  const handleSaveEditedDescription = (newDescription) => {
    if (!editingPhoto) return;
    
    const { category, photoId } = editingPhoto;
    setImageCategories(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        photos: prev[category].photos.map(photo =>
          photo.id === photoId 
            ? { ...photo, description: newDescription }
            : photo
        )
      }
    }));
    setEditingPhoto(null);
  };

  // Remove a specific photo
  const removePhoto = (category, photoId) => {
    setImageCategories(prev => {
      const updatedPhotos = prev[category].photos.filter(photo => photo.id !== photoId);
      return {
        ...prev,
        [category]: {
          photos: updatedPhotos,
          hasPhotos: updatedPhotos.length > 0
        }
      };
    });
  };

  // Upload all photos
  const uploadAllImages = async () => {
    if (!reportId) return;

    const formData = new FormData();
    formData.append('report_id', reportId);

    let imageIndex = 0;
    Object.entries(imageCategories).forEach(([category, data]) => {
      if (data.photos.length > 0) {
        data.photos.forEach((photo) => {
          formData.append(`image_${imageIndex}`, photo.file);
          formData.append(`image_${imageIndex}_type`, category);
          formData.append(`image_${imageIndex}_caption`, photo.description || `${imageCategoryInfo[category].label}`);
          formData.append(`image_${imageIndex}_position`, 'equipment_section');
          imageIndex++;
        });
      }
    });

    if (imageIndex > 0) {
      imageUploadMutation.mutate(formData);
    } else {
      toast.error('No images to upload');
    }
  };

  // REMOVED: calculateERP function - no longer needed

  const generateDocuments = () => {
    if (!reportId) return;

    const generationData = {
      formats: reportData.formats, // Only DOCX
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
    { number: 4, name: 'Generate', description: 'Create final document' } // CHANGED: singular
  ];

  const getTotalPhotosSelected = () => {
    return Object.values(imageCategories).reduce((total, cat) => total + cat.photos.length, 0);
  };

  // Photo Description Modal Component
  const PhotoDescriptionModal = () => {
    const [description, setDescription] = useState('');
    
    if (!photoDescriptionModal) return null;
    
    const { category, photos, currentIndex } = photoDescriptionModal;
    const currentPhoto = photos[currentIndex];
    const categoryInfo = imageCategoryInfo[category];
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              Add Description - {categoryInfo.label}
            </h3>
            <div className="text-sm text-gray-500">
              Photo {currentIndex + 1} of {photos.length}
            </div>
          </div>
          
          {/* Photo Preview */}
          <div className="mb-4">
            <img
              src={URL.createObjectURL(currentPhoto.file)}
              alt={currentPhoto.name}
              className="w-full h-48 object-cover rounded border"
            />
            <p className="text-sm text-gray-600 mt-2">File: {currentPhoto.name}</p>
          </div>
          
          {/* Description Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Describe this ${categoryInfo.label.toLowerCase()} photo for the report...`}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This description will appear as a caption in the report
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-between">
            <button
              onClick={() => setPhotoDescriptionModal(null)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel All
            </button>
            
            <button
              onClick={() => handlePhotoDescriptionSubmit(description)}
              disabled={!description.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
            >
              {currentIndex < photos.length - 1 ? 'Next Photo' : 'Add All Photos'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Edit Description Modal Component
  const EditDescriptionModal = () => {
    const [description, setDescription] = useState(editingPhoto?.description || '');
    
    if (!editingPhoto) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">Edit Photo Description</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setEditingPhoto(null)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSaveEditedDescription(description)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
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
      {/* Photo Description Modal */}
      <PhotoDescriptionModal />
      
      {/* Edit Description Modal */}
      <EditDescriptionModal />

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
                  {getTotalPhotosSelected()} photos selected
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">📸 Photography Guidelines</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Take clear, well-lit photos from multiple angles for each equipment category</li>
                    <li>• Include equipment nameplates and serial numbers when visible</li>
                    <li>• You can upload multiple photos per category to show different views</li>
                    <li>• Each photo must have a description that will appear in the report</li>
                    <li>• All photos will be professionally formatted in the final report</li>
                  </ul>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(imageCategoryInfo).map(([category, info]) => {
                  const categoryData = imageCategories[category];
                  
                  return (
                    <div key={category} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{info.icon}</span>
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">
                              {info.label}
                            </h4>
                            <p className="text-xs text-gray-500">{info.description}</p>
                          </div>
                        </div>
                        {categoryData.hasPhotos && (
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-xs text-green-600">{categoryData.photos.length}</span>
                          </div>
                        )}
                      </div>

                      {/* Display uploaded photos */}
                      {categoryData.photos.length > 0 && (
                        <div className="mb-4 space-y-3">
                          {categoryData.photos.map((photo) => (
                            <div key={photo.id} className="border rounded-lg p-3 bg-gray-50">
                              <div className="flex items-center space-x-3">
                                <img
                                  src={URL.createObjectURL(photo.file)}
                                  alt={photo.name}
                                  className="w-16 h-16 object-cover rounded border"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {photo.name}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {photo.description}
                                  </p>
                                </div>
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => handleEditPhotoDescription(category, photo.id)}
                                    className="p-1 text-blue-600 hover:text-blue-800"
                                    title="Edit description"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => removePhoto(category, photo.id)}
                                    className="p-1 text-red-600 hover:text-red-800"
                                    title="Remove photo"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Upload button */}
                      <div className="border-2 border-dashed border-gray-300 rounded p-4 text-center hover:border-gray-400 transition-colors">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => handleCategoryFileSelection(category, e)}
                          className="hidden"
                          id={`upload-${category}`}
                        />
                        <label htmlFor={`upload-${category}`} className="cursor-pointer">
                          <Camera className="mx-auto h-6 w-6 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">
                            {categoryData.photos.length > 0 ? 'Add More Photos' : 'Upload Photos'}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            Multiple photos allowed
                          </p>
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Total photos: {getTotalPhotosSelected()}
                </div>
                
                <div className="flex space-x-3">
                  {getTotalPhotosSelected() > 0 && (
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
                          Upload All Photos ({getTotalPhotosSelected()})
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

      {/* Step 3: Content Review */}
      {generationStep === 3 && (
        <div className="space-y-6">
          {/* ERP Display Section - CHANGED: No calculation, just display */}
          <Card>
            <Card.Header>
              <h3 className="text-lg font-medium">ERP Information</h3>
            </Card.Header>
            <Card.Body>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Equipment Data from Inspection</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">Forward Power:</span>
                      <span className="ml-2 font-medium">{inspection?.amplifier_actual_reading || 'N/A'} W</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Antenna Gain:</span>
                      <span className="ml-2 font-medium">{inspection?.antenna_gain || 'N/A'} dBi</span>
                    </div>
                    <div>
                      <span className="text-blue-700">Frequency:</span>
                      <span className="ml-2 font-medium">{inspection?.transmit_frequency || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Display calculated ERP from inspection */}
                {(inspection?.effective_radiated_power || inspection?.effective_radiated_power_dbw) && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-green-900 mb-2">Calculated ERP (from Inspection)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {inspection?.effective_radiated_power && (
                        <div>
                          <span className="text-green-700">ERP (kW):</span>
                          <span className="ml-2 font-medium">{inspection.effective_radiated_power} kW</span>
                        </div>
                      )}
                      {inspection?.effective_radiated_power_dbw && (
                        <div>
                          <span className="text-green-700">ERP (dBW):</span>
                          <span className="ml-2 font-medium">{inspection.effective_radiated_power_dbw} dBW</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-green-600 mt-2">
                      ✅ ERP values were calculated during the inspection process and will be included in the report.
                    </p>
                  </div>
                )}

                {/* Message if no ERP data */}
                {!inspection?.effective_radiated_power && !inspection?.effective_radiated_power_dbw && (
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <p className="text-sm text-amber-800">
                      ⚠️ No ERP calculations found in the inspection data. The report will include the available equipment specifications.
                    </p>
                  </div>
                )}
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

                {/* Photo Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">📷 Photo Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(imageCategories).map(([category, data]) => {
                      const info = imageCategoryInfo[category];
                      return data.photos.length > 0 && (
                        <div key={category} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">
                            {info.icon} {info.label}
                          </span>
                          <span className="font-medium text-blue-600">
                            {data.photos.length} photo{data.photos.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Total Photos:</span>
                      <span className="text-blue-600">{getTotalPhotosSelected()}</span>
                    </div>
                  </div>
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
            <h3 className="text-lg font-medium">Generate Professional Document</h3>
          </Card.Header>
          <Card.Body>
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-900 mb-2">🎯 Ready for Generation</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Report structure: ✅ Created</li>
                  <li>• Equipment images: ✅ {getTotalPhotosSelected()} photos uploaded</li>
                  <li>• ERP data: ✅ {(inspection?.effective_radiated_power || inspection?.effective_radiated_power_dbw) ? 'Available from inspection' : 'Will use equipment specs'}</li>
                  <li>• Professional formatting: ✅ CA template applied</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Format
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={reportData.formats.includes('docx')}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setReportData(prev => ({
                              ...prev,
                              formats: ['docx']
                            }));
                          } else {
                            setReportData(prev => ({
                              ...prev,
                              formats: []
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">📝 Word Document (DOCX)</span>
                    </label>
                    <p className="text-xs text-gray-500 ml-6">
                      Professional CA inspection report in Microsoft Word format
                    </p>
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
                        <span className="ml-2">Generating Professional Document...</span>
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
                      {reportData.include_images ? getTotalPhotosSelected() : 0} photos
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Document Format:</span>
                    <span className="font-medium">
                      {reportData.formats.length > 0 ? reportData.formats.join(', ').toUpperCase() : 'None selected'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>ERP Data:</span>
                    <span className="font-medium">
                      {(inspection?.effective_radiated_power || inspection?.effective_radiated_power_dbw) ? 'From inspection' : 'Equipment specs'}
                    </span>
                  </div>
                </div>

                {/* Detailed photo breakdown */}
                {reportData.include_images && getTotalPhotosSelected() > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h5 className="text-xs font-medium text-gray-900 mb-2">Photo Breakdown:</h5>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      {Object.entries(imageCategories).map(([category, data]) => {
                        const info = imageCategoryInfo[category];
                        return data.photos.length > 0 && (
                          <div key={category} className="flex justify-between">
                            <span>{info.label}:</span>
                            <span>{data.photos.length}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default EnhancedReportGeneration;