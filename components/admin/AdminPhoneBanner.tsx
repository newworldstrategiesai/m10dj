/**
 * Admin Phone Banner
 *
 * Shows a banner when the logged-in admin has not set their phone number for
 * SMS notifications (e.g. new contact form submissions). Link goes to Account
 * where AdminPhoneForm lives. Dismissible per session or permanently (localStorage).
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Phone, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';

const DISMISS_KEY = 'admin_phone_banner_dismissed';

function hasPhone(value: string | null | undefined): boolean {
  if (value == null) return false;
  const trimmed = String(value).trim();
  return trimmed.length >= 10;
}

export default function AdminPhoneBanner() {
  const [showBanner, setShowBanner] = useState<boolean | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(DISMISS_KEY);
      if (stored === 'true') setDismissed(true);
    }

    const check = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('setting_value')
          .eq('setting_key', 'admin_phone_number')
          .maybeSingle();

        if (error) {
          setShowBanner(true);
          return;
        }
        setShowBanner(!hasPhone(data?.setting_value));
      } catch {
        setShowBanner(true);
      }
    };

    check();
  }, [supabase]);

  if (showBanner !== true || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DISMISS_KEY, 'true');
      setDismissed(true);
    }
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4 relative mx-2 sm:mx-4 lg:mx-6">
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="flex-shrink-0 pt-0.5">
          <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-xs sm:text-sm text-amber-800 dark:text-amber-200 mb-0.5">
                Add your phone number
              </h3>
              <p className="text-xs text-amber-800/90 dark:text-amber-200/90 line-clamp-1 sm:line-clamp-2">
                Get SMS notifications for new contact form submissions and leads. Add your number in Account settings.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href="/account">
                <Button
                  size="sm"
                  className="h-7 sm:h-8 px-2 sm:px-3 flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap text-xs bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-600 dark:hover:bg-amber-700"
                >
                  <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="hidden sm:inline">Add phone</span>
                  <span className="sm:hidden">Add</span>
                  <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </Button>
              </Link>
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors text-amber-700 dark:text-amber-300"
                aria-label="Dismiss banner"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
