// ═══════════════════════════════════════════════════════════════
// EVENT STORE - Audit Trail & Event Sourcing
// Complete audit log of all system events
// ═══════════════════════════════════════════════════════════════

import { createClient } from '@/lib/supabase/server';

export interface DomainEvent {
    id?: string;
    aggregateId: string;
    aggregateType: string;
    eventType: string;
    eventData: Record<string, any>;
    metadata: {
        userId?: string;
        ipAddress?: string;
        userAgent?: string;
        correlationId?: string;
        timestamp?: string;
    };
    version: number;
}

/**
 * Append event to event store
 */
export async function appendEvent(event: DomainEvent): Promise<string> {
    const supabase = await createClient();

    const { data, error } = await (supabase
        .from('event_store') as any)
        .insert({
            aggregate_id: event.aggregateId,
            aggregate_type: event.aggregateType,
            event_type: event.eventType,
            event_data: event.eventData,
            metadata: {
                ...event.metadata,
                timestamp: new Date().toISOString()
            },
            version: event.version
        })
        .select('id')
        .single();

    if (error) {
        console.error('Event store error:', error);
        throw new Error('Failed to store event');
    }

    return data.id;
}

/**
 * Get all events for an aggregate
 */
export async function getEvents(
    aggregateId: string,
    fromVersion?: number
): Promise<DomainEvent[]> {
    const supabase = await createClient();

    let query = (supabase
        .from('event_store') as any)
        .select('*')
        .eq('aggregate_id', aggregateId)
        .order('version', { ascending: true });

    if (fromVersion !== undefined) {
        query = query.gt('version', fromVersion);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Event fetch error:', error);
        return [];
    }

    return data.map((row: any) => ({
        id: row.id,
        aggregateId: row.aggregate_id,
        aggregateType: row.aggregate_type,
        eventType: row.event_type,
        eventData: row.event_data,
        metadata: row.metadata,
        version: row.version
    }));
}

/**
 * Get events by type (for projections)
 */
export async function getEventsByType(
    eventType: string,
    since?: Date
): Promise<DomainEvent[]> {
    const supabase = await createClient();

    let query = (supabase
        .from('event_store') as any)
        .select('*')
        .eq('event_type', eventType)
        .order('created_at', { ascending: true });

    if (since) {
        query = query.gte('created_at', since.toISOString());
    }

    const { data, error } = await query;

    if (error) {
        return [];
    }

    return data.map((row: any) => ({
        id: row.id,
        aggregateId: row.aggregate_id,
        aggregateType: row.aggregate_type,
        eventType: row.event_type,
        eventData: row.event_data,
        metadata: row.metadata,
        version: row.version
    }));
}

// ═══════════════════════════════════════════════════════════════
// DOMAIN EVENTS
// ═══════════════════════════════════════════════════════════════

export const EventTypes = {
    // User events
    USER_REGISTERED: 'user.registered',
    USER_LOGGED_IN: 'user.logged_in',
    USER_LOGGED_OUT: 'user.logged_out',
    USER_PROFILE_UPDATED: 'user.profile_updated',

    // Subscription events
    TRIAL_STARTED: 'subscription.trial_started',
    TRIAL_EXPIRED: 'subscription.trial_expired',
    SUBSCRIPTION_CREATED: 'subscription.created',
    SUBSCRIPTION_RENEWED: 'subscription.renewed',
    SUBSCRIPTION_CANCELLED: 'subscription.cancelled',
    SUBSCRIPTION_EXPIRED: 'subscription.expired',

    // Payment events
    PAYMENT_INITIATED: 'payment.initiated',
    PAYMENT_COMPLETED: 'payment.completed',
    PAYMENT_FAILED: 'payment.failed',
    PAYMENT_REFUNDED: 'payment.refunded',

    // Lecture events
    LECTURE_REQUESTED: 'lecture.requested',
    LECTURE_GENERATION_STARTED: 'lecture.generation_started',
    LECTURE_CHAPTER_COMPLETED: 'lecture.chapter_completed',
    LECTURE_COMPLETED: 'lecture.completed',
    LECTURE_FAILED: 'lecture.failed',

    // Notes events
    NOTES_GENERATED: 'notes.generated',
    NOTES_VIEWED: 'notes.viewed',
    NOTES_DOWNLOADED: 'notes.downloaded',

    // Quiz events
    QUIZ_GENERATED: 'quiz.generated',
    QUIZ_STARTED: 'quiz.started',
    QUIZ_COMPLETED: 'quiz.completed',

    // Admin events
    ADMIN_LOGIN: 'admin.login',
    ADMIN_ACTION: 'admin.action',
    SETTINGS_CHANGED: 'admin.settings_changed'
} as const;

/**
 * Helper to create and store events
 */
export async function recordEvent(
    aggregateId: string,
    aggregateType: string,
    eventType: string,
    eventData: Record<string, any>,
    metadata?: DomainEvent['metadata']
): Promise<string> {
    // Get current version
    const events = await getEvents(aggregateId);
    const version = events.length > 0 ? Math.max(...events.map(e => e.version)) + 1 : 1;

    return appendEvent({
        aggregateId,
        aggregateType,
        eventType,
        eventData,
        metadata: metadata || {},
        version
    });
}

/**
 * Rebuild state from events
 */
export async function rebuildState<T>(
    aggregateId: string,
    reducer: (state: T, event: DomainEvent) => T,
    initialState: T
): Promise<T> {
    const events = await getEvents(aggregateId);
    return events.reduce(reducer, initialState);
}
