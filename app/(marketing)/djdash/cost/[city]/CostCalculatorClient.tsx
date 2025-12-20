'use client';

import { useRouter } from 'next/navigation';
import DJCostCalculator from '@/components/djdash/DJCostCalculator';

interface CostCalculatorClientProps {
  city: string;
  state?: string;
  eventType?: string;
}

export default function CostCalculatorClient({
  city,
  state,
  eventType
}: CostCalculatorClientProps) {
  const router = useRouter();
  
  const handleInquiryClick = (inputs: any, result: any) => {
    // Create city slug
    const citySlug = inputs.city.toLowerCase().replace(/\s+/g, '-');
    
    // Build query params
    const params = new URLSearchParams({
      event_type: inputs.eventType,
      duration: inputs.durationHours.toString(),
      ...(inputs.state && { state: inputs.state }),
      ...(inputs.eventDate && { date: inputs.eventDate }),
      ...(inputs.guestCountRange && { guests: inputs.guestCountRange }),
      estimated_low: result.estimatedLow.toString(),
      estimated_high: result.estimatedHigh.toString()
    });
    
    // Navigate to find DJ page
    router.push(`/djdash/find-dj/${citySlug}/${inputs.eventType}?${params.toString()}`);
  };
  
  return (
    <DJCostCalculator
      city={city}
      state={state}
      eventType={eventType}
      onInquiryClick={handleInquiryClick}
    />
  );
}

