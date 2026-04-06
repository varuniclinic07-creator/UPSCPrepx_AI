/**
 * UPSC PrepX AI - Main Application Entry Point
 * 
 * @format
 * @flow strict-local
 */

import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Config from 'react-native-config';
import Toast from 'react-native-toast-message';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import VideoLecturesScreen from './src/screens/VideoLecturesScreen';
import NotesScreen from './src/screens/NotesScreen';
import QuizScreen from './src/screens/QuizScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import VideoPlayerScreen from './src/screens/VideoPlayerScreen';
import NotesDetailScreen from './src/screens/NotesDetailScreen';
import QuizResultScreen from './src/screens/QuizResultScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SubscriptionScreen from './src/screens/SubscriptionScreen';
import DownloadsScreen from './src/screens/DownloadsScreen';
import BookmarksScreen from './src/screens/BookmarksScreen';

// State Management
import {useAuthStore} from './src/store/authStore';
import {useAppStore} from './src/store/appStore';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Videos') {
            iconName = focused ? 'video' : 'video-outline';
          } else if (route.name === 'Notes') {
            iconName = focused ? 'note-text' : 'note-text-outline';
          } else if (route.name === 'Quiz') {
            iconName = focused ? 'clipboard-check' : 'clipboard-check-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Videos" component={VideoLecturesScreen} />
      <Tab.Screen name="Notes" component={NotesScreen} />
      <Tab.Screen name="Quiz" component={QuizScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Auth Stack
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// Main App Stack
function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} />
      <Stack.Screen name="NotesDetail" component={NotesDetailScreen} />
      <Stack.Screen name="QuizResult" component={QuizResultScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      <Stack.Screen name="Downloads" component={DownloadsScreen} />
      <Stack.Screen name="Bookmarks" component={BookmarksScreen} />
    </Stack.Navigator>
  );
}

// Root Navigator
function RootNavigator() {
  const {isAuthenticated, isLoading, user} = useAuthStore();
  const {isOnboarded} = useAppStore();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      {!isAuthenticated ? <AuthStack /> : <AppStack />}
    </NavigationContainer>
  );
}

// Main App Component
function App() {
  useEffect(() => {
    // Initialize app
    console.log('🚀 UPSC PrepX AI - App Initialized');
    console.log('📡 API Base URL:', Config.API_BASE_URL);
    console.log('🌍 Environment:', Config.ENVIRONMENT);
  }, []);

  return (
    <>
      <RootNavigator />
      <Toast />
    </>
  );
}

export default App;
