'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Copy, Download, QrCode, X, Camera, Smartphone } from 'lucide-react';
import { OnboardingData } from '../OnboardingWizard';
import { triggerConfetti } from '@/utils/confetti';

interface QRCodeScreenshotStepProps {
  data: OnboardingData;
  onNext: () => void;
  onBack: () => void;
  progress: number;
  currentStep: number;
  totalSteps: number;
  organization?: any;
}

export default function QRCodeScreenshotStep({
  data,
  onNext,
  onBack,
  progress,
  currentStep,
  totalSteps,
  organization
}: QRCodeScreenshotStepProps) {
  const [pageUrl, setPageUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showScreenshotTip, setShowScreenshotTip] = useState(true);
  const confettiTriggered = useRef(false);
  const qrCodeVisible = useRef(false);

  useEffect(() => {
    if (data.slug || organization?.slug) {
      const slug = data.slug || organization?.slug;
      const url = `https://tipjar.live/${slug}/requests`;
      setPageUrl(url);
      // Generate QR code URL (using a simple QR code API)
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(url)}`);
    }
  }, [data.slug, organization?.slug]);

  // Trigger confetti celebration when QR code becomes visible
  useEffect(() => {
    if (!confettiTriggered.current && qrCodeUrl && !qrCodeVisible.current) {
      qrCodeVisible.current = true;
      // Delay confetti slightly for better visual effect when QR code appears
      setTimeout(() => {
        triggerConfetti({
          duration: 4000,
          colors: ['#9333ea', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']
        });
        confettiTriggered.current = true;
      }, 500);
    }
  }, [qrCodeUrl]);

  function handleCopy() {
    if (pageUrl) {
      navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      {/* Screenshot Tip Notification */}
      {showScreenshotTip && qrCodeUrl && (
        <div className="mb-4 sm:mb-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl shadow-2xl p-3 sm:p-4 md:p-6 relative animate-in slide-in-from-top-2 duration-300">
          <button
            onClick={() => setShowScreenshotTip(false)}
            className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <div className="flex items-start gap-2 sm:gap-4 pr-7 sm:pr-8">
            <div className="flex-shrink-0 mt-0.5">
              <Camera className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">📸 Perfect Screenshot Opportunity!</h4>
              <p className="text-purple-50 text-xs sm:text-sm mb-2 sm:mb-3">
                Take a screenshot of this screen - it's designed to be shared! Your QR code is ready to use immediately. 
                You can post it on social media, print it, or send it directly to fans.
              </p>
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-purple-100">
                <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">Tip: Use your phone's screenshot feature to capture this QR code</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Screenshot-Optimized Design */}
      <div className="bg-gradient-to-br from-white via-purple-50/30 to-white dark:from-gray-900 dark:via-purple-900/10 dark:to-gray-900 rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8 lg:p-12 border border-purple-100 dark:border-purple-900/50">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 md:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
            Your QR Code is Ready! 🎉
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400">
            Step {currentStep} of {totalSteps} • Screenshot this and start sharing
          </p>
        </div>

        {/* QR Code - Featured Prominently for Screenshot */}
        {qrCodeUrl && (
          <div className="mb-6 sm:mb-8 p-4 sm:p-6 md:p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border-2 border-purple-200 dark:border-purple-800">
            <div className="text-center mb-4 sm:mb-6">
              <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-3 sm:mb-4">
                <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                <span className="text-xs sm:text-sm font-semibold text-purple-700 dark:text-purple-300">
                  Scan to Request Songs & Tips
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                {data.displayName || 'Your Page'}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 px-2">
                Share this QR code anywhere - events, social media, business cards
              </p>
            </div>
            
            {/* Large QR Code Display */}
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="p-3 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-lg">
                <img
                  src={qrCodeUrl}
                  alt="QR Code for TipJar Requests Page"
                  className="w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80"
                />
              </div>
            </div>

            {/* URL Display */}
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 text-center uppercase tracking-wide">
                Your Page URL
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 px-3 sm:px-4 py-2 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600 min-w-0">
                  <span className="font-mono text-xs sm:text-sm text-gray-900 dark:text-white break-all block">
                    {pageUrl}
                  </span>
                </div>
                <button
                  onClick={handleCopy}
                  className="w-full sm:w-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded transition-colors flex items-center justify-center gap-2 flex-shrink-0 text-sm sm:text-base whitespace-nowrap"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = qrCodeUrl;
                  link.download = `tipjar-qr-${data.slug}.png`;
                  link.click();
                }}
                className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Download className="w-4 h-4" />
                <span>Download QR Code</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer Text for Screenshot */}
        {pageUrl && (
          <div className="text-center mb-6 sm:mb-8 px-2">
            <p className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-gray-700 dark:text-gray-300 leading-relaxed">
              Song Requests, Shout Outs, and Tips at{' '}
              <span className="text-purple-600 dark:text-purple-400 font-mono break-all inline-block">
                tipjar.live/{data.slug || organization?.slug}
              </span>
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={onBack}
            className="flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <button
            onClick={onNext}
            className="flex-1 sm:flex-initial px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <span>View Live Page</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

