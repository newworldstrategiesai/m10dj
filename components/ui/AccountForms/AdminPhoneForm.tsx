'use client';

import { Button } from '@/components/ui/button';
import Card from '@/components/ui/Card';
import { updateAdminPhoneNumber } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

interface Props {
  adminPhoneNumber: string;
}

export default function AdminPhoneForm({ adminPhoneNumber }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsSubmitting(true);
    // This will call the updateAdminPhoneNumber server action
    await handleRequest(e, updateAdminPhoneNumber, router);
    setIsSubmitting(false);
  };

  return (
    <Card
      title="Admin Phone Number"
      description="SMS notifications for new contact form submissions will be sent to this number."
      footer={
        <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
          <p className="pb-4 sm:pb-0">
            We'll use this number to notify you of new contact form submissions via SMS.
          </p>
          <Button
            variant="slim"
            type="submit"
            form="adminPhoneForm"
            loading={isSubmitting}
          >
            Update Phone Number
          </Button>
        </div>
      }
    >
      <div className="mt-8 mb-4 text-xl font-semibold">
        <form id="adminPhoneForm" onSubmit={handleSubmit}>
          <input
            type="hidden"
            name="adminPhoneNumber"
            value={adminPhoneNumber}
          />
          <div className="grid gap-2">
            <label htmlFor="newAdminPhoneNumber">New phone number</label>
            <input
              className="w-full p-3 rounded-md bg-zinc-800 border border-zinc-600 text-white focus:border-emerald-500 focus:ring-emerald-500 focus:ring-1 focus:outline-none"
              type="tel"
              name="newAdminPhoneNumber"
              id="newAdminPhoneNumber"
              placeholder="Enter admin phone number (e.g., 9014977001)"
              defaultValue={adminPhoneNumber}
              maxLength={20}
              required
            />
            <p className="text-sm text-zinc-400 mt-1">
              Enter phone number without spaces or special characters (e.g., 9014977001)
            </p>
          </div>
        </form>
      </div>
    </Card>
  );
}