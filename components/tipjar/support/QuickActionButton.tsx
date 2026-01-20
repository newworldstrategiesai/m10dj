'use client';

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

interface QuickActionButtonProps {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
}

export function QuickActionButton({
  icon: Icon,
  title,
  description,
  href,
  variant = 'primary',
  className,
}: QuickActionButtonProps) {
  const variants = {
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600',
    secondary: 'bg-purple-600 hover:bg-purple-700 text-white border-purple-600',
    outline: 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700',
  };

  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col items-start p-6 rounded-xl border-2 transition-all hover:shadow-lg hover:scale-[1.02]",
        variants[variant],
        className
      )}
    >
      <div className="mb-4 p-3 rounded-lg bg-white/10 dark:bg-gray-800/50 group-hover:scale-110 transition-transform">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm opacity-90">{description}</p>
    </Link>
  );
}
