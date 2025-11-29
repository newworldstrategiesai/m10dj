'use client';

import Link from 'next/link';

export function SkipLink({ href = '#skip', children = 'Skip to main content' }: { href?: string; children?: string }) {
  return (
    <Link
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand focus:text-black focus:font-semibold focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2"
      aria-label="Skip to main content"
    >
      {children}
    </Link>
  );
}

