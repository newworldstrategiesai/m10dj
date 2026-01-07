'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Palette, DollarSign } from 'lucide-react';
import { OnboardingData } from '../OnboardingWizard';
import { triggerQuickConfetti, triggerConfetti } from '@/utils/confetti';

interface CustomizationStepProps {
  data: OnboardingData;
  onDataUpdate: (updates: Partial<OnboardingData>) => void;
  onNext: () => void;
  onBack: () => void;
  progress: number;
  currentStep: number;
  totalSteps: number;
  organization?: any;
}

const PRESET_COLORS = [
  { name: 'TipJar Green', value: '#10b981' },
  { name: 'Purple', value: '#9333ea' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Gold', value: '#fcba00' },
  { name: 'Teal', value: '#14b8a6' },
];

export default function CustomizationStep({
  data,
  onDataUpdate,
  onNext,
  onBack,
  progress,
  currentStep,
  totalSteps,
  organization
}: CustomizationStepProps) {
  const [accentColor, setAccentColor] = useState<string>(
    data.accentColor || (organization?.product_context === 'tipjar' ? '#10b981' : '#fcba00')
  );
  const [minimumBid, setMinimumBid] = useState<number>(
    data.minimumBid || 5.00
  );
  const [errors, setErrors] = useState<{ accentColor?: string; minimumBid?: string }>({});

  useEffect(() => {
    // Initialize from organization if available
    if (organization) {
      const defaultAccentColor = organization.product_context === 'tipjar' ? '#10b981' : '#fcba00';
      setAccentColor(organization.requests_accent_color || defaultAccentColor);
      
      // Convert cents to dollars for display
      if (organization.requests_bidding_minimum_bid) {
        setMinimumBid(organization.requests_bidding_minimum_bid / 100);
      }
    }
  }, [organization]);

  function validate(): boolean {
    const newErrors: { accentColor?: string; minimumBid?: string } = {};

    if (!accentColor || !accentColor.match(/^#[0-9A-Fa-f]{6}$/)) {
      newErrors.accentColor = 'Please select a valid color';
    }

    if (minimumBid < 1) {
      newErrors.minimumBid = 'Minimum bid must be at least $1.00';
    } else if (minimumBid > 1000) {
      newErrors.minimumBid = 'Minimum bid cannot exceed $1,000.00';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleNext() {
    if (validate()) {
      // Convert dollars to cents for storage
      const minimumBidCents = Math.round(minimumBid * 100);
      
      onDataUpdate({
        accentColor: accentColor,
        minimumBid: minimumBidCents
      });

      // Save to organization immediately
      if (organization?.id) {
        try {
          const response = await fetch('/api/organizations/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requests_accent_color: accentColor,
              requests_bidding_minimum_bid: minimumBidCents
            })
          });
          if (!response.ok) {
            console.error('Failed to save customization settings');
          }
        } catch (error) {
          console.error('Error saving customization settings:', error);
        }
      }

      triggerQuickConfetti({ colors: [accentColor, '#9333ea', '#3b82f6', '#10b981'] });
      onNext();
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 mb-4">
          <Palette className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3">
          Customize Your Page
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Set your brand colors and minimum bid amount
        </p>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-8">
        {/* Accent Color Section */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4">
            <Palette className="inline w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
            Accent Color
          </label>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Choose a color that matches your brand. This will be used for buttons, links, and highlights.
          </p>

          {/* Preset Colors */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mb-4">
            {PRESET_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => {
                  setAccentColor(color.value);
                  setErrors({ ...errors, accentColor: undefined });
                }}
                className={`relative w-full aspect-square rounded-lg border-2 transition-all ${
                  accentColor === color.value
                    ? 'border-gray-900 dark:border-white scale-110 shadow-lg'
                    : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              >
                {accentColor === color.value && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color.value }} />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Custom Color Picker */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Custom Color:
            </label>
            <div className="flex items-center gap-3 flex-1">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => {
                  setAccentColor(e.target.value);
                  setErrors({ ...errors, accentColor: undefined });
                }}
                className="w-16 h-12 rounded-lg border-2 border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={accentColor}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.match(/^#[0-9A-Fa-f]{0,6}$/)) {
                    setAccentColor(value);
                    setErrors({ ...errors, accentColor: undefined });
                  }
                }}
                placeholder="#10b981"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
              />
            </div>
          </div>

          {/* Color Preview */}
          <div className="mt-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="px-4 py-2 rounded-lg text-white font-semibold text-sm"
                style={{ backgroundColor: accentColor }}
              >
                Button Style
              </button>
              <a
                href="#"
                className="text-sm font-semibold underline"
                style={{ color: accentColor }}
                onClick={(e) => e.preventDefault()}
              >
                Link Style
              </a>
            </div>
          </div>

          {errors.accentColor && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.accentColor}</p>
          )}
        </div>

        {/* Minimum Bid Section */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-4">
            <DollarSign className="inline w-5 h-5 mr-2 text-purple-600 dark:text-purple-400" />
            Minimum Bid Amount
          </label>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Set the minimum amount customers must bid for song requests (if bidding is enabled).
          </p>

          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">$</span>
            <input
              type="number"
              value={minimumBid}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                setMinimumBid(value);
                setErrors({ ...errors, minimumBid: undefined });
              }}
              min="1"
              max="1000"
              step="0.01"
              placeholder="5.00"
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-semibold"
            />
          </div>

          {errors.minimumBid && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.minimumBid}</p>
          )}

          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Recommended: $5.00 - $10.00. This ensures quality requests and helps cover processing fees.
          </p>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 sm:flex-initial px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
        >
          Continue
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

