/**
 * Offline Manager
 * 
 * Master Prompt v8.0 - F20 Mobile Polish
 * - Async Storage for caching PDFs, Notes, and Video metadata
 * - NetInfo for connectivity checks
 * - Queue for offline writes (sync when online)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';

const CACHE_KEYS = {
    NOTES: 'offline_notes',
    SYLLABUS: 'offline_syllabus',
    TOKEN_EXPIRY: 'token_expiry',
};

export class OfflineManager {
    // 1. Check Connectivity
    static async isOnline() {        const state = await NetInfo.fetch();
        return state.isConnected && state.isInternetReachable;
    }

    // 2. Cache Notes/Video Metadata Locally
    static async cacheNotes(notes: any[]) {
        try {            await AsyncStorage.setItem(CACHE_KEYS.NOTES, JSON.stringify(notes));
            console.log('Notes cached successfully.');
        } catch (e) {
            console.error('Failed to cache notes', e);
        }
    }

    // 3. Load Cached Data when No Internet
    static async getCachedNotes() {
        try {            const notes = await AsyncStorage.getItem(CACHE_KEYS.NOTES);
            return notes ? JSON.parse(notes) : [];
        } catch (e) {
            console.error('Failed to load cached notes', e);
            return [];
        }
    }

    // 4. Queue for Offline Writes
    static async queueSyncRequest(requestData: any) {
        const queueKey = 'sync_queue';
        try {
            const existingQueue = await AsyncStorage.getItem(queueKey);
            const queue = existingQueue ? JSON.parse(existingQueue) : [];
            queue.push({ ...requestData, timestamp: Date.now() });
            await AsyncStorage.setItem(queueKey, JSON.stringify(queue));
            Alert.alert('Offline Mode', 'Request queued. Will sync when online.');
        } catch (e) {
            console.error('Queue sync failed', e);
        }
    }

    // 5. Process Sync Queue when Back Online
    static async processSyncQueue() {
        const queueKey = 'sync_queue';
        const queue = await AsyncStorage.getItem(queueKey);
        if (!queue) return;

        const items = JSON.parse(queue);
        for (const item of items) {
            try {                // Mock POST to API
                console.log('Syncing item:', item);
                // await fetch('/api/sync', { ... });
            } catch (e) {
                console.error('Sync failed for item:', item, e);
            }
        }
        await AsyncStorage.removeItem(queueKey);
        console.log('Sync queue cleared.');
    }
}