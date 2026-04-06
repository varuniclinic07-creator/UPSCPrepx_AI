/**
 * UPSC PrepX AI - Application Store
 * Manages global app state using Zustand
 */

import {create} from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';

export const useAppStore = create((set, get) => ({
  // App State
  isOnboarded: false,
  currentTheme: Config.DEFAULT_THEME || 'dark',
  language: Config.DEFAULT_LANGUAGE || 'en',
  isLoading: false,
  error: null,

  // Learning State
  studyGoals: [],
  dailyStreak: 0,
  lastStudyDate: null,
  totalStudyTime: 0,

  // Cache State
  cachedVideos: [],
  cachedNotes: [],
  lastSyncTime: null,

  // Actions
  setLoading: (loading) => set({isLoading: loading}),

  setError: (error) => set({error}),

  clearError: () => set({error: null}),

  // Onboarding
  completeOnboarding: async () => {
    await AsyncStorage.setItem('@upscprep:onboarded', 'true');
    set({isOnboarded: true});
  },

  loadOnboardingState: async () => {
    try {
      const value = await AsyncStorage.getItem('@upscprep:onboarded');
      set({isOnboarded: value === 'true'});
    } catch (error) {
      console.error('❌ Load onboarding error:', error);
    }
  },

  // Theme
  setTheme: async (theme) => {
    await AsyncStorage.setItem('@upscprep:theme', theme);
    set({currentTheme: theme});
  },

  loadTheme: async () => {
    try {
      const value = await AsyncStorage.getItem('@upscprep:theme');
      if (value) {
        set({currentTheme: value});
      }
    } catch (error) {
      console.error('❌ Load theme error:', error);
    }
  },

  // Language
  setLanguage: async (language) => {
    await AsyncStorage.setItem('@upscprep:language', language);
    set({language});
  },

  // Study Goals
  setStudyGoals: (goals) => {
    set({studyGoals: goals});
  },

  addStudyGoal: (goal) => {
    set((state) => ({
      studyGoals: [...state.studyGoals, goal],
    }));
  },

  // Streak Tracking
  updateStreak: async () => {
    const today = new Date().toDateString();
    const {lastStudyDate, dailyStreak} = get();

    if (lastStudyDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const newStreak = lastStudyDate === yesterday.toDateString()
        ? dailyStreak + 1
        : 1;

      await AsyncStorage.multiSet([
        ['@upscprep:streak', newStreak.toString()],
        ['@upscprep:lastStudyDate', today],
      ]);

      set({
        dailyStreak: newStreak,
        lastStudyDate: today,
      });
    }
  },

  loadStreak: async () => {
    try {
      const [streakValue, dateValue] = await AsyncStorage.multiGet([
        '@upscprep:streak',
        '@upscprep:lastStudyDate',
      ]);

      const streak = parseInt(streakValue[1]) || 0;
      const lastDate = dateValue[1];

      set({
        dailyStreak: streak,
        lastStudyDate: lastDate,
      });
    } catch (error) {
      console.error('❌ Load streak error:', error);
    }
  },

  // Study Time Tracking
  addStudyTime: async (seconds) => {
    const {totalStudyTime} = get();
    const newTotal = totalStudyTime + seconds;

    await AsyncStorage.setItem('@upscprep:totalStudyTime', newTotal.toString());
    set({totalStudyTime: newTotal});
  },

  loadStudyTime: async () => {
    try {
      const value = await AsyncStorage.getItem('@upscprep:totalStudyTime');
      const time = parseInt(value) || 0;
      set({totalStudyTime: time});
    } catch (error) {
      console.error('❌ Load study time error:', error);
    }
  },

  // Cache Management
  addToCache: async (type, item) => {
    const cacheKey = type === 'video' ? '@upscprep:cachedVideos' : '@upscprep:cachedNotes';
    const currentCache = type === 'video' ? get().cachedVideos : get().cachedNotes;

    // Check if already cached
    if (currentCache.find((i) => i.id === item.id)) {
      return;
    }

    const newCache = [...currentCache, item];
    const cacheLimit = parseInt(Config.CACHE_MAX_SIZE_MB) || 100;

    // Simple cache size management
    if (newCache.length > cacheLimit * 10) {
      newCache.shift(); // Remove oldest
    }

    await AsyncStorage.setItem(cacheKey, JSON.stringify(newCache));

    if (type === 'video') {
      set({cachedVideos: newCache});
    } else {
      set({cachedNotes: newCache});
    }
  },

  loadCache: async () => {
    try {
      const [videosValue, notesValue] = await AsyncStorage.multiGet([
        '@upscprep:cachedVideos',
        '@upscprep:cachedNotes',
      ]);

      const videos = videosValue[1] ? JSON.parse(videosValue[1]) : [];
      const notes = notesValue[1] ? JSON.parse(notesValue[1]) : [];

      set({
        cachedVideos: videos,
        cachedNotes: notes,
      });
    } catch (error) {
      console.error('❌ Load cache error:', error);
    }
  },

  clearCache: async () => {
    await AsyncStorage.multiRemove([
      '@upscprep:cachedVideos',
      '@upscprep:cachedNotes',
    ]);
    set({
      cachedVideos: [],
      cachedNotes: [],
    });
  },

  // Sync
  updateLastSync: async () => {
    const now = new Date().toISOString();
    await AsyncStorage.setItem('@upscprep:lastSyncTime', now);
    set({lastSyncTime: now});
  },

  loadLastSync: async () => {
    try {
      const value = await AsyncStorage.getItem('@upscprep:lastSyncTime');
      set({lastSyncTime: value});
    } catch (error) {
      console.error('❌ Load last sync error:', error);
    }
  },

  // Initialize App
  initializeApp: async () => {
    set({isLoading: true});

    try {
      // Load all persisted state
      await Promise.all([
        get().loadOnboardingState(),
        get().loadTheme(),
        get().loadStreak(),
        get().loadStudyTime(),
        get().loadCache(),
        get().loadLastSync(),
      ]);

      console.log('✅ App initialized successfully');
    } catch (error) {
      console.error('❌ App initialization error:', error);
      set({error: 'Failed to initialize app'});
    } finally {
      set({isLoading: false});
    }
  },
}));
