import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  status: 'active' | 'inactive' | 'prospect';
  source?: string;
  tags?: string[];
  notes?: string;
  assignedTo: string;
  lastContact?: string;
  nextFollowUp?: string;
  totalLeads: number;
  convertedLeads: number;
  totalValue: number;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    website?: string;
  };
  customFields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerState {
  customers: Customer[];
  selectedCustomer: Customer | null;
  loading: boolean;
  error: string | null;
  
  // Search and filters
  searchTerm: string;
  filters: {
    status: string;
    assignedTo: string;
    source: string;
    tags: string[];
  };
  
  // Sorting
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  
  // Pagination
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  
  // Statistics
  stats: {
    total: number;
    active: number;
    inactive: number;
    prospects: number;
    totalValue: number;
    averageValue: number;
  };
}

// Initial state
const initialState: CustomerState = {
  customers: [],
  selectedCustomer: null,
  loading: false,
  error: null,
  
  // Search and filters
  searchTerm: '',
  filters: {
    status: '',
    assignedTo: '',
    source: '',
    tags: [],
  },
  
  // Sorting
  sortBy: 'createdAt',
  sortOrder: 'desc',
  
  // Pagination
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  
  // Statistics
  stats: {
    total: 0,
    active: 0,
    inactive: 0,
    prospects: 0,
    totalValue: 0,
    averageValue: 0,
  },
};

// Slice
const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    },
    
    // Customer data
    setCustomers: (state, action: PayloadAction<Customer[]>) => {
      state.customers = action.payload;
      state.loading = false;
      state.error = null;
    },
    
    addCustomer: (state, action: PayloadAction<Customer>) => {
      state.customers.unshift(action.payload);
      state.stats.total += 1;
      
      // Update status counts
      if (action.payload.status === 'active') {
        state.stats.active += 1;
      } else if (action.payload.status === 'inactive') {
        state.stats.inactive += 1;
      } else if (action.payload.status === 'prospect') {
        state.stats.prospects += 1;
      }
    },
    
    updateCustomer: (state, action: PayloadAction<Customer>) => {
      const index = state.customers.findIndex(customer => customer._id === action.payload._id);
      if (index !== -1) {
        const oldCustomer = state.customers[index];
        
        // Update status counts
        if (oldCustomer.status !== action.payload.status) {
          // Decrement old status count
          if (oldCustomer.status === 'active') {
            state.stats.active -= 1;
          } else if (oldCustomer.status === 'inactive') {
            state.stats.inactive -= 1;
          } else if (oldCustomer.status === 'prospect') {
            state.stats.prospects -= 1;
          }
          
          // Increment new status count
          if (action.payload.status === 'active') {
            state.stats.active += 1;
          } else if (action.payload.status === 'inactive') {
            state.stats.inactive += 1;
          } else if (action.payload.status === 'prospect') {
            state.stats.prospects += 1;
          }
        }
        
        state.customers[index] = action.payload;
        
        // Update selected customer if it's the same one
        if (state.selectedCustomer?._id === action.payload._id) {
          state.selectedCustomer = action.payload;
        }
      }
    },
    
    deleteCustomer: (state, action: PayloadAction<string>) => {
      const customer = state.customers.find(c => c._id === action.payload);
      if (customer) {
        // Update stats
        state.stats.total -= 1;
        if (customer.status === 'active') {
          state.stats.active -= 1;
        } else if (customer.status === 'inactive') {
          state.stats.inactive -= 1;
        } else if (customer.status === 'prospect') {
          state.stats.prospects -= 1;
        }
        
        // Remove from array
        state.customers = state.customers.filter(c => c._id !== action.payload);
        
        // Clear selected customer if it's the deleted one
        if (state.selectedCustomer?._id === action.payload) {
          state.selectedCustomer = null;
        }
      }
    },
    
    // Selected customer
    setSelectedCustomer: (state, action: PayloadAction<Customer | null>) => {
      state.selectedCustomer = action.payload;
    },
    
    clearSelectedCustomer: (state) => {
      state.selectedCustomer = null;
    },
    
    // Search and filters
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
      state.pagination.page = 1; // Reset to first page when searching
    },
    
    setFilters: (state, action: PayloadAction<Partial<CustomerState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 1; // Reset to first page when filtering
    },
    
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.searchTerm = '';
      state.pagination.page = 1;
    },
    
    // Sorting
    setSorting: (state, action: PayloadAction<{ sortBy: string; sortOrder: 'asc' | 'desc' }>) => {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
    },
    
    // Pagination
    setPagination: (state, action: PayloadAction<Partial<CustomerState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
    
    setLimit: (state, action: PayloadAction<number>) => {
      state.pagination.limit = action.payload;
      state.pagination.page = 1; // Reset to first page when changing limit
    },
    
    // Statistics
    setStats: (state, action: PayloadAction<CustomerState['stats']>) => {
      state.stats = action.payload;
    },
    
    updateStats: (state, action: PayloadAction<Partial<CustomerState['stats']>>) => {
      state.stats = { ...state.stats, ...action.payload };
    },
    
    // Bulk operations
    bulkUpdateCustomers: (state, action: PayloadAction<{ ids: string[]; updates: Partial<Customer> }>) => {
      const { ids, updates } = action.payload;
      state.customers = state.customers.map(customer => {
        if (ids.includes(customer._id)) {
          return { ...customer, ...updates };
        }
        return customer;
      });
    },
    
    bulkDeleteCustomers: (state, action: PayloadAction<string[]>) => {
      const idsToDelete = action.payload;
      const deletedCustomers = state.customers.filter(c => idsToDelete.includes(c._id));
      
      // Update stats
      deletedCustomers.forEach(customer => {
        state.stats.total -= 1;
        if (customer.status === 'active') {
          state.stats.active -= 1;
        } else if (customer.status === 'inactive') {
          state.stats.inactive -= 1;
        } else if (customer.status === 'prospect') {
          state.stats.prospects -= 1;
        }
      });
      
      // Remove from array
      state.customers = state.customers.filter(c => !idsToDelete.includes(c._id));
      
      // Clear selected customer if it's one of the deleted ones
      if (state.selectedCustomer && idsToDelete.includes(state.selectedCustomer._id)) {
        state.selectedCustomer = null;
      }
    },
    
    // Reset state
    resetCustomerState: () => initialState,
  },
});

// Export actions
export const {
  setLoading,
  setError,
  clearError,
  setCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  setSelectedCustomer,
  clearSelectedCustomer,
  setSearchTerm,
  setFilters,
  clearFilters,
  setSorting,
  setPagination,
  setPage,
  setLimit,
  setStats,
  updateStats,
  bulkUpdateCustomers,
  bulkDeleteCustomers,
  resetCustomerState,
} = customerSlice.actions;

// Selectors
export const selectCustomers = (state: { customers: CustomerState }) => state.customers.customers;
export const selectSelectedCustomer = (state: { customers: CustomerState }) => state.customers.selectedCustomer;
export const selectCustomerLoading = (state: { customers: CustomerState }) => state.customers.loading;
export const selectCustomerError = (state: { customers: CustomerState }) => state.customers.error;
export const selectCustomerSearchTerm = (state: { customers: CustomerState }) => state.customers.searchTerm;
export const selectCustomerFilters = (state: { customers: CustomerState }) => state.customers.filters;
export const selectCustomerSorting = (state: { customers: CustomerState }) => ({
  sortBy: state.customers.sortBy,
  sortOrder: state.customers.sortOrder,
});
export const selectCustomerPagination = (state: { customers: CustomerState }) => state.customers.pagination;
export const selectCustomerStats = (state: { customers: CustomerState }) => state.customers.stats;

// Computed selectors
export const selectFilteredCustomers = (state: { customers: CustomerState }) => {
  const { customers, searchTerm, filters } = state.customers;
  
  return customers.filter(customer => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower) ||
        customer.company?.toLowerCase().includes(searchLower) ||
        customer.phone?.includes(searchTerm);
      
      if (!matchesSearch) return false;
    }
    
    // Status filter
    if (filters.status && customer.status !== filters.status) {
      return false;
    }
    
    // Assigned to filter
    if (filters.assignedTo && customer.assignedTo !== filters.assignedTo) {
      return false;
    }
    
    // Source filter
    if (filters.source && customer.source !== filters.source) {
      return false;
    }
    
    // Tags filter
    if (filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(tag => 
        customer.tags?.includes(tag)
      );
      if (!hasMatchingTag) return false;
    }
    
    return true;
  });
};

// Export reducer
export default customerSlice.reducer;
