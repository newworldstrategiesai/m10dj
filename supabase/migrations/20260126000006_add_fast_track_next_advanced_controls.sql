-- Add advanced controls for Fast Track and Next buttons
-- Allows admins to control not just visibility, but also how and when they appear

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS requests_fast_track_display_mode TEXT DEFAULT 'conditional' CHECK (requests_fast_track_display_mode IN ('always', 'conditional', 'never')),
ADD COLUMN IF NOT EXISTS requests_fast_track_display_style TEXT DEFAULT 'compact' CHECK (requests_fast_track_display_style IN ('compact', 'expanded', 'inline', 'separate')),
ADD COLUMN IF NOT EXISTS requests_fast_track_min_amount INTEGER, -- Minimum payment amount in cents to show fast track (NULL = use default logic)
ADD COLUMN IF NOT EXISTS requests_fast_track_min_percentage INTEGER, -- Minimum percentage of top preset to show (e.g., 50 = show if amount >= 50% of top preset)
ADD COLUMN IF NOT EXISTS requests_fast_track_label TEXT, -- Custom label (NULL = use default "Fast-Track")
ADD COLUMN IF NOT EXISTS requests_fast_track_description TEXT, -- Custom description/help text
ADD COLUMN IF NOT EXISTS requests_fast_track_icon TEXT, -- Icon name (e.g., 'zap', 'rocket', 'flash') - NULL = use default

ADD COLUMN IF NOT EXISTS requests_next_display_mode TEXT DEFAULT 'conditional' CHECK (requests_next_display_mode IN ('always', 'conditional', 'never')),
ADD COLUMN IF NOT EXISTS requests_next_display_style TEXT DEFAULT 'compact' CHECK (requests_next_display_style IN ('compact', 'expanded', 'inline', 'separate')),
ADD COLUMN IF NOT EXISTS requests_next_min_amount INTEGER, -- Minimum payment amount in cents to show next (NULL = use default logic)
ADD COLUMN IF NOT EXISTS requests_next_min_percentage INTEGER, -- Minimum percentage of top preset to show
ADD COLUMN IF NOT EXISTS requests_next_label TEXT, -- Custom label (NULL = use default "Next Song")
ADD COLUMN IF NOT EXISTS requests_next_description TEXT, -- Custom description/help text
ADD COLUMN IF NOT EXISTS requests_next_icon TEXT, -- Icon name - NULL = use default

-- Display priority: which button to show first/emphasize
ADD COLUMN IF NOT EXISTS requests_priority_buttons_order TEXT DEFAULT 'fast_track_first' CHECK (requests_priority_buttons_order IN ('fast_track_first', 'next_first', 'together'));

-- Add comments
COMMENT ON COLUMN public.organizations.requests_fast_track_display_mode IS 'When to show fast track: always (always visible), conditional (only when conditions met), never (hidden)';
COMMENT ON COLUMN public.organizations.requests_fast_track_display_style IS 'How to display: compact (radio style), expanded (full card), inline (with amount), separate (own section)';
COMMENT ON COLUMN public.organizations.requests_fast_track_min_amount IS 'Minimum payment amount in cents to show fast track button (NULL = use default: show when amount < top preset)';
COMMENT ON COLUMN public.organizations.requests_fast_track_min_percentage IS 'Minimum percentage of top preset amount to show fast track (e.g., 50 = show if amount >= 50% of top preset, NULL = use default logic)';
COMMENT ON COLUMN public.organizations.requests_fast_track_label IS 'Custom button label (NULL = use default "Fast-Track")';
COMMENT ON COLUMN public.organizations.requests_fast_track_description IS 'Custom description/help text for fast track button';
COMMENT ON COLUMN public.organizations.requests_fast_track_icon IS 'Icon name from lucide-react (e.g., zap, rocket, flash, NULL = use default)';

COMMENT ON COLUMN public.organizations.requests_next_display_mode IS 'When to show next button: always (always visible), conditional (only when conditions met), never (hidden)';
COMMENT ON COLUMN public.organizations.requests_next_display_style IS 'How to display next button: compact (radio style), expanded (full card), inline (with amount), separate (own section)';
COMMENT ON COLUMN public.organizations.requests_next_min_amount IS 'Minimum payment amount in cents to show next button (NULL = use default: show when amount < top preset)';
COMMENT ON COLUMN public.organizations.requests_next_min_percentage IS 'Minimum percentage of top preset amount to show next (NULL = use default logic)';
COMMENT ON COLUMN public.organizations.requests_next_label IS 'Custom button label (NULL = use default "Next Song")';
COMMENT ON COLUMN public.organizations.requests_next_description IS 'Custom description/help text for next button';
COMMENT ON COLUMN public.organizations.requests_next_icon IS 'Icon name from lucide-react (NULL = use default)';

COMMENT ON COLUMN public.organizations.requests_priority_buttons_order IS 'Display order: fast_track_first, next_first, or together (side by side)';

-- Set defaults for existing organizations based on current show settings
-- This preserves existing behavior: if show toggle is true (or NULL/defaults to true), use 'conditional'
-- If show toggle is explicitly false, use 'never'
-- This ensures no visible change for existing pages
UPDATE public.organizations
SET 
  requests_fast_track_display_mode = CASE 
    WHEN requests_show_fast_track = false THEN 'never'
    ELSE 'conditional'  -- Default behavior: show when amount < top preset
  END,
  requests_fast_track_display_style = COALESCE(requests_fast_track_display_style, 'compact'),
  requests_next_display_mode = CASE 
    WHEN requests_show_next_song = false THEN 'never'
    ELSE 'conditional'  -- Default behavior: show when amount < top preset
  END,
  requests_next_display_style = COALESCE(requests_next_display_style, 'compact'),
  requests_priority_buttons_order = COALESCE(requests_priority_buttons_order, 'fast_track_first')
WHERE 
  requests_fast_track_display_mode IS NULL 
  OR requests_next_display_mode IS NULL
  OR requests_fast_track_display_style IS NULL
  OR requests_next_display_style IS NULL
  OR requests_priority_buttons_order IS NULL;
