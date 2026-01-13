-- Add assistant settings to organizations table
-- Allows admins to customize the assistant prompt and control which functions are available

-- Custom prompt field (optional - if null, uses default prompt)
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS requests_assistant_custom_prompt TEXT;

-- Function availability toggles (all default to true for backward compatibility)
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS requests_assistant_enable_user_status BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS requests_assistant_enable_all_requests BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS requests_assistant_enable_queue BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS requests_assistant_enable_played BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS requests_assistant_enable_popular BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS requests_assistant_enable_count BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS requests_assistant_enable_search BOOLEAN DEFAULT TRUE;

-- Quick action button toggles (default to true for backward compatibility)
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS requests_assistant_show_quick_actions BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS requests_assistant_quick_action_has_played BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS requests_assistant_quick_action_when_will_play BOOLEAN DEFAULT TRUE;

-- Add comments for documentation
COMMENT ON COLUMN public.organizations.requests_assistant_custom_prompt IS 'Custom system prompt for the TipJar assistant. If null, uses default prompt. Can include placeholders like {artistName}, {location}, etc.';
COMMENT ON COLUMN public.organizations.requests_assistant_enable_user_status IS 'Allow assistant to check user''s own request status';
COMMENT ON COLUMN public.organizations.requests_assistant_enable_all_requests IS 'Allow assistant to show all recent requests';
COMMENT ON COLUMN public.organizations.requests_assistant_enable_queue IS 'Allow assistant to show queue/pending requests';
COMMENT ON COLUMN public.organizations.requests_assistant_enable_played IS 'Allow assistant to show played songs';
COMMENT ON COLUMN public.organizations.requests_assistant_enable_popular IS 'Allow assistant to show most popular songs';
COMMENT ON COLUMN public.organizations.requests_assistant_enable_count IS 'Allow assistant to show request statistics';
COMMENT ON COLUMN public.organizations.requests_assistant_enable_search IS 'Allow assistant to search for specific songs';
COMMENT ON COLUMN public.organizations.requests_assistant_show_quick_actions IS 'Show quick action buttons in the chat widget';
COMMENT ON COLUMN public.organizations.requests_assistant_quick_action_has_played IS 'Show "Has my song played yet?" quick action button';
COMMENT ON COLUMN public.organizations.requests_assistant_quick_action_when_will_play IS 'Show "When will my song play?" quick action button';