'use client';

import DJCostCalculator from './DJCostCalculator';
import { useRouter } from 'next/navigation';

interface EmbeddedCalculatorProps {
  city: string;
  state?: string;
  eventType?: string;
}

/**
 * Embedded calculator widget for city pages
 * Handles navigation to inquiry flow
 */
export default function EmbeddedCalculator({
  city,
  state,
  eventType
}: EmbeddedCalculatorProps) {
  const router = useRouter();
  
  const handleInquiryClick = (inputs: any, result: any) => {
    // Navigate to find DJ page with pre-filled data
    const params = new URLSearchParams({
      city: inputs.city,
      event_type: inputs.eventType,
      duration: inputs.durationHours.toString(),
      ...(inputs.state && { state: inputs.state }),
      ...(inputs.eventDate && { date: inputs.eventDate }),
      ...(inputs.guestCountRange && { guests: inputs.guestCountRange }),
      estimated_low: result.estimatedLow.toString(),
      estimated_high: result.estimatedHigh.toString()
    });
    
    router.push(`/djdash/find-dj/${inputs.city}/${inputs.eventType}?${params.toString()}`);
  };
  
  return (
    <DJCostCalculator
      city={city}
      state={state}
      eventType={eventType}
      onInquiryClick={handleInquiryClick}
      embedded={true}
    />
  );
}

