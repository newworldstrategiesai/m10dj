import Link from 'next/link';
import { useRouter } from 'next/router';
import { FileText, CreditCard, Music, CheckCircle, Calendar, Receipt } from 'lucide-react';

export default function QuoteBottomNav({ quoteId }) {
  const router = useRouter();
  const currentPath = router.pathname;

  const navItems = [
    {
      href: `/quote/${quoteId}/confirmation`,
      label: 'Overview',
      icon: CheckCircle,
      pathMatch: 'confirmation'
    },
    {
      href: `/quote/${quoteId}`,
      label: 'Services',
      icon: FileText,
      pathMatch: 'quote/[id]' // Match the index page
    },
    {
      href: `/quote/${quoteId}/my-songs`,
      label: 'My Songs',
      icon: Music,
      pathMatch: 'my-songs'
    },
    {
      href: `/quote/${quoteId}/payment`,
      label: 'Payment',
      icon: CreditCard,
      pathMatch: 'payment'
    },
    {
      href: `/quote/${quoteId}/invoice`,
      label: 'Invoice',
      icon: Receipt,
      pathMatch: 'invoice'
    }
  ];

  const isActive = (item) => {
    if (item.pathMatch === 'quote/[id]') {
      return currentPath === `/quote/[id]` && !router.pathname.includes('/confirmation');
    }
    return currentPath.includes(item.pathMatch);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 shadow-lg safe-area-inset-bottom">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors min-w-[60px] ${
                  active
                    ? 'text-brand dark:text-brand'
                    : 'text-gray-600 dark:text-gray-400 hover:text-brand dark:hover:text-brand'
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${active ? 'text-brand dark:text-brand' : ''}`} />
                <span className={`text-xs font-medium ${active ? 'text-brand dark:text-brand' : ''}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

