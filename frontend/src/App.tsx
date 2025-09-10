import React, { useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { motion, AnimatePresence } from 'framer-motion';

// Redux store
import { store } from '@/store';

// Auth components
import { useAuth } from '@/hooks/useAuth';
import { initializeAuth } from '@/store/slices/authSlice';

// Layout components
import Layout from '@/components/Layout/Layout';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary/ErrorBoundary';

// Auth pages
const Login = React.lazy(() => import('@/pages/Auth/Login'));
const Register = React.lazy(() => import('@/pages/Auth/Register'));
const ForgotPassword = React.lazy(() => import('@/pages/Auth/ForgotPassword'));

// Protected pages
const Dashboard = React.lazy(() => import('@/pages/Dashboard/Dashboard'));
const Customers = React.lazy(() => import('@/pages/Customers/Customers'));
const CustomerDetail = React.lazy(() => import('@/pages/Customers/CustomerDetail'));
const Leads = React.lazy(() => import('@/pages/Leads/Leads'));
const LeadDetail = React.lazy(() => import('@/pages/Leads/LeadDetail'));
const Profile = React.lazy(() => import('@/pages/Profile/Profile'));
const Settings = React.lazy(() => import('@/pages/Settings/Settings'));

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        if (error?.status === 401) return false;
        return failureCount < 3;
      },
    },
  },
});

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route component (redirect to dashboard if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Auth initializer component
const AuthInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    // Initialize auth state from localStorage
    store.dispatch(initializeAuth());
  }, []);

  return <>{children}</>;
};

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -20,
  },
};

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.3,
};

// Animated route wrapper
const AnimatedRoutes: React.FC = () => {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Suspense fallback={<LoadingSpinner />}>
                  <Login />
                </Suspense>
              </motion.div>
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Suspense fallback={<LoadingSpinner />}>
                  <Register />
                </Suspense>
              </motion.div>
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Suspense fallback={<LoadingSpinner />}>
                  <ForgotPassword />
                </Suspense>
              </motion.div>
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          
          <Route
            path="dashboard"
            element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Suspense fallback={<LoadingSpinner />}>
                  <Dashboard />
                </Suspense>
              </motion.div>
            }
          />
          
          <Route
            path="customers"
            element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Suspense fallback={<LoadingSpinner />}>
                  <Customers />
                </Suspense>
              </motion.div>
            }
          />
          
          <Route
            path="customers/:id"
            element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Suspense fallback={<LoadingSpinner />}>
                  <CustomerDetail />
                </Suspense>
              </motion.div>
            }
          />
          
          <Route
            path="leads"
            element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Suspense fallback={<LoadingSpinner />}>
                  <Leads />
                </Suspense>
              </motion.div>
            }
          />
          
          <Route
            path="leads/:id"
            element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Suspense fallback={<LoadingSpinner />}>
                  <LeadDetail />
                </Suspense>
              </motion.div>
            }
          />
          
          <Route
            path="profile"
            element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Suspense fallback={<LoadingSpinner />}>
                  <Profile />
                </Suspense>
              </motion.div>
            }
          />
          
          <Route
            path="settings"
            element={
              <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
              >
                <Suspense fallback={<LoadingSpinner />}>
                  <Settings />
                </Suspense>
              </motion.div>
            }
          />
        </Route>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <AuthInitializer>
            <Router>
              <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                <AnimatedRoutes />
                
                {/* Toast notifications */}
                <ToastContainer
                  position="top-right"
                  autoClose={5000}
                  hideProgressBar={false}
                  newestOnTop
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                  theme="light"
                  className="!mt-16"
                />
              </div>
            </Router>
          </AuthInitializer>
          
          {/* React Query DevTools (only in development) */}
          {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
        </QueryClientProvider>
      </Provider>
    </ErrorBoundary>
  );
};

export default App;
