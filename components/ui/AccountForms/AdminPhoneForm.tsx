'use client';

import Button from '@/components/ui/Button/Button';
import Card from '@/components/ui/Card/Card';
import { updateAdminPhoneNumber } from '@/utils/auth-helpers/server';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

interface Props {
  /** Current phone number for SMS notifications. Empty string when not set. */
  adminPhoneNumber: string;
}

export default function AdminPhoneForm({ adminPhoneNumber }: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const newPhone = (form.elements.namedItem('newAdminPhoneNumber') as HTMLInputElement)?.value?.trim();
    if (newPhone === adminPhoneNumber) {
      return;
    }
    setIsSubmitting(true);
    const formData = new FormData(form);
    formData.set('newAdminPhoneNumber', newPhone ?? '');
    try {
      const redirectUrl = await updateAdminPhoneNumber(formData);
      router.push(redirectUrl);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card
      title="Phone number"
      description="Used for SMS notifications (e.g. new contact form submissions and leads). Add or update your number here."
      footer={
        <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
          <p className="pb-4 sm:pb-0 text-zinc-400 dark:text-zinc-500 text-sm">
            Optional. Include country code (e.g. 9015551234 for US).
          </p>
          <Button
            variant="slim"
            type="submit"
            form="adminPhoneForm"
            loading={isSubmitting}
          >
            Update phone number
          </Button>
        </div>
      }
    >
      <div className="mt-8 mb-4 text-xl font-semibold">
        <form id="adminPhoneForm" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <label htmlFor="newAdminPhoneNumber" className="text-zinc-300 dark:text-zinc-400">
              Your phone number
            </label>
            <input
              className="w-full max-w-md p-3 rounded-md bg-zinc-800 border border-zinc-600 text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:ring-emerald-500 focus:ring-1 focus:outline-none dark:bg-zinc-900 dark:border-zinc-600 dark:text-zinc-100"
              type="tel"
              name="newAdminPhoneNumber"
              id="newAdminPhoneNumber"
              placeholder="e.g. 9015551234"
              defaultValue={adminPhoneNumber}
              maxLength={20}
              autoComplete="tel"
            />
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
              Digits only, no spaces or dashes. Used to send you SMS alerts.
            </p>
          </div>
        </form>
      </div>
    </Card>
  );
}