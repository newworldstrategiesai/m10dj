'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/utils/cn';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  items: FAQItem[];
  className?: string;
}

export function FAQ({ items, className }: FAQProps) {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {items.map((item, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden"
        >
          <button
            onClick={() => toggleItem(index)}
            className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            aria-expanded={openItems.has(index)}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white pr-4">
              {item.question}
            </h3>
            {openItems.has(index) ? (
              <ChevronUp className="w-5 h-5 text-tipjar-primary-500 flex-shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-tipjar-primary-500 flex-shrink-0" />
            )}
          </button>
          {openItems.has(index) && (
            <div className="px-6 pb-4">
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {item.answer}
                </p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}


