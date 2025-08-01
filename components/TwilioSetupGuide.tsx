'use client';

import React from 'react';

import Button from '@/components/ui/Button';

interface TwilioSetupGuideProps {
  onComplete?: () => void;
}

export default function TwilioSetupGuide({ onComplete }: TwilioSetupGuideProps) {
  return (
    <div className="w-full max-w-2xl m-auto my-8 border rounded-md p-6 border-zinc-700">
      <h2 className="text-2xl font-semibold mb-4">Twilio Setup Guide</h2>
      <div className="space-y-4">
        <p className="text-gray-600">
          To use SMS features, you'll need to configure your Twilio credentials.
        </p>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Required Information:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li>Twilio Account SID</li>
            <li>Twilio Auth Token</li>
            <li>Twilio Phone Number</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h3 className="font-medium">Steps:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Log in to your Twilio Console</li>
            <li>Find your Account SID and Auth Token</li>
            <li>Purchase a phone number if you haven't already</li>
            <li>Configure your webhook URLs for SMS</li>
          </ol>
        </div>

        {onComplete && (
          <Button onClick={onComplete} className="w-full">
            I've completed the setup
          </Button>
        )}
      </div>
    </div>
  );
}