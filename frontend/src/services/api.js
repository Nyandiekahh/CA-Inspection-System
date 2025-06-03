// services/api.js - COMPLETE ENHANCED VERSION
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to get auth token - ENHANCED VERSION
const getAuthToken = () => {
  // Try to get token from session storage first
  const sessionAuth = sessionStorage.getItem('auth-storage');
  if (sessionAuth) {
    try {
      const authData = JSON.parse(sessionAuth);
      const token = authData.state?.token;
      if (token) {
        console.log('🔑 Found token in sessionStorage:', token.substring(0, 10) + '...');
        return token;
      }
    } catch (e) {
      console.log('⚠️ Error parsing sessionStorage auth data:', e);
    }
  }
  
  // Try localStorage as fallback
  const localAuth = localStorage.getItem('auth-storage');
  if (localAuth) {
    try {
      const authData = JSON.parse(localAuth);
      const token = authData.state?.token;
      if (token) {
        console.log('🔑 Found token in localStorage:', token.substring(0, 10) + '...');
        return token;
      }
    } catch (e) {
      console.log('⚠️ Error parsing localStorage auth data:', e);
    }
  }
  
  console.log('❌ No authentication token found in storage');
  return null;
};

// Request interceptor - ENHANCED VERSION
api.interceptors.request.use(
  (config) => {
    console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    
    // Get token and add to headers
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Token ${token}`;
      console.log(`🔐 Added Authorization header with token: ${token.substring(0, 10)}...`);
    } else {
      console.log('⚠️ No authentication token found');
    }
    
    return config;
  },
  (error) => {
    console.error('❌ API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', error.response?.data || error.message);
    
    // Handle 401/403 authentication errors
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.log('🔓 Authentication failed - clearing stored auth data');
      sessionStorage.removeItem('auth-storage');
      localStorage.removeItem('auth-storage');
      // Don't redirect automatically, let the app handle it
    }
    
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  logout: () => api.post('/auth/logout/'),
  getCurrentUser: () => api.get('/auth/me/'),
  updateProfile: (data) => api.put('/auth/me/', data),
};

// Broadcasters API
export const broadcastersAPI = {
  getAll: () => api.get('/broadcasters/broadcasters/'),
  getById: (id) => api.get(`/broadcasters/broadcasters/${id}/`),
  create: (data) => api.post('/broadcasters/broadcasters/', data),
  update: (id, data) => api.put(`/broadcasters/broadcasters/${id}/`, data),
  delete: (id) => api.delete(`/broadcasters/broadcasters/${id}/`),
};

// Programs API - NEW
export const programsAPI = {
  getAll: () => api.get('/broadcasters/programs/'),
  getById: (id) => api.get(`/broadcasters/programs/${id}/`),
  create: (data) => api.post('/broadcasters/programs/', data),
  update: (id, data) => api.put(`/broadcasters/programs/${id}/`, data),
  delete: (id) => api.delete(`/broadcasters/programs/${id}/`),
  
  // Program-Broadcaster relationship endpoints
  getBroadcasters: (id) => api.get(`/broadcasters/programs/${id}/broadcasters/`),
  addBroadcaster: (id, broadcasterData) => api.post(`/broadcasters/programs/${id}/add_broadcaster/`, broadcasterData),
  removeBroadcaster: (id, broadcasterData) => api.post(`/broadcasters/programs/${id}/remove_broadcaster/`, broadcasterData),
  
  // Search programs by name
  search: (query) => api.get('/broadcasters/programs/', { params: { search: query } }),
};

// General Data API  
export const generalDataAPI = {
  getAll: () => api.get('/broadcasters/general-data/'),
  getById: (id) => api.get(`/broadcasters/general-data/${id}/`),
  create: (data) => api.post('/broadcasters/general-data/', data),
  update: (id, data) => api.put(`/broadcasters/general-data/${id}/`, data),
  delete: (id) => api.delete(`/broadcasters/general-data/${id}/`),
};

// Towers API
export const towersAPI = {
  getAll: () => api.get('/towers/towers/'),
  getById: (id) => api.get(`/towers/towers/${id}/`),
  create: (data) => api.post('/towers/towers/', data),
  update: (id, data) => api.put(`/towers/towers/${id}/`, data),
  delete: (id) => api.delete(`/towers/towers/${id}/`),
};

// Transmitters API
export const transmittersAPI = {
  // Exciters
  getAllExciters: () => api.get('/transmitters/exciters/'),
  createExciter: (data) => api.post('/transmitters/exciters/', data),
  updateExciter: (id, data) => api.put(`/transmitters/exciters/${id}/`, data),
  
  // Amplifiers
  getAllAmplifiers: () => api.get('/transmitters/amplifiers/'),
  createAmplifier: (data) => api.post('/transmitters/amplifiers/', data),
  updateAmplifier: (id, data) => api.put(`/transmitters/amplifiers/${id}/`, data),
  
  // Filters
  getAllFilters: () => api.get('/transmitters/filters/'),
  createFilter: (data) => api.post('/transmitters/filters/', data),
  updateFilter: (id, data) => api.put(`/transmitters/filters/${id}/`, data),
  
  // Studio Links
  getAllStudioLinks: () => api.get('/transmitters/studio-links/'),
  createStudioLink: (data) => api.post('/transmitters/studio-links/', data),
  updateStudioLink: (id, data) => api.put(`/transmitters/studio-links/${id}/`, data),
};

// Antennas API
export const antennasAPI = {
  getAll: () => api.get('/antennas/antenna-systems/'),
  getById: (id) => api.get(`/antennas/antenna-systems/${id}/`),
  create: (data) => api.post('/antennas/antenna-systems/', data),
  update: (id, data) => api.put(`/antennas/antenna-systems/${id}/`, data),
  delete: (id) => api.delete(`/antennas/antenna-systems/${id}/`),
};

// Inspections API
export const inspectionsAPI = {
  getAll: () => api.get('/inspections/inspections/'),
  getById: (id) => api.get(`/inspections/inspections/${id}/`),
  create: (data) => api.post('/inspections/inspections/', data),
  update: (id, data) => api.put(`/inspections/inspections/${id}/`, data),
  delete: (id) => api.delete(`/inspections/inspections/${id}/`),
  autoSave: (id, data) => api.post(`/inspections/inspections/${id}/auto-save/`, data),
};

// Updated reportsAPI section - DOCX Only & No ERP Calculation
export const reportsAPI = {
  // Main reports management
  getAll: (params = {}) => api.get('/reports/reports/', { params }),
  getById: (id) => api.get(`/reports/reports/${id}/`),
  create: (data) => api.post('/reports/reports/', data),
  update: (id, data) => api.put(`/reports/reports/${id}/`, data),
  delete: (id) => api.delete(`/reports/reports/${id}/`),
  
  // Report creation from inspection
  createFromInspection: (inspectionId) => 
    api.post(`/reports/create-from-inspection/${inspectionId}/`),
  
  // Professional document generation - DOCX ONLY
  generateDocuments: (reportId, data) => 
    api.post(`/reports/reports/${reportId}/generate_documents/`, {
      ...data,
      formats: ['docx'], // FORCE DOCX ONLY
      professional_formatting: true,
      ca_template: true
    }),
  
  // REMOVED: downloadPDF function
  
  // Enhanced DOCX download with proper file naming
  downloadDOCX: (reportId, referenceNumber) => 
    api.get(`/reports/reports/${reportId}/download_docx/`, { 
      responseType: 'blob',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }
    }).then(response => {
      // Create download link with proper filename
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${referenceNumber?.replace(/\//g, '_') || 'report'}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return response;
    }),
  
  // Enhanced preview and analysis
  getPreviewData: (reportId) => 
    api.get(`/reports/reports/${reportId}/preview_data/`),
  
  getEnhancedPreviewData: (reportId) => 
    api.get(`/reports/reports/${reportId}/enhanced_preview_data/`),
  
  analyzeViolations: (reportId) => 
    api.post(`/reports/reports/${reportId}/analyze_violations/`),
  
  // Enhanced image management with categories
  uploadImages: (formData) => 
    api.post('/reports/images/bulk_upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        console.log(`Upload progress: ${percentCompleted}%`);
      }
    }),
  
  // Category-based image upload with enhanced validation
  uploadCategorizedImages: (formData) => 
    api.post('/reports/images/bulk_upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000, // 60 second timeout for large uploads
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        // Emit progress event for UI updates
        if (window.uploadProgressCallback) {
          window.uploadProgressCallback(percentCompleted);
        }
        console.log(`📸 Image upload progress: ${percentCompleted}%`);
      }
    }),
  
  getImages: (reportId) => 
    api.get('/reports/images/', { params: { report: reportId } }),
  
  getImageRequirements: (reportId) => 
    api.get(`/reports/reports/${reportId}/image_requirements/`),
  
  updateImagePosition: (imageId, data) => 
    api.post(`/reports/images/${imageId}/update_position/`, data),
  
  deleteImage: (imageId) => 
    api.delete(`/reports/images/${imageId}/`),
  
  // REMOVED: All ERP calculation endpoints
  // - calculateERP
  // - bulkCalculateERP
  // - getERPCalculations
  // - updateERPCalculation
  // - deleteERPCalculation
  
  // Templates and validation
  getTemplates: () => 
    api.get('/reports/templates/'),
  
  validateReportData: (data) => 
    api.post('/reports/validate/', data),
  
  // Advanced report features - UPDATED FOR DOCX ONLY
  generateProfessionalReport: (reportId, options = {}) => 
    api.post(`/reports/reports/${reportId}/generate_documents/`, {
      formats: ['docx'], // FORCE DOCX ONLY
      include_images: options.include_images !== false,
      professional_formatting: true,
      ca_template: true,
      custom_observations: options.observations || '',
      custom_conclusions: options.conclusions || '',
      custom_recommendations: options.recommendations || '',
      ...options
    }),
  
  // Batch operations
  bulkDelete: (reportIds) => 
    api.post('/reports/reports/bulk_delete/', { report_ids: reportIds }),
  
  bulkExport: (reportIds, format = 'docx') => // CHANGED: default to docx
    api.post('/reports/reports/bulk_export/', { 
      report_ids: reportIds, 
      format: format 
    }, { responseType: 'blob' }),
  
  // Report sharing and collaboration
  shareReport: (reportId, shareData) => 
    api.post(`/reports/reports/${reportId}/share/`, shareData),
  
  getSharedReports: () => 
    api.get('/reports/reports/shared/'),
  
  // Report versioning
  getVersionHistory: (reportId) => 
    api.get(`/reports/reports/${reportId}/versions/`),
  
  revertToVersion: (reportId, versionId) => 
    api.post(`/reports/reports/${reportId}/revert/${versionId}/`),
  
  // Report statistics and analytics
  getReportStats: (reportId) => 
    api.get(`/reports/reports/${reportId}/stats/`),
  
  getDashboardStats: (params = {}) => 
    api.get('/reports/reports/dashboard_stats/', { params }),
  
  // Advanced search and filtering
  searchReports: (query, filters = {}) => 
    api.get('/reports/reports/search/', { 
      params: { q: query, ...filters } 
    }),
  
  getReportsByDateRange: (startDate, endDate) => 
    api.get('/reports/reports/', { 
      params: { 
        created_after: startDate, 
        created_before: endDate 
      } 
    }),
  
  getReportsByBroadcaster: (broadcasterId) => 
    api.get('/reports/reports/', { 
      params: { broadcaster: broadcasterId } 
    }),
  
  getReportsByInspector: (inspectorId) => 
    api.get('/reports/reports/', { 
      params: { inspector: inspectorId } 
    }),
  
  // Quality assurance and review
  submitForReview: (reportId) => 
    api.post(`/reports/reports/${reportId}/submit_for_review/`),
  
  approveReport: (reportId, approvalData) => 
    api.post(`/reports/reports/${reportId}/approve/`, approvalData),
  
  rejectReport: (reportId, rejectionData) => 
    api.post(`/reports/reports/${reportId}/reject/`, rejectionData),
  
  addReviewComment: (reportId, comment) => 
    api.post(`/reports/reports/${reportId}/comments/`, { comment }),
  
  getReviewComments: (reportId) => 
    api.get(`/reports/reports/${reportId}/comments/`),
  
  // Integration and webhooks
  triggerWebhook: (reportId, webhookType) => 
    api.post(`/reports/reports/${reportId}/webhook/${webhookType}/`),
  
  exportToExternalSystem: (reportId, systemType, config) => 
    api.post(`/reports/reports/${reportId}/export/${systemType}/`, config),
};

// Audit API
export const auditAPI = {
  getLogs: (params = {}) => api.get('/audit/audit-logs/', { params }),
  getRevisions: (inspectionId) => api.get(`/audit/revisions/?inspection=${inspectionId}`),
  getReportAuditTrail: (reportId) => api.get(`/audit/reports/${reportId}/trail/`),
  getUserActivity: (userId, dateRange) => api.get(`/audit/users/${userId}/activity/`, { 
    params: dateRange 
  }),
  getSystemEvents: (params = {}) => api.get('/audit/system-events/', { params }),
};

// Notification API
export const notificationAPI = {
  getNotifications: (params = {}) => api.get('/notifications/', { params }),
  markAsRead: (notificationId) => api.patch(`/notifications/${notificationId}/`, { read: true }),
  markAllAsRead: () => api.post('/notifications/mark_all_read/'),
  deleteNotification: (notificationId) => api.delete(`/notifications/${notificationId}/`),
  getUnreadCount: () => api.get('/notifications/unread_count/'),
  
  // Notification preferences
  getPreferences: () => api.get('/notifications/preferences/'),
  updatePreferences: (preferences) => api.put('/notifications/preferences/', preferences),
};

// System API for admin functions
export const systemAPI = {
  getSystemHealth: () => api.get('/system/health/'),
  getSystemStats: () => api.get('/system/stats/'),
  getActiveUsers: () => api.get('/system/active_users/'),
  getDiskUsage: () => api.get('/system/disk_usage/'),
  getErrorLogs: (params = {}) => api.get('/system/error_logs/', { params }),
  
  // Backup and maintenance
  initiateBackup: () => api.post('/system/backup/'),
  getBackupHistory: () => api.get('/system/backup/history/'),
  restoreFromBackup: (backupId) => api.post(`/system/backup/${backupId}/restore/`),
  
  // Cache management
  clearCache: (cacheType = 'all') => api.post('/system/cache/clear/', { type: cacheType }),
  getCacheStats: () => api.get('/system/cache/stats/'),
};

// Helper functions for common operations
export const apiHelpers = {
  // Upload progress tracking
  setUploadProgressCallback: (callback) => {
    window.uploadProgressCallback = callback;
  },
  
  // Error handling
  handleApiError: (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return `Bad Request: ${data.error || 'Invalid data provided'}`;
        case 401:
          return 'Authentication required. Please log in again.';
        case 403:
          return 'Access denied. You do not have permission for this action.';
        case 404:
          return 'Resource not found.';
        case 429:
          return 'Too many requests. Please try again later.';
        case 500:
          return 'Server error. Please try again later.';
        default:
          return data.error || `HTTP ${status} error occurred`;
      }
    } else if (error.request) {
      // Network error
      return 'Network error. Please check your connection and try again.';
    } else {
      // Other error
      return error.message || 'An unexpected error occurred.';
    }
  },
  
  // File download helpers
  downloadFile: (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
  
  // Format file size
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
  
  // Validate image file
  validateImageFile: (file, maxSize = 10 * 1024 * 1024) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Invalid file type. Only JPEG, PNG, and GIF are allowed.' };
    }
    
    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: `File size exceeds ${apiHelpers.formatFileSize(maxSize)} limit.` 
      };
    }
    
    return { valid: true };
  },
  
  // Create FormData for file uploads
  createImageFormData: (reportId, images) => {
    const formData = new FormData();
    formData.append('report_id', reportId);
    
    images.forEach((imageData, index) => {
      const { file, type, caption, position } = imageData;
      formData.append(`image_${index}`, file);
      formData.append(`image_${index}_type`, type);
      formData.append(`image_${index}_caption`, caption || file.name.split('.')[0]);
      formData.append(`image_${index}_position`, position || 'equipment_section');
    });
    
    return formData;
  }
};

// Export the main API instance and all APIs
export default api;