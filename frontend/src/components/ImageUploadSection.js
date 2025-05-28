// components/ImageUploadSection.js - NEW FILE
import React, { useState } from 'react';
import { Camera, X, CheckCircle, AlertCircle } from 'lucide-react';

const ImageUploadSection = ({ 
  category, 
  categoryInfo, 
  isRequired, 
  files, 
  onFilesChange,
  onNoImageClick 
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [previewUrls, setPreviewUrls] = useState([]);

  const handleFileSelect = (selectedFiles) => {
    const fileArray = Array.from(selectedFiles);
    
    // Validate files
    const validFiles = fileArray.filter(file => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        return false;
      }
      
      // Check file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        return false;
      }
      
      return true;
    });

    if (validFiles.length > 0) {
      onFilesChange(validFiles);
      
      // Create preview URLs
      const urls = validFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(urls);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles);
  };

  const handleFileInput = (e) => {
    handleFileSelect(e.target.files);
  };

  const removeFiles = () => {
    onFilesChange([]);
    setPreviewUrls([]);
    
    // Cleanup object URLs
    previewUrls.forEach(url => URL.revokeObjectURL(url));
  };

  const handleNoImage = () => {
    removeFiles();
    onNoImageClick();
  };

  return (
    <div className={`border rounded-lg p-4 transition-colors ${
      isRequired 
        ? files.length > 0 
          ? 'border-green-200 bg-green-50' 
          : 'border-orange-200 bg-orange-50'
        : 'border-gray-200 bg-gray-50'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{categoryInfo.icon}</span>
          <div>
            <h4 className="text-sm font-medium text-gray-900">
              {categoryInfo.label}
              {isRequired && <span className="text-red-500 ml-1">*</span>}
            </h4>
            <p className="text-xs text-gray-500">{categoryInfo.description}</p>
          </div>
        </div>
        
        {/* Status indicator */}
        {files.length > 0 ? (
          <CheckCircle className="w-5 h-5 text-green-500" />
        ) : isRequired ? (
          <AlertCircle className="w-5 h-5 text-orange-500" />
        ) : null}
      </div>

      {/* Content */}
      {files.length > 0 ? (
        // Show uploaded images
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {files.map((file, index) => (
              <div key={index} className="relative group">
                <img
                  src={previewUrls[index]}
                  alt={file.name}
                  className="w-full h-20 object-cover rounded border"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded">
                  <button
                    onClick={removeFiles}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
                <p className="text-xs text-gray-400">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-green-600 font-medium">
              ✓ {files.length} image{files.length > 1 ? 's' : ''} ready
            </span>
            <button
              onClick={removeFiles}
              className="text-xs text-red-600 hover:text-red-800 underline"
            >
              Remove All
            </button>
          </div>
        </div>
      ) : (
        // Show upload interface
        <div className="space-y-3">
          {/* Drag and drop area */}
          <div
            className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer ${
              dragOver 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => document.getElementById(`upload-${category}`)?.click()}
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
              id={`upload-${category}`}
            />
            
            <Camera className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <div className="text-sm text-gray-600">
              <span className="font-medium text-blue-600">Click to upload</span>
              {' '}or drag and drop
            </div>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, GIF up to 10MB each
            </p>
            
            {dragOver && (
              <div className="absolute inset-0 bg-blue-50 bg-opacity-75 flex items-center justify-center rounded-lg">
                <p className="text-blue-600 font-medium">Drop images here</p>
              </div>
            )}
          </div>
          
          {/* No image option */}
          <button
            onClick={handleNoImage}
            className="w-full text-xs text-gray-500 hover:text-gray-700 border border-gray-300 hover:border-gray-400 rounded px-3 py-2 transition-colors"
          >
            ❌ No Image Available
          </button>
          
          {/* Help text for required fields */}
          {isRequired && (
            <p className="text-xs text-orange-600">
              ⚠️ This image is required for the inspection report
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUploadSection;