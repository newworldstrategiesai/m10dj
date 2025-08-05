import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs({ items }) {
  if (!items || items.length === 0) return null;

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-8" aria-label="Breadcrumb">
      <Link 
        href="/" 
        className="flex items-center hover:text-brand-gold transition-colors"
        aria-label="Home"
      >
        <Home className="w-4 h-4" />
      </Link>
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          <ChevronRight className="w-4 h-4" />
          {item.href ? (
            <Link 
              href={item.href} 
              className="hover:text-brand-gold transition-colors"
              aria-current={index === items.length - 1 ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 dark:text-white font-medium" aria-current="page">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}

// Generate breadcrumb items for common page types
export const generateBreadcrumbs = {
  blog: (post) => [
    { label: 'Blog', href: '/blog' },
    { label: post?.title || 'Post' }
  ],
  
  venue: (venue) => [
    { label: 'Venues', href: '/venues' },
    { label: venue?.venue_name || 'Venue' }
  ],
  
  location: (location) => [
    { label: 'Service Areas', href: '/#service-areas' },
    { label: location?.name || 'Location' }
  ],
  
  service: (service) => [
    { label: 'Services', href: '/services' },
    { label: service }
  ]
};