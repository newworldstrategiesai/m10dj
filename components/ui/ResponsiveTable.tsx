/**
 * ResponsiveTable Component
 * 
 * Automatically switches between table view (desktop) and card view (mobile)
 * for better mobile UX
 */

import React from 'react';

interface Column<T> {
  key: string;
  label: string;
  render: (item: T) => React.ReactNode;
  mobileHide?: boolean; // Hide this column on mobile cards
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  renderCard: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string | number;
  emptyMessage?: string;
  loading?: boolean;
}

export function ResponsiveTable<T>({
  data,
  columns,
  renderCard,
  keyExtractor,
  emptyMessage = 'No data found',
  loading = false
}: ResponsiveTableProps<T>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {/* Mobile View: Cards */}
      <div className="lg:hidden space-y-3">
        {data.map((item, index) => (
          <div key={keyExtractor(item, index)}>
            {renderCard(item, index)}
          </div>
        ))}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((item, index) => (
              <tr
                key={keyExtractor(item, index)}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                  >
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default ResponsiveTable;

