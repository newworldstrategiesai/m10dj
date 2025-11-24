'use client';

import { useState, useEffect } from 'react';
import { Eye, X } from 'lucide-react';

interface ViewAsBannerProps {
  organizationName: string;
}

export default function ViewAsBanner({ organizationName }: ViewAsBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if we're in view-as mode
    const viewAs = document.cookie
      .split('; ')
      .find(row => row.startsWith('admin_view_as_org_id='))
      ?.split('=')[1];
    
    setIsVisible(!!viewAs);
  }, []);

  const handleExit = async () => {
    try {
      const response = await fetch('/api/admin/view-as', {
        method: 'DELETE',
      });

      if (response.ok) {
        setIsVisible(false);
        window.location.reload();
      }
    } catch (error) {
      console.error('Error exiting view-as mode:', error);
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-amber-500 text-white px-4 py-3 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-2">
        <Eye className="w-5 h-5" />
        <span className="font-medium">
          Viewing as: <strong>{organizationName}</strong>
        </span>
      </div>
      <button
        onClick={handleExit}
        className="flex items-center gap-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-md transition-colors text-sm font-medium"
      >
        <X className="w-4 h-4" />
        Exit View
      </button>
    </div>
  );
}


