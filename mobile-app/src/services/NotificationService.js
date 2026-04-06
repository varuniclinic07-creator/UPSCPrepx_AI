/**
 * Notification Service
 * 
 * Master Prompt v8.0 - F20 Mobile Polish
 * - Expo Push Notifications integration
 * - Handle permissions and tokens
 */

import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Configure how notifications should appear when the app is foregrounded
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

export async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') {
            alert('Failed to get push token for push notification!');
            return;
        }
        token = (await Notifications.getExpoPushTokenAsync({
            projectId: Constants.expoConfig?.extra?.eas?.projectId,
        })).data;
    }else {
        alert('Must use physical device for Push Notifications');
    }

    return token;
}

/**
 * Send token to backend to save in DB
 */
export async function syncTokenToBackend(token) {
    try {
        // In real app: POST /api/mobile/sync-token
        console.log('Syncing Token:', token);
    } catch (e) {
        console.error('Failed to sync token', e);
    }
}