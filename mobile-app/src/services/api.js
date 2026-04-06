/**
 * UPSC PrepX AI - API Service
 * Handles all HTTP requests to backend
 */

import axios from 'axios';
import Config from 'react-native-config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create axios instance
const api = axios.create({
  baseURL: Config.API_BASE_URL,
  timeout: parseInt(Config.API_TIMEOUT) || 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(
        Config.AUTH_TOKEN_STORAGE_KEY || '@upscprep:auth_token'
      );
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log('📡 API Request:', config.method?.toUpperCase(), config.url);
    } catch (error) {
      console.error('❌ Token retrieval error:', error);
    }
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    console.error('❌ API Error:', error.response?.status, error.message);

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401) {
      try {
        await AsyncStorage.multiRemove([
          Config.AUTH_TOKEN_STORAGE_KEY,
          Config.REFRESH_TOKEN_STORAGE_KEY,
          Config.USER_DATA_STORAGE_KEY,
        ]);
      } catch (storageError) {
        console.error('❌ Storage error:', storageError);
      }
    }

    return Promise.reject(error);
  }
);

// API Service Methods
export const apiService = {
  // Authentication
  auth: {
    login: async (email, password) => {
      const response = await api.post('/auth/login', {email, password});
      return response.data;
    },
    register: async (userData) => {
      const response = await api.post('/auth/register', userData);
      return response.data;
    },
    logout: async () => {
      const response = await api.post('/auth/logout');
      return response.data;
    },
    refreshToken: async () => {
      const response = await api.post('/auth/refresh-token');
      return response.data;
    },
    getCurrentUser: async () => {
      const response = await api.get('/auth/me');
      return response.data;
    },
  },

  // Video Lectures
  videos: {
    getAll: async (params = {}) => {
      const response = await api.get('/videos', {params});
      return response.data;
    },
    getById: async (id) => {
      const response = await api.get(`/videos/${id}`);
      return response.data;
    },
    generate: async (topic, subject) => {
      const response = await api.post('/videos/generate', {topic, subject});
      return response.data;
    },
    getProgress: async (videoId) => {
      const response = await api.get(`/videos/${videoId}/progress`);
      return response.data;
    },
    updateProgress: async (videoId, progress, timestamp) => {
      const response = await api.post(`/videos/${videoId}/progress`, {
        progress,
        timestamp,
      });
      return response.data;
    },
  },

  // Notes
  notes: {
    getAll: async (params = {}) => {
      const response = await api.get('/notes', {params});
      return response.data;
    },
    getById: async (id) => {
      const response = await api.get(`/notes/${id}`);
      return response.data;
    },
    generate: async (topic, subject, difficulty = 'intermediate') => {
      const response = await api.post('/notes/generate', {
        topic,
        subject,
        difficulty,
      });
      return response.data;
    },
    bookmark: async (id) => {
      const response = await api.post(`/notes/${id}/bookmark`);
      return response.data;
    },
    search: async (query) => {
      const response = await api.get('/notes/search', {params: {query}});
      return response.data;
    },
  },

  // Quizzes
  quizzes: {
    getAll: async (params = {}) => {
      const response = await api.get('/quizzes', {params});
      return response.data;
    },
    getById: async (id) => {
      const response = await api.get(`/quizzes/${id}`);
      return response.data;
    },
    generate: async (topic, difficulty = 'medium', numQuestions = 10) => {
      const response = await api.post('/quizzes/generate', {
        topic,
        difficulty,
        num_questions: numQuestions,
      });
      return response.data;
    },
    submit: async (quizId, answers) => {
      const response = await api.post(`/quizzes/${quizId}/submit`, {answers});
      return response.data;
    },
    getHistory: async () => {
      const response = await api.get('/quizzes/history');
      return response.data;
    },
  },

  // Current Affairs
  currentAffairs: {
    getAll: async (params = {}) => {
      const response = await api.get('/current-affairs', {params});
      return response.data;
    },
    getByDate: async (date) => {
      const response = await api.get(`/current-affairs/date/${date}`);
      return response.data;
    },
    getByCategory: async (category) => {
      const response = await api.get(`/current-affairs/category/${category}`);
      return response.data;
    },
  },

  // Subscription
  subscription: {
    getCurrent: async () => {
      const response = await api.get('/subscription/current');
      return response.data;
    },
    getPlans: async () => {
      const response = await api.get('/subscription/plans');
      return response.data;
    },
    purchase: async (planId, paymentMethod) => {
      const response = await api.post('/subscription/purchase', {
        plan_id: planId,
        payment_method: paymentMethod,
      });
      return response.data;
    },
  },

  // User Profile
  profile: {
    get: async () => {
      const response = await api.get('/profile');
      return response.data;
    },
    update: async (userData) => {
      const response = await api.put('/profile', userData);
      return response.data;
    },
    getProgress: async () => {
      const response = await api.get('/profile/progress');
      return response.data;
    },
  },

  // Downloads (Offline Mode)
  downloads: {
    getAll: async () => {
      const response = await api.get('/downloads');
      return response.data;
    },
    add: async (type, id) => {
      const response = await api.post('/downloads', {type, id});
      return response.data;
    },
    remove: async (id) => {
      const response = await api.delete(`/downloads/${id}`);
      return response.data;
    },
  },

  // Bookmarks
  bookmarks: {
    getAll: async () => {
      const response = await api.get('/bookmarks');
      return response.data;
    },
    add: async (type, id) => {
      const response = await api.post('/bookmarks', {type, id});
      return response.data;
    },
    remove: async (id) => {
      const response = await api.delete(`/bookmarks/${id}`);
      return response.data;
    },
  },

  // Health Check
  health: async () => {
    const response = await api.get('/health', {validateStatus: () => true});
    return response.data;
  },
};

export default api;
