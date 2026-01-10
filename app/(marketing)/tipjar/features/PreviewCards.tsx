'use client';

import { Card } from '@/components/ui/card';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AdminDashboardDemo } from './AdminDashboardDemo';

export function PreviewCards() {
  const [guestLoading, setGuestLoading] = useState(true);

  // Use a demo organization slug for the guest view
  const guestPreviewUrl = '/m10djcompany/requests?preview=true';

  // Get the base URL dynamically for client-side
  const [baseUrl, setBaseUrl] = useState('');
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const fullGuestUrl = baseUrl ? `${baseUrl}${guestPreviewUrl}` : guestPreviewUrl;

  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
      {/* DJ Dashboard Preview */}
      <Card className="p-8 dark:bg-gray-800 dark:border-gray-700 hover:shadow-xl transition-shadow">
        <div className="relative bg-gradient-to-br from-emerald-50 to-green-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl mb-6 aspect-[9/16] flex items-center justify-center border-2 border-emerald-100 dark:border-emerald-800 overflow-hidden">
          {/* iPhone frame wrapper */}
          <div 
            className="relative bg-gray-900 rounded-[40px] p-2 shadow-2xl"
            style={{ 
              width: '220px',
              height: '450px',
              border: '3px solid #1a1a1a'
            }}
          >
            {/* Dynamic Island / Notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-10" />
            
            {/* Screen */}
            <div 
              className="relative bg-black rounded-[32px] overflow-hidden"
              style={{ width: '100%', height: '100%' }}
            >
              <div
                className="relative"
                style={{ 
                  transform: 'scale(0.57)',
                  transformOrigin: 'top left',
                  width: '375px',
                  height: '812px',
                  borderRadius: '32px',
                  overflow: 'hidden'
                }}
              >
                <div className="bg-gray-50 dark:bg-gray-900 w-full h-full overflow-y-auto">
                  <AdminDashboardDemo />
                </div>
              </div>
            </div>
            
            {/* Home indicator */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-20 h-1 bg-gray-600 rounded-full" />
          </div>
        </div>
        <h3 className="text-2xl font-bold mb-3 dark:text-white">DJ Dashboard</h3>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
          Real-time view of all tips and requests. Manage your queue, see earnings, and track performance with beautiful, easy-to-read charts.
        </p>
        <ul className="space-y-2">
          <li className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-gray-600 dark:text-gray-300 text-sm">Live earnings tracker</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-gray-600 dark:text-gray-300 text-sm">Request queue management</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-gray-600 dark:text-gray-300 text-sm">Performance analytics</span>
          </li>
        </ul>
      </Card>
      
      {/* Guest Experience Preview */}
      <Card className="p-8 dark:bg-gray-800 dark:border-gray-700 hover:shadow-xl transition-shadow">
        <div className="relative bg-gradient-to-br from-emerald-50 to-green-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl mb-6 aspect-[9/16] flex items-center justify-center border-2 border-emerald-100 dark:border-emerald-800 overflow-hidden">
          {/* iPhone frame wrapper */}
          <div 
            className="relative bg-gray-900 rounded-[40px] p-2 shadow-2xl"
            style={{ 
              width: '220px',
              height: '450px',
              border: '3px solid #1a1a1a'
            }}
          >
            {/* Dynamic Island / Notch */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-10" />
            
            {/* Screen */}
            <div 
              className="relative bg-black rounded-[32px] overflow-hidden"
              style={{ width: '100%', height: '100%' }}
            >
              {guestLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-green-400 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-gray-400">Loading requests page...</p>
                  </div>
                </div>
              )}
              <iframe
                src={fullGuestUrl}
                className="border-0 bg-black"
                style={{ 
                  transform: 'scale(0.57)',
                  transformOrigin: 'top left',
                  width: '375px',
                  height: '812px',
                  borderRadius: '32px'
                }}
                title="Guest Experience Preview"
                onLoad={() => setGuestLoading(false)}
                onError={() => setGuestLoading(false)}
                allow="payment; camera; microphone"
              />
            </div>
            
            {/* Home indicator */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-20 h-1 bg-gray-600 rounded-full" />
          </div>
        </div>
        <h3 className="text-2xl font-bold mb-3 dark:text-white">Guest Experience</h3>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
          Clean, mobile-optimized interface. Guests can tip and request songs in seconds with an intuitive, beautiful design.
        </p>
        <ul className="space-y-2">
          <li className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-gray-600 dark:text-gray-300 text-sm">One-tap song requests</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-gray-600 dark:text-gray-300 text-sm">Fast, secure checkout</span>
          </li>
          <li className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-gray-600 dark:text-gray-300 text-sm">Works on any device</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
