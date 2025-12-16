'use client';

import React, { useState, useEffect } from 'react';
import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DJPhoneNumberProps {
  djProfileId: string;
  // Removed fallbackNumber - we NEVER show real phone numbers
  // Only proxy/virtual numbers are displayed for call tracking
}

export default function DJPhoneNumber({ djProfileId }: DJPhoneNumberProps) {
  const [virtualNumber, setVirtualNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Fetch virtual number - ONLY proxy numbers are used for call tracking
    // Real phone numbers are NEVER displayed on profile pages
    fetch(`/api/djdash/virtual-numbers?dj_profile_id=${djProfileId}`)
      .then(res => {
        if (res.status === 404) {
          // No virtual number assigned - this is OK, we just won't show a number
          setIsLoading(false);
          return;
        }
        return res.json();
      })
      .then(data => {
        if (data && data.success && data.virtualNumber) {
          setVirtualNumber(data.virtualNumber.virtual_number);
        }
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error fetching virtual number:', error);
        setIsLoading(false);
      });

    return () => window.removeEventListener('resize', checkMobile);
  }, [djProfileId]);

  const handleCallClick = async () => {
    // Only use virtual number - NEVER fallback to real number
    if (!virtualNumber) return;

    // Log the call attempt for tracking
    try {
      await fetch('/api/djdash/calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dj_profile_id: djProfileId,
          virtual_number: virtualNumber,
          caller_number: 'unknown', // Will be filled by Twilio webhook
          page_url: window.location.href,
          call_status: 'initiated'
        })
      });
    } catch (error) {
      console.error('Error logging call:', error);
    }

    // For mobile, use tel: link
    if (isMobile) {
      window.location.href = `tel:${virtualNumber.replace(/\D/g, '')}`;
    } else {
      // For desktop, show number (they'll need to dial manually)
      // Or you could use Twilio's click-to-call API
      alert(`Please call: ${formatPhoneNumber(virtualNumber)}`);
    }
  };

  const formatPhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      // Handle +1 country code
      const withoutCountry = cleaned.slice(1);
      return `(${withoutCountry.slice(0, 3)}) ${withoutCountry.slice(3, 6)}-${withoutCountry.slice(6)}`;
    }
    return phone;
  };

  // ONLY display virtual number - never show real numbers
  const displayNumber = virtualNumber;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
        <Phone className="w-5 h-5 animate-pulse" />
        <span className="animate-pulse">Loading...</span>
      </div>
    );
  }

  // If no virtual number is available, don't show anything
  // This ensures real phone numbers are NEVER displayed
  if (!displayNumber) {
    return (
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
        <Phone className="w-4 h-4" />
        <span>Contact via form below</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {isMobile ? (
        <Button
          onClick={handleCallClick}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
          size="lg"
        >
          <Phone className="w-5 h-5" />
          Call {formatPhoneNumber(displayNumber)}
        </Button>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <Phone className="w-5 h-5" />
            <span className="text-lg font-semibold">{formatPhoneNumber(displayNumber)}</span>
          </div>
          <Button
            onClick={handleCallClick}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Click to Call
          </Button>
        </div>
      )}
    </div>
  );
}

