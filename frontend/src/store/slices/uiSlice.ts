import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface UIState {
  // Layout
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  
  // Theme
  darkMode: boolean;
  
  // Loading states
  globalLoading: boolean;
  
  // Modals and overlays
  modals: {
    customerForm: boolean;
    leadForm: boolean;
    deleteConfirmation: boolean;
    profileSettings: boolean;
  };
  
  // Toast notifications
  toasts: {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: number;
  }[];
  
  // Page-specific UI state
  filters: {
    customers: {
      search: string;
      status: string;
      sortBy: string;
      sortOrder: 'asc' | 'desc';
    };
    leads: {
      search: string;
      status: string;
      priority: string;
      assignedTo: string;
      sortBy: string;
      sortOrder: 'asc' | 'desc';
    };
  };
  
  // Pagination
  pagination: {
    customers: {
      page: number;
      limit: number;
      total: number;
    };
    leads: {
      page: number;
      limit: number;
      total: number;
    };
  };
  
  // View preferences
  viewMode: {
    customers: 'grid' | 'list' | 'table';
    leads: 'grid' | 'list' | 'table';
  };
}

// Initial state
const initialState: UIState = {
  // Layout
  sidebarOpen: true,
  sidebarCollapsed: false,
  
  // Theme
  darkMode: false,
  
  // Loading
  globalLoading: false,
  
  // Modals
  modals: {
    customerForm: false,
    leadForm: false,
    deleteConfirmation: false,
    profileSettings: false,
  },
  
  // Toasts
  toasts: [],
  
  // Filters
  filters: {
    customers: {
      search: '',
      status: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
    leads: {
      search: '',
      status: '',
      priority: '',
      assignedTo: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
  },
  
  // Pagination
  pagination: {
    customers: {
      page: 1,
      limit: 10,
      total: 0,
    },
    leads: {
      page: 1,
      limit: 10,
      total: 0,
    },
  },
  
  // View mode
  viewMode: {
    customers: 'table',
    leads: 'table',
  },
};

// Helper functions
const generateToastId = () => Date.now().toString();

// Slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Layout actions
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    
    toggleSidebarCollapsed: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    
    // Theme actions
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('darkMode', state.darkMode.toString());
    },
    
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
      localStorage.setItem('darkMode', action.payload.toString());
    },
    
    initializeTheme: (state) => {
      const savedTheme = localStorage.getItem('darkMode');
      if (savedTheme !== null) {
        state.darkMode = savedTheme === 'true';
      } else {
        // Check system preference
        state.darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
    },
    
    // Loading actions
    setGlobalLoading: (state, action: PayloadAction<boolean>) => {
      state.globalLoading = action.payload;
    },
    
    // Modal actions
    openModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = true;
    },
    
    closeModal: (state, action: PayloadAction<keyof UIState['modals']>) => {
      state.modals[action.payload] = false;
    },
    
    closeAllModals: (state) => {
      Object.keys(state.modals).forEach((key) => {
        state.modals[key as keyof UIState['modals']] = false;
      });
    },
    
    // Toast actions
    addToast: (state, action: PayloadAction<{
      type: 'success' | 'error' | 'warning' | 'info';
      message: string;
    }>) => {
      const toast = {
        id: generateToastId(),
        type: action.payload.type,
        message: action.payload.message,
        timestamp: Date.now(),
      };
      state.toasts.push(toast);
    },
    
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
    },
    
    clearAllToasts: (state) => {
      state.toasts = [];
    },
    
    // Filter actions
    setCustomerFilter: (state, action: PayloadAction<Partial<UIState['filters']['customers']>>) => {
      state.filters.customers = { ...state.filters.customers, ...action.payload };
    },
    
    setLeadFilter: (state, action: PayloadAction<Partial<UIState['filters']['leads']>>) => {
      state.filters.leads = { ...state.filters.leads, ...action.payload };
    },
    
    resetCustomerFilters: (state) => {
      state.filters.customers = initialState.filters.customers;
    },
    
    resetLeadFilters: (state) => {
      state.filters.leads = initialState.filters.leads;
    },
    
    // Pagination actions
    setCustomerPagination: (state, action: PayloadAction<Partial<UIState['pagination']['customers']>>) => {
      state.pagination.customers = { ...state.pagination.customers, ...action.payload };
    },
    
    setLeadPagination: (state, action: PayloadAction<Partial<UIState['pagination']['leads']>>) => {
      state.pagination.leads = { ...state.pagination.leads, ...action.payload };
    },
    
    // View mode actions
    setCustomerViewMode: (state, action: PayloadAction<'grid' | 'list' | 'table'>) => {
      state.viewMode.customers = action.payload;
      localStorage.setItem('customerViewMode', action.payload);
    },
    
    setLeadViewMode: (state, action: PayloadAction<'grid' | 'list' | 'table'>) => {
      state.viewMode.leads = action.payload;
      localStorage.setItem('leadViewMode', action.payload);
    },
    
    initializeViewModes: (state) => {
      const customerViewMode = localStorage.getItem('customerViewMode') as 'grid' | 'list' | 'table';
      const leadViewMode = localStorage.getItem('leadViewMode') as 'grid' | 'list' | 'table';
      
      if (customerViewMode) {
        state.viewMode.customers = customerViewMode;
      }
      
      if (leadViewMode) {
        state.viewMode.leads = leadViewMode;
      }
    },
  },
});

// Export actions
export const {
  toggleSidebar,
  setSidebarOpen,
  toggleSidebarCollapsed,
  setSidebarCollapsed,
  toggleDarkMode,
  setDarkMode,
  initializeTheme,
  setGlobalLoading,
  openModal,
  closeModal,
  closeAllModals,
  addToast,
  removeToast,
  clearAllToasts,
  setCustomerFilter,
  setLeadFilter,
  resetCustomerFilters,
  resetLeadFilters,
  setCustomerPagination,
  setLeadPagination,
  setCustomerViewMode,
  setLeadViewMode,
  initializeViewModes,
} = uiSlice.actions;

// Selectors
export const selectUI = (state: { ui: UIState }) => state.ui;
export const selectSidebarState = (state: { ui: UIState }) => ({
  open: state.ui.sidebarOpen,
  collapsed: state.ui.sidebarCollapsed,
});
export const selectDarkMode = (state: { ui: UIState }) => state.ui.darkMode;
export const selectGlobalLoading = (state: { ui: UIState }) => state.ui.globalLoading;
export const selectModals = (state: { ui: UIState }) => state.ui.modals;
export const selectToasts = (state: { ui: UIState }) => state.ui.toasts;
export const selectCustomerFilters = (state: { ui: UIState }) => state.ui.filters.customers;
export const selectLeadFilters = (state: { ui: UIState }) => state.ui.filters.leads;
export const selectCustomerPagination = (state: { ui: UIState }) => state.ui.pagination.customers;
export const selectLeadPagination = (state: { ui: UIState }) => state.ui.pagination.leads;
export const selectViewModes = (state: { ui: UIState }) => state.ui.viewMode;

// Export reducer
export default uiSlice.reducer;
