/**
 * Request Page Step - Show user their request page URL
 */

import { useState } from 'react';
import { ExternalLink, Copy, CheckCircle, QrCode } from 'lucide-react';
import { OnboardingStepProps } from '../OnboardingWizard';

export default function RequestPageStep({
  organization,
  onComplete,
  onNext
}: OnboardingStepProps) {
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_SITE_URL || '';
  const requestUrl = `${baseUrl}/${organization.slug}/requests`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(requestUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleGenerateQR = async () => {
    try {
      // Generate QR code via API
      const response = await fetch('/api/qr-code/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: requestUrl })
      });
      if (response.ok) {
        const data = await response.json();
        setQrCodeUrl(data.qrCodeUrl);
      }
    } catch (err) {
      console.error('Failed to generate QR code:', err);
      // Fallback to external QR code service
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(requestUrl)}`);
    }
  };

  const handleContinue = () => {
    onNext();
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Your Request Page is Ready! 🎉
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Share this link anywhere - social media, email, or print it on flyers
        </p>
      </div>

      {/* Request URL */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Your Request Page URL
        </label>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            value={requestUrl}
            readOnly
            className="flex-1 min-w-0 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-xs sm:text-sm break-all"
          />
          <div className="flex gap-2 sm:gap-3 flex-shrink-0">
            <button
              onClick={handleCopy}
              className="px-3 sm:px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Copy</span>
                </>
              )}
            </button>
            <a
              href={requestUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 sm:px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2 text-sm"
            >
              <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Test</span>
            </a>
          </div>
        </div>
      </div>

      {/* QR Code */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          QR Code
        </label>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {qrCodeUrl ? (
            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 flex-shrink-0">
              <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32" />
            </div>
          ) : (
            <button
              onClick={handleGenerateQR}
              className="px-4 sm:px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2 text-sm sm:text-base flex-shrink-0"
            >
              <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="whitespace-nowrap">Generate QR Code</span>
            </button>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400 flex-1">
            Generate a QR code to print on flyers or display at your events. 
            Anyone can scan it to request songs or shoutouts.
          </p>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          💡 Pro Tips:
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
          <li>Share this link on social media before your events</li>
          <li>Add it to your email signature</li>
          <li>Print QR codes on table cards or flyers</li>
          <li>Display it on a screen during your events</li>
        </ul>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleContinue}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg transition-all"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

