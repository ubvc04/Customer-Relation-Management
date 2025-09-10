import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

// Slices
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import customerReducer from './slices/customerSlice';
import leadReducer from './slices/leadSlice';

// Store configuration
export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    customers: customerReducer,
    leads: leadReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          // Ignore these action types for serialization check
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/REGISTER',
        ],
      },
    }),
  devTools: import.meta.env.DEV, // Enable Redux DevTools only in development
});

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
