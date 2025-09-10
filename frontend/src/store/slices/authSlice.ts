import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'sales_rep';
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Helper functions
const setTokenInStorage = (token: string) => {
  localStorage.setItem('token', token);
};

const removeTokenFromStorage = () => {
  localStorage.removeItem('token');
};

const getTokenFromStorage = (): string | null => {
  return localStorage.getItem('token');
};

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Initialize auth state from localStorage
    initializeAuth: (state) => {
      const token = getTokenFromStorage();
      if (token) {
        state.token = token;
        state.isAuthenticated = true;
        // Note: User data will be fetched via API after token validation
      }
    },

    // Set loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Set error
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Login success
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
      setTokenInStorage(action.payload.token);
    },

    // Login failure
    loginFailure: (state, action: PayloadAction<string>) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = action.payload;
      removeTokenFromStorage();
    },

    // Logout
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      removeTokenFromStorage();
    },

    // Update user profile
    updateProfile: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },

    // Set user (for when token is validated)
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.error = null;
    },

    // Clear user session (when token is invalid)
    clearSession: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.error = null;
      removeTokenFromStorage();
    },

    // Update last login
    updateLastLogin: (state) => {
      if (state.user) {
        state.user.lastLogin = new Date().toISOString();
      }
    },
  },
});

// Export actions
export const {
  initializeAuth,
  setLoading,
  setError,
  clearError,
  loginSuccess,
  loginFailure,
  logout,
  updateProfile,
  setUser,
  clearSession,
  updateLastLogin,
} = authSlice.actions;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth;
export const selectUser = (state: { auth: AuthState }) => state.auth.user;
export const selectToken = (state: { auth: AuthState }) => state.auth.token;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectIsLoading = (state: { auth: AuthState }) => state.auth.isLoading;
export const selectAuthError = (state: { auth: AuthState }) => state.auth.error;

// Export reducer
export default authSlice.reducer;
