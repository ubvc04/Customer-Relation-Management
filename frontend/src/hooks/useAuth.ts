import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/store';
import { 
  selectAuth, 
  selectUser, 
  selectIsAuthenticated, 
  selectIsLoading,
  selectAuthError,
  setUser,
  clearSession,
  setLoading,
  setError
} from '@/store/slices/authSlice';
import { authService } from '@/services/authService';

// Custom hook for authentication
export const useAuth = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(selectAuth);
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectIsLoading);
  const error = useAppSelector(selectAuthError);

  // Validate token on app initialization
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      
      if (token && !user) {
        dispatch(setLoading(true));
        
        try {
          // Validate token with backend
          const response = await authService.validateToken();
          
          if (response.success && response.data) {
            dispatch(setUser(response.data));
          } else {
            // Token is invalid, clear session
            dispatch(clearSession());
          }
        } catch (error: any) {
          console.error('Token validation failed:', error);
          dispatch(clearSession());
          dispatch(setError(error.message || 'Authentication failed'));
        } finally {
          dispatch(setLoading(false));
        }
      }
    };

    validateToken();
  }, [dispatch, user]);

  // Login function
  const login = async (credentials: { email: string; password: string }) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const response = await authService.login(credentials);
      
      if (response.success && response.data) {
        // Token is at root level in backend response
        const token = response.token;
        const user = response.data.user;
        
        dispatch(setUser(user));
        localStorage.setItem('token', token);
        return { success: true, data: { user, token } };
      } else {
        dispatch(setError(response.message || 'Login failed'));
        return { success: false, error: response.message };
      }
    } catch (error: any) {
      let errorMessage = error.response?.data?.message || error.message || 'Login failed';
      
      // Handle email verification required
      if (error.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        return { 
          success: false, 
          error: errorMessage,
          data: error.response.data.data
        };
      }
      
      dispatch(setError(errorMessage));
      return { success: false, error: errorMessage };
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Register function
  const register = async (userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
  }) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const response = await authService.register(userData);
      
      if (response.success) {
        // Registration initiates OTP verification, don't log user in yet
        return { success: true, data: response.data };
      } else {
        dispatch(setError(response.message || 'Registration failed'));
        return { success: false, error: response.message };
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      dispatch(setError(errorMessage));
      return { success: false, error: errorMessage };
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Logout function
  const logout = async () => {
    dispatch(setLoading(true));

    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch(clearSession());
      dispatch(setLoading(false));
    }
  };

  // Forgot password function
  const forgotPassword = async (email: string) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const response = await authService.forgotPassword(email);
      
      if (response.success) {
        return { success: true, message: response.message };
      } else {
        dispatch(setError(response.message || 'Failed to send reset email'));
        return { success: false, error: response.message };
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to send reset email';
      dispatch(setError(errorMessage));
      return { success: false, error: errorMessage };
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Reset password function
  const resetPassword = async (token: string, password: string) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const response = await authService.resetPassword(token, password);
      
      if (response.success) {
        return { success: true, message: response.message };
      } else {
        dispatch(setError(response.message || 'Password reset failed'));
        return { success: false, error: response.message };
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Password reset failed';
      dispatch(setError(errorMessage));
      return { success: false, error: errorMessage };
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Update profile function
  const updateProfile = async (updates: Partial<{
    name: string;
    email: string;
    avatar: string;
  }>) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const response = await authService.updateProfile(updates);
      
      if (response.success && response.data) {
        dispatch(setUser(response.data));
        return { success: true, data: response.data };
      } else {
        dispatch(setError(response.message || 'Profile update failed'));
        return { success: false, error: response.message };
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Profile update failed';
      dispatch(setError(errorMessage));
      return { success: false, error: errorMessage };
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Change password function
  const changePassword = async (currentPassword: string, newPassword: string) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const response = await authService.changePassword(currentPassword, newPassword);
      
      if (response.success) {
        return { success: true, message: response.message };
      } else {
        dispatch(setError(response.message || 'Password change failed'));
        return { success: false, error: response.message };
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Password change failed';
      dispatch(setError(errorMessage));
      return { success: false, error: errorMessage };
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Demo login function (fallback when database is unavailable)
  const demoLogin = async () => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const response = await authService.demoLogin();
      
      if (response.success && response.data) {
        // Token is at root level in backend response
        const token = response.token;
        const user = response.data.user;
        
        dispatch(setUser(user));
        if (token) {
          localStorage.setItem('token', token);
        }
        return { success: true, data: { user, token } };
      } else {
        dispatch(setError(response.message || 'Demo login failed'));
        return { success: false, error: response.message };
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Demo login failed';
      dispatch(setError(errorMessage));
      return { success: false, error: errorMessage };
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Verify OTP function
  const verifyOTP = async (data: { email: string; otp: string }) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const response = await authService.verifyOTP(data);
      
      if (response.success && response.data) {
        // Token is at root level in backend response
        const token = response.token;
        const user = response.data.user;
        
        dispatch(setUser(user));
        if (token) {
          localStorage.setItem('token', token);
        }
        return { success: true, data: { user, token } };
      } else {
        dispatch(setError(response.message || 'OTP verification failed'));
        return { success: false, error: response.message };
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'OTP verification failed';
      dispatch(setError(errorMessage));
      return { success: false, error: errorMessage };
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Resend OTP function
  const resendOTP = async (email: string) => {
    dispatch(setLoading(true));
    dispatch(setError(null));

    try {
      const response = await authService.resendOTP(email);
      
      if (response.success) {
        return { success: true, message: response.message };
      } else {
        dispatch(setError(response.message || 'Failed to resend OTP'));
        return { success: false, error: response.message };
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to resend OTP';
      dispatch(setError(errorMessage));
      return { success: false, error: errorMessage };
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Check if user has specific role
  const hasRole = (role: string): boolean => {
    return user?.role === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles: string[]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  // Check if user is admin
  const isAdmin = (): boolean => {
    return hasRole('admin');
  };

  // Check if user is manager
  const isManager = (): boolean => {
    return hasRole('manager');
  };

  // Check if user is sales rep
  const isSalesRep = (): boolean => {
    return hasRole('sales_rep');
  };

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    auth,

    // Actions
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    changePassword,
    demoLogin,
    verifyOTP,
    resendOTP,

    // Utility functions
    hasRole,
    hasAnyRole,
    isAdmin,
    isManager,
    isSalesRep,
  };
};
