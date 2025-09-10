import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface Lead {
  _id: string;
  title: string;
  description?: string;
  customer: string | {
    _id: string;
    name: string;
    email: string;
    company?: string;
  };
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'converted' | 'lost';
  priority: 'low' | 'medium' | 'high';
  value: number;
  expectedCloseDate?: string;
  source?: string;
  assignedTo: string | {
    _id: string;
    name: string;
    email: string;
  };
  tags?: string[];
  customFields?: Record<string, any>;
  activities: {
    _id: string;
    type: 'call' | 'email' | 'meeting' | 'note' | 'task';
    description: string;
    date: string;
    completed?: boolean;
    createdBy: string;
    createdAt: string;
  }[];
  attachments?: {
    _id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: string;
    uploadedBy: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface LeadState {
  leads: Lead[];
  selectedLead: Lead | null;
  loading: boolean;
  error: string | null;
  
  // Search and filters
  searchTerm: string;
  filters: {
    status: string;
    priority: string;
    assignedTo: string;
    source: string;
    tags: string[];
    dateRange: {
      start?: string;
      end?: string;
    };
    valueRange: {
      min?: number;
      max?: number;
    };
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
    new: number;
    contacted: number;
    qualified: number;
    proposal: number;
    negotiation: number;
    converted: number;
    lost: number;
    totalValue: number;
    averageValue: number;
    conversionRate: number;
    avgDaysToClose: number;
  };
  
  // Pipeline view
  pipeline: {
    [key: string]: Lead[];
  };
}

// Initial state
const initialState: LeadState = {
  leads: [],
  selectedLead: null,
  loading: false,
  error: null,
  
  // Search and filters
  searchTerm: '',
  filters: {
    status: '',
    priority: '',
    assignedTo: '',
    source: '',
    tags: [],
    dateRange: {},
    valueRange: {},
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
    new: 0,
    contacted: 0,
    qualified: 0,
    proposal: 0,
    negotiation: 0,
    converted: 0,
    lost: 0,
    totalValue: 0,
    averageValue: 0,
    conversionRate: 0,
    avgDaysToClose: 0,
  },
  
  // Pipeline
  pipeline: {},
};

// Helper functions
const updateStatsForLead = (stats: LeadState['stats'], lead: Lead, operation: 'add' | 'remove' | 'update', oldStatus?: string) => {
  if (operation === 'add') {
    stats.total += 1;
    stats.totalValue += lead.value;
    stats[lead.status] += 1;
  } else if (operation === 'remove') {
    stats.total -= 1;
    stats.totalValue -= lead.value;
    stats[lead.status] -= 1;
  } else if (operation === 'update' && oldStatus && oldStatus !== lead.status) {
    stats[oldStatus as keyof typeof stats] -= 1;
    stats[lead.status] += 1;
  }
  
  // Recalculate averages
  stats.averageValue = stats.total > 0 ? stats.totalValue / stats.total : 0;
  stats.conversionRate = stats.total > 0 ? (stats.converted / stats.total) * 100 : 0;
};

// Slice
const leadSlice = createSlice({
  name: 'leads',
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
    
    // Lead data
    setLeads: (state, action: PayloadAction<Lead[]>) => {
      state.leads = action.payload;
      state.loading = false;
      state.error = null;
    },
    
    addLead: (state, action: PayloadAction<Lead>) => {
      state.leads.unshift(action.payload);
      updateStatsForLead(state.stats, action.payload, 'add');
    },
    
    updateLead: (state, action: PayloadAction<Lead>) => {
      const index = state.leads.findIndex(lead => lead._id === action.payload._id);
      if (index !== -1) {
        const oldLead = state.leads[index];
        updateStatsForLead(state.stats, action.payload, 'update', oldLead.status);
        
        state.leads[index] = action.payload;
        
        // Update selected lead if it's the same one
        if (state.selectedLead?._id === action.payload._id) {
          state.selectedLead = action.payload;
        }
      }
    },
    
    deleteLead: (state, action: PayloadAction<string>) => {
      const lead = state.leads.find(l => l._id === action.payload);
      if (lead) {
        updateStatsForLead(state.stats, lead, 'remove');
        
        // Remove from array
        state.leads = state.leads.filter(l => l._id !== action.payload);
        
        // Clear selected lead if it's the deleted one
        if (state.selectedLead?._id === action.payload) {
          state.selectedLead = null;
        }
      }
    },
    
    // Lead status updates
    updateLeadStatus: (state, action: PayloadAction<{ id: string; status: Lead['status'] }>) => {
      const lead = state.leads.find(l => l._id === action.payload.id);
      if (lead) {
        const oldStatus = lead.status;
        lead.status = action.payload.status;
        updateStatsForLead(state.stats, lead, 'update', oldStatus);
        
        // Update selected lead if it's the same one
        if (state.selectedLead?._id === action.payload.id) {
          state.selectedLead.status = action.payload.status;
        }
      }
    },
    
    // Selected lead
    setSelectedLead: (state, action: PayloadAction<Lead | null>) => {
      state.selectedLead = action.payload;
    },
    
    clearSelectedLead: (state) => {
      state.selectedLead = null;
    },
    
    // Activities
    addActivity: (state, action: PayloadAction<{ leadId: string; activity: Lead['activities'][0] }>) => {
      const lead = state.leads.find(l => l._id === action.payload.leadId);
      if (lead) {
        lead.activities.unshift(action.payload.activity);
        
        // Update selected lead if it's the same one
        if (state.selectedLead?._id === action.payload.leadId) {
          state.selectedLead.activities.unshift(action.payload.activity);
        }
      }
    },
    
    updateActivity: (state, action: PayloadAction<{ leadId: string; activityId: string; updates: Partial<Lead['activities'][0]> }>) => {
      const lead = state.leads.find(l => l._id === action.payload.leadId);
      if (lead) {
        const activityIndex = lead.activities.findIndex(a => a._id === action.payload.activityId);
        if (activityIndex !== -1) {
          lead.activities[activityIndex] = { ...lead.activities[activityIndex], ...action.payload.updates };
          
          // Update selected lead if it's the same one
          if (state.selectedLead?._id === action.payload.leadId) {
            const selectedActivityIndex = state.selectedLead.activities.findIndex(a => a._id === action.payload.activityId);
            if (selectedActivityIndex !== -1) {
              state.selectedLead.activities[selectedActivityIndex] = { ...state.selectedLead.activities[selectedActivityIndex], ...action.payload.updates };
            }
          }
        }
      }
    },
    
    deleteActivity: (state, action: PayloadAction<{ leadId: string; activityId: string }>) => {
      const lead = state.leads.find(l => l._id === action.payload.leadId);
      if (lead) {
        lead.activities = lead.activities.filter(a => a._id !== action.payload.activityId);
        
        // Update selected lead if it's the same one
        if (state.selectedLead?._id === action.payload.leadId) {
          state.selectedLead.activities = state.selectedLead.activities.filter(a => a._id !== action.payload.activityId);
        }
      }
    },
    
    // Search and filters
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
      state.pagination.page = 1; // Reset to first page when searching
    },
    
    setFilters: (state, action: PayloadAction<Partial<LeadState['filters']>>) => {
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
    setPagination: (state, action: PayloadAction<Partial<LeadState['pagination']>>) => {
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
    setStats: (state, action: PayloadAction<LeadState['stats']>) => {
      state.stats = action.payload;
    },
    
    updateStats: (state, action: PayloadAction<Partial<LeadState['stats']>>) => {
      state.stats = { ...state.stats, ...action.payload };
    },
    
    // Pipeline
    setPipeline: (state, action: PayloadAction<{ [key: string]: Lead[] }>) => {
      state.pipeline = action.payload;
    },
    
    updatePipeline: (state, action: PayloadAction<{ status: string; leads: Lead[] }>) => {
      state.pipeline[action.payload.status] = action.payload.leads;
    },
    
    // Bulk operations
    bulkUpdateLeads: (state, action: PayloadAction<{ ids: string[]; updates: Partial<Lead> }>) => {
      const { ids, updates } = action.payload;
      state.leads = state.leads.map(lead => {
        if (ids.includes(lead._id)) {
          const oldStatus = lead.status;
          const updatedLead = { ...lead, ...updates };
          
          // Update stats if status changed
          if (updates.status && oldStatus !== updates.status) {
            updateStatsForLead(state.stats, updatedLead, 'update', oldStatus);
          }
          
          return updatedLead;
        }
        return lead;
      });
    },
    
    bulkDeleteLeads: (state, action: PayloadAction<string[]>) => {
      const idsToDelete = action.payload;
      const deletedLeads = state.leads.filter(l => idsToDelete.includes(l._id));
      
      // Update stats
      deletedLeads.forEach(lead => {
        updateStatsForLead(state.stats, lead, 'remove');
      });
      
      // Remove from array
      state.leads = state.leads.filter(l => !idsToDelete.includes(l._id));
      
      // Clear selected lead if it's one of the deleted ones
      if (state.selectedLead && idsToDelete.includes(state.selectedLead._id)) {
        state.selectedLead = null;
      }
    },
    
    // Reset state
    resetLeadState: () => initialState,
  },
});

// Export actions
export const {
  setLoading,
  setError,
  clearError,
  setLeads,
  addLead,
  updateLead,
  deleteLead,
  updateLeadStatus,
  setSelectedLead,
  clearSelectedLead,
  addActivity,
  updateActivity,
  deleteActivity,
  setSearchTerm,
  setFilters,
  clearFilters,
  setSorting,
  setPagination,
  setPage,
  setLimit,
  setStats,
  updateStats,
  setPipeline,
  updatePipeline,
  bulkUpdateLeads,
  bulkDeleteLeads,
  resetLeadState,
} = leadSlice.actions;

// Selectors
export const selectLeads = (state: { leads: LeadState }) => state.leads.leads;
export const selectSelectedLead = (state: { leads: LeadState }) => state.leads.selectedLead;
export const selectLeadLoading = (state: { leads: LeadState }) => state.leads.loading;
export const selectLeadError = (state: { leads: LeadState }) => state.leads.error;
export const selectLeadSearchTerm = (state: { leads: LeadState }) => state.leads.searchTerm;
export const selectLeadFilters = (state: { leads: LeadState }) => state.leads.filters;
export const selectLeadSorting = (state: { leads: LeadState }) => ({
  sortBy: state.leads.sortBy,
  sortOrder: state.leads.sortOrder,
});
export const selectLeadPagination = (state: { leads: LeadState }) => state.leads.pagination;
export const selectLeadStats = (state: { leads: LeadState }) => state.leads.stats;
export const selectPipeline = (state: { leads: LeadState }) => state.leads.pipeline;

// Computed selectors
export const selectFilteredLeads = (state: { leads: LeadState }) => {
  const { leads, searchTerm, filters } = state.leads;
  
  return leads.filter(lead => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const customerName = typeof lead.customer === 'string' ? '' : lead.customer.name || '';
      const customerCompany = typeof lead.customer === 'string' ? '' : lead.customer.company || '';
      
      const matchesSearch = 
        lead.title.toLowerCase().includes(searchLower) ||
        lead.description?.toLowerCase().includes(searchLower) ||
        customerName.toLowerCase().includes(searchLower) ||
        customerCompany.toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }
    
    // Status filter
    if (filters.status && lead.status !== filters.status) {
      return false;
    }
    
    // Priority filter
    if (filters.priority && lead.priority !== filters.priority) {
      return false;
    }
    
    // Assigned to filter
    if (filters.assignedTo) {
      const assignedToId = typeof lead.assignedTo === 'string' ? lead.assignedTo : lead.assignedTo._id;
      if (assignedToId !== filters.assignedTo) {
        return false;
      }
    }
    
    // Source filter
    if (filters.source && lead.source !== filters.source) {
      return false;
    }
    
    // Tags filter
    if (filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(tag => 
        lead.tags?.includes(tag)
      );
      if (!hasMatchingTag) return false;
    }
    
    // Date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      const leadDate = new Date(lead.createdAt);
      
      if (filters.dateRange.start && leadDate < new Date(filters.dateRange.start)) {
        return false;
      }
      
      if (filters.dateRange.end && leadDate > new Date(filters.dateRange.end)) {
        return false;
      }
    }
    
    // Value range filter
    if (filters.valueRange.min !== undefined && lead.value < filters.valueRange.min) {
      return false;
    }
    
    if (filters.valueRange.max !== undefined && lead.value > filters.valueRange.max) {
      return false;
    }
    
    return true;
  });
};

export const selectLeadsByStatus = (state: { leads: LeadState }) => {
  const leads = selectFilteredLeads(state);
  const statuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'converted', 'lost'];
  
  return statuses.reduce((acc, status) => {
    acc[status] = leads.filter(lead => lead.status === status);
    return acc;
  }, {} as { [key: string]: Lead[] });
};

// Export reducer
export default leadSlice.reducer;
