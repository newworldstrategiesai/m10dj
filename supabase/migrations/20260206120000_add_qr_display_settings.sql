-- Migration: Add QR display page settings to organizations
-- Lets admins configure the look of their QR display page (/{slug}/qr)

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizations'
      AND column_name = 'qr_display_background'
  ) THEN
    ALTER TABLE public.organizations
    ADD COLUMN qr_display_background TEXT DEFAULT 'aurora';
    COMMENT ON COLUMN public.organizations.qr_display_background IS 'QR display page background: aurora (animated) or plain.';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizations'
      AND column_name = 'qr_display_halo_enabled'
  ) THEN
    ALTER TABLE public.organizations
    ADD COLUMN qr_display_halo_enabled BOOLEAN DEFAULT true;
    COMMENT ON COLUMN public.organizations.qr_display_halo_enabled IS 'Whether to show the Siri-like glowing halo around the QR code on the display page.';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizations'
      AND column_name = 'qr_display_theme_toggle_enabled'
  ) THEN
    ALTER TABLE public.organizations
    ADD COLUMN qr_display_theme_toggle_enabled BOOLEAN DEFAULT true;
    COMMENT ON COLUMN public.organizations.qr_display_theme_toggle_enabled IS 'Whether to show the light/dark mode toggle on the QR display page.';
  END IF;
END $$;
