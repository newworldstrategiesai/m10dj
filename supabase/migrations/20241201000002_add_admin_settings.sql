-- Create admin_settings table for storing admin preferences
CREATE TABLE IF NOT EXISTS admin_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, setting_key)
);

-- Enable RLS
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_settings
CREATE POLICY "Users can view their own admin settings" ON admin_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own admin settings" ON admin_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own admin settings" ON admin_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own admin settings" ON admin_settings
    FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_admin_settings_updated_at ON admin_settings;
CREATE TRIGGER update_admin_settings_updated_at
    BEFORE UPDATE ON admin_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin phone number setting for existing admin users
-- Note: You'll need to update this with the correct admin user IDs
INSERT INTO admin_settings (user_id, setting_key, setting_value)
SELECT 
    id as user_id,
    'admin_phone_number' as setting_key,
    '9014977001' as setting_value
FROM auth.users 
WHERE email = 'djbenmurray@gmail.com' -- Replace with your admin email
ON CONFLICT (user_id, setting_key) DO NOTHING;