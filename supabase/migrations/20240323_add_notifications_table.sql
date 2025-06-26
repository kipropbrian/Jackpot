-- Migration: Add notifications table for user notifications
-- Created: 2024-03-23

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('simulation_completed', 'simulation_failed', 'system_announcement')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT NULL,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Enable RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Only the system/backend can create notifications (no direct user inserts)
CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating updated_at
CREATE TRIGGER trigger_update_notifications_timestamp
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_updated_at();

-- Helper function to create notifications (can be called from backend)
CREATE OR REPLACE FUNCTION create_user_notification(
    p_user_id UUID,
    p_type VARCHAR(50),
    p_title VARCHAR(255),
    p_message TEXT,
    p_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (p_user_id, p_type, p_title, p_message, p_data)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to create simulation completion notifications
CREATE OR REPLACE FUNCTION notify_simulation_completed(
    p_user_id UUID,
    p_simulation_id UUID,
    p_simulation_name VARCHAR(255),
    p_total_combinations INTEGER,
    p_winning_combinations INTEGER DEFAULT 0,
    p_total_payout DECIMAL DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
    win_rate DECIMAL;
    notification_title VARCHAR(255);
    notification_message TEXT;
BEGIN
    -- Calculate win rate
    win_rate := CASE 
        WHEN p_total_combinations > 0 THEN (p_winning_combinations::DECIMAL / p_total_combinations) * 100
        ELSE 0
    END;
    
    -- Create notification title and message
    notification_title := 'Simulation "' || p_simulation_name || '" Completed';
    notification_message := 'Your simulation finished with ' || 
                          p_winning_combinations || ' winning combinations out of ' || 
                          p_total_combinations || ' total (' || ROUND(win_rate, 2) || '%). ' ||
                          'Total winnings: KSh ' || COALESCE(p_total_payout, 0);
    
    -- Create the notification
    notification_id := create_user_notification(
        p_user_id,
        'simulation_completed',
        notification_title,
        notification_message,
        jsonb_build_object(
            'simulation_id', p_simulation_id,
            'simulation_name', p_simulation_name,
            'total_combinations', p_total_combinations,
            'winning_combinations', p_winning_combinations,
            'win_rate', win_rate,
            'total_payout', p_total_payout
        )
    );
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to create simulation failure notifications
CREATE OR REPLACE FUNCTION notify_simulation_failed(
    p_user_id UUID,
    p_simulation_id UUID,
    p_simulation_name VARCHAR(255),
    p_error_message TEXT DEFAULT 'Simulation failed to complete'
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    notification_id := create_user_notification(
        p_user_id,
        'simulation_failed',
        'Simulation "' || p_simulation_name || '" Failed',
        'Your simulation encountered an error and could not be completed. ' || p_error_message,
        jsonb_build_object(
            'simulation_id', p_simulation_id,
            'simulation_name', p_simulation_name,
            'error_message', p_error_message
        )
    );
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for documentation
COMMENT ON TABLE notifications IS 'User notifications for simulation completion, failures, and system announcements';
COMMENT ON FUNCTION create_user_notification IS 'Helper function to create notifications for users';
COMMENT ON FUNCTION notify_simulation_completed IS 'Creates a notification when a simulation completes successfully';
COMMENT ON FUNCTION notify_simulation_failed IS 'Creates a notification when a simulation fails'; 