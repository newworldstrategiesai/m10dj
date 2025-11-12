-- Create admin_tasks table for AI-generated follow-up tasks
CREATE TABLE IF NOT EXISTS admin_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT NOT NULL,
    task_type TEXT NOT NULL CHECK (task_type IN ('call_back', 'send_quote', 'answer_question', 'schedule_meeting')),
    priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
    notes TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
    assigned_to UUID REFERENCES auth.users(id),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on status for quick filtering
CREATE INDEX idx_admin_tasks_status ON admin_tasks(status);
CREATE INDEX idx_admin_tasks_priority ON admin_tasks(priority);
CREATE INDEX idx_admin_tasks_phone ON admin_tasks(phone_number);
CREATE INDEX idx_admin_tasks_created ON admin_tasks(created_at DESC);

-- Add RLS policies
ALTER TABLE admin_tasks ENABLE ROW LEVEL SECURITY;

-- Admin users can see and manage all tasks
CREATE POLICY "Admin users can view all tasks"
    ON admin_tasks
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.role = 'authenticated'
        )
    );

CREATE POLICY "Admin users can insert tasks"
    ON admin_tasks
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.role = 'authenticated'
        )
    );

CREATE POLICY "Admin users can update tasks"
    ON admin_tasks
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.role = 'authenticated'
        )
    );

CREATE POLICY "Service role can manage tasks"
    ON admin_tasks
    FOR ALL
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Add updated_at trigger
CREATE TRIGGER update_admin_tasks_updated_at
    BEFORE UPDATE ON admin_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment for documentation
COMMENT ON TABLE admin_tasks IS 'AI-generated follow-up tasks for admin users to handle customer inquiries requiring personal attention';

