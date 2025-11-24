/**
 * Embed Step - Show embed code for website
 */

import { useState } from 'react';
import { Copy, CheckCircle, Code, Eye } from 'lucide-react';
import { OnboardingStepProps } from '../OnboardingWizard';
import EmbedCodeGenerator from '../EmbedCodeGenerator';

export default function EmbedStep({
  organization,
  onNext
}: OnboardingStepProps) {
  const handleContinue = () => {
    onNext();
  };

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Add to Your Website
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Copy and paste this code into your website to add a song request form
        </p>
      </div>

      {/* Use existing EmbedCodeGenerator component */}
      <div className="mb-6">
        <EmbedCodeGenerator
          organizationSlug={organization.slug}
          organizationName={organization.name}
        />
      </div>

      {/* Instructions */}
      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
          How to Add to Your Website:
        </h3>
        <ol className="text-sm text-purple-800 dark:text-purple-200 space-y-1 list-decimal list-inside">
          <li>Copy the embed code above</li>
          <li>Log into your website (WordPress, Wix, Squarespace, etc.)</li>
          <li>Add an HTML block/widget to your page</li>
          <li>Paste the embed code</li>
          <li>Save and publish your page</li>
        </ol>
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

