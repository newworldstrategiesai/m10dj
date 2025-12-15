'use client';

import Link from 'next/link';

export function BrandingBadge() {
  return (
    <Link
      href="https://tipjar.live"
      target="_blank"
      rel="noopener noreferrer"
      className="px-3 py-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-lg text-white text-xs font-semibold transition-all duration-200 flex items-center gap-2 border border-white/20"
    >
      <span>Powered by</span>
      <span className="text-emerald-400">TipJar.live</span>
      <span>→</span>
    </Link>
  );
}

