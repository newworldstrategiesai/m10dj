'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

interface DashboardLinkProps {
  text: string;
  isLoggedIn: boolean;
  className?: string;
}

/**
 * Maps dashboard text references to actual admin routes
 */
const DASHBOARD_ROUTE_MAP: Record<string, string> = {
  'Dashboard → Settings → Payments': '/admin/requests-page?tab=payments',
  'Dashboard → Settings → QR Code': '/admin/requests-page?tab=design',
  'Dashboard → Settings → Subscription': '/admin/billing',
  'Dashboard → Settings → Account': '/admin/requests-page?tab=advanced',
  'Dashboard → Settings → Embed Widget': '/admin/requests-page?tab=features',
  'Dashboard → Settings → Branding': '/admin/requests-page?tab=design',
  'Dashboard → Settings → Customization': '/admin/requests-page?tab=design',
  'Dashboard → QR Code': '/admin/crowd-requests',
  'Dashboard → QR Codes': '/admin/crowd-requests',
  'Dashboard → Requests': '/admin/crowd-requests',
  'Dashboard → Crowd Requests': '/admin/crowd-requests',
  'Dashboard → Request Page': '/admin/requests-page',
  'Dashboard → Settings → Stream Alerts': '/tipjar/dashboard/stream-alerts',
  'Dashboard → Stream Alerts': '/tipjar/dashboard/stream-alerts',
  'Dashboard → Payouts': '/admin/payouts',
  'Dashboard → Venue': '/tipjar/dashboard/venue',
  'Dashboard → Music Library': '/admin/crowd-requests',
  'Dashboard → Analytics': '/admin/crowd-requests',
};

/**
 * Finds dashboard references in text and converts them to links
 */
export function DashboardLink({ text, isLoggedIn, className = '' }: DashboardLinkProps) {
  if (!isLoggedIn) {
    // Not logged in - return plain text
    return <span className={className}>{text}</span>;
  }

  // Check if entire text matches a route
  if (DASHBOARD_ROUTE_MAP[text]) {
    return (
      <Link 
        href={DASHBOARD_ROUTE_MAP[text]} 
        className={`text-emerald-600 dark:text-emerald-400 hover:underline font-medium inline-flex items-center gap-1 ${className}`}
      >
        {text}
        <ExternalLink className="w-3 h-3" />
      </Link>
    );
  }

  // Check for partial matches (e.g., "Go to Dashboard → Settings → Payments")
  // Sort by length (longest first) to match more specific paths first
  const sortedRoutes = Object.entries(DASHBOARD_ROUTE_MAP).sort((a, b) => b[0].length - a[0].length);
  
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  const matchedIndices = new Set<number>();

  // Find all dashboard references (longest matches first)
  for (const [reference, route] of sortedRoutes) {
    // Escape special regex characters
    const escaped = reference.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    let match: RegExpExecArray | null;
    const matches: RegExpExecArray[] = [];
    while ((match = regex.exec(text)) !== null) {
      matches.push(match);
    }
    
    for (const match of matches) {
      const start = match.index!;
      const end = start + match[0].length;
      
      // Skip if this range was already matched by a longer pattern
      let alreadyMatched = false;
      for (let i = start; i < end; i++) {
        if (matchedIndices.has(i)) {
          alreadyMatched = true;
          break;
        }
      }
      
      if (!alreadyMatched) {
        // Mark indices as matched
        for (let i = start; i < end; i++) {
          matchedIndices.add(i);
        }
        
        // Add text before match
        if (start > lastIndex) {
          parts.push(text.slice(lastIndex, start));
        }
        
        // Add link
        parts.push(
          <Link
            key={`${route}-${start}`}
            href={route}
            className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium inline-flex items-center gap-1"
          >
            {match[0]}
            <ExternalLink className="w-3 h-3" />
          </Link>
        );
        
        lastIndex = end;
      }
    }
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  if (parts.length > 1) {
    // Has links
    return <span className={className}>{parts}</span>;
  }

  // No matches found - return plain text
  return <span className={className}>{text}</span>;
}
