/**
 * UPSC PrepX AI - Authentication Store
 * Manages user authentication state using Zustand
 */

import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import {apiService} from '../services/api';

export const useAuthStore = create((set, get) => ({
  // State
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  // Actions
  setLoading: (loading) => set({isLoading: loading}),

  setError: (error) => set({error, isLoading: false}),

  clearError: () => set({error: null}),

  // Login
  login: async (email, password) => {
    try {
      set({isLoading: true, error: null});
      
      const response = await apiService.auth.login(email, password);
      const {user, access_token, refresh_token} = response.data;

      // Store tokens securely
      await AsyncStorage.multiSet([
        [Config.AUTH_TOKEN_STORAGE_KEY, access_token],
        [Config.REFRESH_TOKEN_STORAGE_KEY, refresh_token],
        [Config.USER_DATA_STORAGE_KEY, JSON.stringify(user)],
      ]);

      set({
        user,
        token: access_token,
        refreshToken: refresh_token,
        isAuthenticated: true,
        isLoading: false,
      });

      console.log('✅ Login successful:', user.email);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      set({error: message, isLoading: false});
      console.error('❌ Login error:', message);
      throw new Error(message);
    }
  },

  // Register
  register: async (userData) => {
    try {
      set({isLoading: true, error: null});
      
      const response = await apiService.auth.register(userData);
      const {user, access_token, refresh_token} = response.data;

      await AsyncStorage.multiSet([
        [Config.AUTH_TOKEN_STORAGE_KEY, access_token],
        [Config.REFRESH_TOKEN_STORAGE_KEY, refresh_token],
        [Config.USER_DATA_STORAGE_KEY, JSON.stringify(user)],
      ]);

      set({
        user,
        token: access_token,
        refreshToken: refresh_token,
        isAuthenticated: true,
        isLoading: false,
      });

      console.log('✅ Registration successful:', user.email);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      set({error: message, isLoading: false});
      console.error('❌ Registration error:', message);
      throw new Error(message);
    }
  },

  // Logout
  logout: async () => {
    try {
      // Call logout API
      await apiService.auth.logout();
    } catch (error) {
      console.error('❌ Logout API error:', error);
    } finally {
      // Clear local storage
      await AsyncStorage.multiRemove([
        Config.AUTH_TOKEN_STORAGE_KEY,
        Config.REFRESH_TOKEN_STORAGE_KEY,
        Config.USER_DATA_STORAGE_KEY,
      ]);

      set({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        error: null,
      });

      console.log('👋 Logout successful');
    }
  },

  // Refresh Token
  refreshAuthToken: async () => {
    try {
      const {refreshToken} = get();
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiService.auth.refreshToken();
      const {access_token, refresh_token} = response.data;

      await AsyncStorage.multiSet([
        [Config.AUTH_TOKEN_STORAGE_KEY, access_token],
        [Config.REFRESH_TOKEN_STORAGE_KEY, refresh_token],
      ]);

      set({
        token: access_token,
        refreshToken: refresh_token,
      });

      console.log('🔄 Token refreshed successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      // Force logout if refresh fails
      await get().logout();
      throw error;
    }
  },

  // Load persisted auth state
  loadPersistedAuth: async () => {
    try {
      set({isLoading: true});

      const [token, refreshToken, userJson] = await AsyncStorage.multiGet([
        Config.AUTH_TOKEN_STORAGE_KEY,
        Config.REFRESH_TOKEN_STORAGE_KEY,
        Config.USER_DATA_STORAGE_KEY,
      ]);

      const storedToken = token[1];
      const storedRefreshToken = refreshToken[1];
      const storedUser = userJson[1] ? JSON.parse(userJson[1]) : null;

      if (storedToken && storedUser) {
        // Verify token is still valid
        try {
          const response = await apiService.auth.getCurrentUser();
          set({
            user: response.data,
            token: storedToken,
            refreshToken: storedRefreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
          console.log('✅ Auth state restored from storage');
        } catch (error) {
          // Token invalid, try refresh
          if (storedRefreshToken) {
            try {
              await get().refreshAuthToken();
              const response = await apiService.auth.getCurrentUser();
              set({
                user: response.data,
                isAuthenticated: true,
                isLoading: false,
              });
              console.log('✅ Auth state restored after token refresh');
              return;
            } catch (refreshError) {
              console.error('❌ Token refresh failed, clearing auth');
            }
          }
          // Clear invalid auth
          await get().logout();
        }
      } else {
        set({isLoading: false});
      }
    } catch (error) {
      console.error('❌ Load persisted auth error:', error);
      set({isLoading: false});
    }
  },

  // Update user profile
  updateUser: (userData) => {
    set((state) => ({
      user: {...state.user, ...userData},
    }));
  },
}));
