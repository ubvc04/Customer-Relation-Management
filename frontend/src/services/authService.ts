import axios, { AxiosResponse } from 'axios';

// Types
interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
}

interface User {
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

interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string; // Token at root level for login responses
  data?: {
    user: User;
    token?: string; // Token can also be in data for some responses
  };
}

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

// API Configuration
const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  // Login
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response: AxiosResponse<AuthResponse> = await apiClient.post('/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Register
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    try {
      const response: AxiosResponse<AuthResponse> = await apiClient.post('/auth/register', userData);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Logout
  logout: async (): Promise<ApiResponse> => {
    try {
      const response: AxiosResponse<ApiResponse> = await apiClient.post('/auth/logout');
      localStorage.removeItem('token');
      return response.data;
    } catch (error: any) {
      localStorage.removeItem('token');
      throw error;
    }
  },

  // Validate token
  validateToken: async (): Promise<ApiResponse<User>> => {
    try {
      const response: AxiosResponse<ApiResponse<User>> = await apiClient.get('/auth/me');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Forgot password
  forgotPassword: async (email: string): Promise<ApiResponse> => {
    try {
      const response: AxiosResponse<ApiResponse> = await apiClient.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Reset password
  resetPassword: async (token: string, password: string): Promise<ApiResponse> => {
    try {
      const response: AxiosResponse<ApiResponse> = await apiClient.post('/auth/reset-password', {
        token,
        password,
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Update profile
  updateProfile: async (updates: Partial<{
    name: string;
    email: string;
    avatar: string;
  }>): Promise<ApiResponse<User>> => {
    try {
      const response: AxiosResponse<ApiResponse<User>> = await apiClient.put('/auth/profile', updates);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse> => {
    try {
      const response: AxiosResponse<ApiResponse> = await apiClient.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Refresh token
  refreshToken: async (): Promise<AuthResponse> => {
    try {
      const response: AxiosResponse<AuthResponse> = await apiClient.post('/auth/refresh');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Demo login (fallback when database is unavailable)
  demoLogin: async (): Promise<AuthResponse> => {
    try {
      const response: AxiosResponse<AuthResponse> = await apiClient.post('/auth/demo-login');
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Verify OTP
  verifyOTP: async (data: { email: string; otp: string }): Promise<AuthResponse> => {
    try {
      const response: AxiosResponse<AuthResponse> = await apiClient.post('/auth/verify-otp', data);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // Resend OTP
  resendOTP: async (email: string): Promise<ApiResponse> => {
    try {
      const response: AxiosResponse<ApiResponse> = await apiClient.post('/auth/resend-otp', { email });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};

// Export API client for other services
export { apiClient };
