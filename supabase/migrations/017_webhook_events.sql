-- ═══════════════════════════════════════════════════════════════════════════
-- WEBHOOK EVENTS TABLE - For Idempotency
-- Migration: 017_webhook_events.sql
-- Description: Stores processed webhook events to prevent duplicate handling
-- ═══════════════════════════════════════════════════════════════════════════

-- Create webhook_events table for idempotency
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event identification
    event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    
    -- Full payload for debugging
    payload JSONB NOT NULL,
    
    -- Tracking
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Indexes for fast lookup
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by event_id
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON webhook_events(created_at DESC);

-- Enable RLS
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Only service role can access webhook events
CREATE POLICY "Service role manages webhook events" ON webhook_events
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Cleanup function to delete old webhook events (keep 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_events()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM webhook_events 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════
-- END OF MIGRATION 017
-- ═══════════════════════════════════════════════════════════════════════════
