import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Auth Store
// REPLACE the useAuthStore section in your src/store/index.js with this:

// In your store/index.js, replace the useAuthStore with this fixed version:

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      setUser: (user, token = null) => {
        // 🔧 FIX: Properly handle token parameter
        let authToken = token;
        
        // If no token provided, try to extract from user object
        if (!authToken && user) {
          authToken = user.token || user.access_token || user.key;
        }
        
        console.log('🔧 Setting user in auth store:', {
          username: user?.username,
          hasToken: !!authToken,
          tokenPreview: authToken ? authToken.substring(0, 10) + '...' : 'none'
        });
        
        set({ 
          user, 
          token: authToken,  // 🔧 Store the token properly
          isAuthenticated: !!user && !!authToken,  // 🔧 Require both user AND token
          error: null 
        });
      },
      
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      
      logout: () => {
        console.log('🚪 Logging out - clearing auth data');
        set({ 
          user: null, 
          token: null,
          isAuthenticated: false, 
          error: null 
        });
        
        // Clear storage
        sessionStorage.removeItem('auth-storage');
        localStorage.removeItem('auth-storage');
      },
      
      // Check if user session is still valid
      checkAuth: async () => {
        const { user, token } = get();
        console.log('🔍 Checking auth state:', {
          hasUser: !!user,
          hasToken: !!token
        });
        
        if (!user || !token) {
          console.log('❌ No user or token found');
          return false;
        }
        
        try {
          // Verify session with backend if needed
          return true;
        } catch (error) {
          console.log('❌ Auth check failed:', error);
          get().logout();
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
// Inspection Form Store
export const useFormStore = create((set, get) => ({
  // Current inspection data
  currentInspection: null,
  formData: {},
  currentStep: 1,
  totalSteps: 4,
  
  // Auto-save status
  autoSaveStatus: 'idle', // 'idle', 'saving', 'saved', 'error'
  lastSaved: null,
  hasUnsavedChanges: false,
  
  // Validation
  validationErrors: {},
  
  // Actions
  setCurrentInspection: (inspection) => set({ currentInspection: inspection }),
  
  setFormData: (data) => set((state) => ({
    formData: { ...state.formData, ...data },
    hasUnsavedChanges: true,
  })),
  
  setCurrentStep: (step) => set({ currentStep: step }),
  
  setAutoSaveStatus: (status) => set({ autoSaveStatus: status }),
  
  setLastSaved: (timestamp) => set({ 
    lastSaved: timestamp,
    hasUnsavedChanges: false,
    autoSaveStatus: 'saved'
  }),
  
  setValidationErrors: (errors) => set({ validationErrors: errors }),
  
  // Calculate completion percentage
  getCompletionPercentage: () => {
    const { currentStep, totalSteps } = get();
    return Math.round((currentStep / totalSteps) * 100);
  },
  
  // Reset form
  resetForm: () => set({
    currentInspection: null,
    formData: {},
    currentStep: 1,
    autoSaveStatus: 'idle',
    lastSaved: null,
    hasUnsavedChanges: false,
    validationErrors: {},
  }),
  
  // Step navigation helpers
  canGoNext: () => {
    const { currentStep, totalSteps } = get();
    return currentStep < totalSteps;
  },
  
  canGoPrevious: () => {
    const { currentStep } = get();
    return currentStep > 1;
  },
  
  goNext: () => {
    const { currentStep, totalSteps } = get();
    if (currentStep < totalSteps) {
      set({ currentStep: currentStep + 1 });
    }
  },
  
  goPrevious: () => {
    const { currentStep } = get();
    if (currentStep > 1) {
      set({ currentStep: currentStep - 1 });
    }
  },
}));

// UI Store for global UI state
export const useUIStore = create((set) => ({
  // Mobile menu
  isMobileMenuOpen: false,
  setMobileMenuOpen: (isOpen) => set({ isMobileMenuOpen: isOpen }),
  
  // Toast notifications
  toasts: [],
  addToast: (toast) => set((state) => ({
    toasts: [...state.toasts, { id: Date.now(), ...toast }]
  })),
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(toast => toast.id !== id)
  })),
  
  // Loading states
  isPageLoading: false,
  setPageLoading: (isLoading) => set({ isPageLoading: isLoading }),
  
  // Modal states
  modals: {},
  openModal: (modalId, data = {}) => set((state) => ({
    modals: { ...state.modals, [modalId]: { isOpen: true, data } }
  })),
  closeModal: (modalId) => set((state) => ({
    modals: { ...state.modals, [modalId]: { isOpen: false, data: {} } }
  })),
  
  // Theme
  isDarkMode: false,
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  
  // Offline status
  isOnline: navigator.onLine,
  setOnlineStatus: (isOnline) => set({ isOnline }),
}));

// Broadcasters cache store
export const useBroadcastersStore = create((set, get) => ({
  broadcasters: [],
  isLoading: false,
  error: null,
  lastFetch: null,
  
  setBroadcasters: (broadcasters) => set({ 
    broadcasters, 
    lastFetch: Date.now(),
    error: null 
  }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  // Add broadcaster to cache
  addBroadcaster: (broadcaster) => set((state) => ({
    broadcasters: [...state.broadcasters, broadcaster]
  })),
  
  // Update broadcaster in cache
  updateBroadcaster: (id, updatedData) => set((state) => ({
    broadcasters: state.broadcasters.map(b => 
      b.id === id ? { ...b, ...updatedData } : b
    )
  })),
  
  // Check if cache is stale (older than 5 minutes)
  isCacheStale: () => {
    const { lastFetch } = get();
    if (!lastFetch) return true;
    return Date.now() - lastFetch > 5 * 60 * 1000;
  },
}));

// Add this to your existing src/store/index.js file

// Reports Store
export const useReportsStore = create((set, get) => ({
  // Current report data
  currentReport: null,
  reportsList: [],
  isLoading: false,
  error: null,
  
  // Report generation state
  generationStatus: 'idle', // 'idle', 'generating', 'completed', 'error'
  generatedFiles: {},
  
  // Image upload state
  uploadingImages: false,
  uploadProgress: 0,
  
  // ERP calculations
  erpCalculations: [],
  calculationResults: {},
  
  // Filters and search
  filters: {
    status: '',
    reportType: '',
    dateRange: null,
    broadcaster: '',
  },
  searchTerm: '',
  
  // Actions
  setCurrentReport: (report) => set({ currentReport: report }),
  
  setReportsList: (reports) => set({ reportsList: reports }),
  
  addReport: (report) => set((state) => ({
    reportsList: [report, ...state.reportsList]
  })),
  
  updateReport: (reportId, updatedData) => set((state) => ({
    reportsList: state.reportsList.map(report =>
      report.id === reportId ? { ...report, ...updatedData } : report
    ),
    currentReport: state.currentReport?.id === reportId 
      ? { ...state.currentReport, ...updatedData }
      : state.currentReport
  })),
  
  removeReport: (reportId) => set((state) => ({
    reportsList: state.reportsList.filter(report => report.id !== reportId),
    currentReport: state.currentReport?.id === reportId ? null : state.currentReport
  })),
  
  // Loading states
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  // Generation status
  setGenerationStatus: (status) => set({ generationStatus: status }),
  setGeneratedFiles: (files) => set({ generatedFiles: files }),
  
  // Image upload
  setUploadingImages: (uploading) => set({ uploadingImages: uploading }),
  setUploadProgress: (progress) => set({ uploadProgress: progress }),
  
  // ERP calculations
  setErpCalculations: (calculations) => set({ erpCalculations: calculations }),
  
  addErpCalculation: (calculation) => set((state) => ({
    erpCalculations: [...state.erpCalculations, calculation]
  })),
  
  updateErpCalculation: (calcId, updatedCalc) => set((state) => ({
    erpCalculations: state.erpCalculations.map(calc =>
      calc.id === calcId ? { ...calc, ...updatedCalc } : calc
    )
  })),
  
  removeErpCalculation: (calcId) => set((state) => ({
    erpCalculations: state.erpCalculations.filter(calc => calc.id !== calcId)
  })),
  
  setCalculationResults: (calcId, results) => set((state) => ({
    calculationResults: { ...state.calculationResults, [calcId]: results }
  })),
  
  // Filters and search
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),
  
  setSearchTerm: (term) => set({ searchTerm: term }),
  
  clearFilters: () => set({
    filters: {
      status: '',
      reportType: '',
      dateRange: null,
      broadcaster: '',
    },
    searchTerm: ''
  }),
  
  // Computed getters
  getFilteredReports: () => {
    const { reportsList, filters, searchTerm } = get();
    
    return reportsList.filter(report => {
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
      
      // Broadcaster filter
      if (filters.broadcaster) {
        const broadcasterLower = filters.broadcaster.toLowerCase();
        if (!report.broadcaster_name?.toLowerCase().includes(broadcasterLower)) {
          return false;
        }
      }
      
      // Date range filter
      if (filters.dateRange) {
        const reportDate = new Date(report.date_created);
        const { start, end } = filters.dateRange;
        if (start && reportDate < new Date(start)) return false;
        if (end && reportDate > new Date(end)) return false;
      }
      
      return true;
    });
  },
  
  // Statistics
  getReportsStats: () => {
    const { reportsList } = get();
    
    return {
      total: reportsList.length,
      draft: reportsList.filter(r => r.status === 'draft').length,
      completed: reportsList.filter(r => r.status === 'completed').length,
      pending: reportsList.filter(r => r.status === 'pending_review').length,
      compliant: reportsList.filter(r => r.compliance_status === 'compliant').length,
      violations: reportsList.filter(r => r.compliance_status !== 'compliant').length,
    };
  },
  
  // Reset store
  reset: () => set({
    currentReport: null,
    reportsList: [],
    isLoading: false,
    error: null,
    generationStatus: 'idle',
    generatedFiles: {},
    uploadingImages: false,
    uploadProgress: 0,
    erpCalculations: [],
    calculationResults: {},
    filters: {
      status: '',
      reportType: '',
      dateRange: null,
      broadcaster: '',
    },
    searchTerm: '',
  }),
}));