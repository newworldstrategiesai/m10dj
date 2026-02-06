'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  const isChunkLoadError =
    error?.name === 'ChunkLoadError' ||
    (error?.message && String(error.message).includes('Loading chunk'));

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 bg-black text-white">
      <div className="max-w-md text-center space-y-4">
        <h2 className="text-xl font-semibold">
          {isChunkLoadError ? 'Page update' : 'Something went wrong'}
        </h2>
        <p className="text-gray-400 text-sm">
          {isChunkLoadError
            ? 'The app was updated. Refresh the page to load the latest version.'
            : 'An unexpected error occurred.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => (isChunkLoadError ? window.location.reload() : reset())}
            className="bg-white text-black hover:bg-gray-200"
          >
            {isChunkLoadError ? 'Refresh page' : 'Try again'}
          </Button>
          {!isChunkLoadError && (
            <Button variant="outline" onClick={() => (window.location.href = '/')} className="border-gray-600">
              Go home
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
