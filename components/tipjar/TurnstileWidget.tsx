'use client';

import Script from 'next/script';

const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

type Theme = 'light' | 'dark' | 'auto';

interface TurnstileWidgetProps {
  /** Cloudflare Turnstile site key (NEXT_PUBLIC_TURNSTILE_SITE_KEY). If not set, widget is not rendered. */
  siteKey?: string;
  /** Theme: light, dark, or auto (default). */
  theme?: Theme;
  /** Invisible widget (no checkbox). Use when you want to run in background. */
  invisible?: boolean;
}

/**
 * Cloudflare Turnstile widget for signup/contact forms.
 * Renders inside a form; when the challenge is solved, Turnstile injects
 * an input named "cf-turnstile-response" so the token is submitted with the form.
 * If siteKey is not set, renders nothing (server will skip verification).
 */
export default function TurnstileWidget({
  siteKey,
  theme = 'auto',
  invisible = false,
}: TurnstileWidgetProps) {
  if (!siteKey) return null;

  return (
    <>
      <Script src={TURNSTILE_SCRIPT} strategy="afterInteractive" />
      <div
        className="cf-turnstile"
        data-sitekey={siteKey}
        data-theme={theme}
        {...(invisible ? { 'data-size': 'invisible' } : {})}
      />
    </>
  );
}
