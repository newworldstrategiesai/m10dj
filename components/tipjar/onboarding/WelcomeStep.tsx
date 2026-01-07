'use client';

import { Sparkles, ArrowRight, CheckCircle } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
  progress: number;
  currentStep: number;
  totalSteps: number;
}

export default function WelcomeStep({
  onNext,
  progress,
  currentStep,
  totalSteps
}: WelcomeStepProps) {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 lg:p-12 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-200 dark:bg-purple-900 rounded-full blur-2xl opacity-50 animate-pulse" />
            <div className="relative bg-gradient-to-br from-purple-500 to-purple-600 rounded-full p-6">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
          Welcome to TipJar.live! 🎉
        </h1>

        {/* Subheading */}
        <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-6 sm:mb-8">
          Let's get your requests page live in <strong className="text-purple-600 dark:text-purple-400">2 minutes</strong>
        </p>

        {/* Value Props */}
        <div className="space-y-4 mb-10 text-left max-w-md mx-auto">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Start collecting tips immediately</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Accept payments and song requests right away</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Share your page instantly</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Get a custom URL and QR code in seconds</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Fully customizable</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Make it yours with colors, videos, and more</p>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Step {currentStep} of {totalSteps}
          </p>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-purple-600 dark:bg-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={onNext}
          className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <span>Get Started</span>
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Time Estimate */}
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          This takes about 2 minutes
        </p>
      </div>
    </div>
  );
}

