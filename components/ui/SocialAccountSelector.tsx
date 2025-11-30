'use client';

import { useState, useEffect } from 'react';
import { X, Instagram, Facebook } from 'lucide-react';

interface SocialAccountSelectorProps {
  platform: 'instagram' | 'facebook';
  isOpen: boolean;
  onClose: () => void;
  onSelect: (account: string) => void;
}

const ACCOUNTS = {
  instagram: [
    { handle: 'djbenmurray', url: 'https://instagram.com/djbenmurray', label: 'DJ Ben Murray' },
    { handle: 'm10djcompany', url: 'https://instagram.com/m10djcompany', label: 'M10 DJ Company' }
  ],
  facebook: [
    { handle: 'djbenmurray', url: 'https://facebook.com/djbenmurray', label: 'DJ Ben Murray' },
    { handle: 'm10djcompany', url: 'https://facebook.com/m10djcompany', label: 'M10 DJ Company' }
  ]
};

export default function SocialAccountSelector({ platform, isOpen, onClose, onSelect }: SocialAccountSelectorProps) {
  const [selectedAccount, setSelectedAccount] = useState<string>('m10djcompany');

  useEffect(() => {
    if (isOpen) {
      // Load saved preference from localStorage
      const saved = localStorage.getItem(`${platform}_account_preference`);
      if (saved && ACCOUNTS[platform].some(acc => acc.handle === saved)) {
        setSelectedAccount(saved);
      }
    }
  }, [isOpen, platform]);

  const handleSelect = (account: string) => {
    setSelectedAccount(account);
    // Save preference to localStorage
    localStorage.setItem(`${platform}_account_preference`, account);
    onSelect(account);
    onClose();
  };

  if (!isOpen) return null;

  const accounts = ACCOUNTS[platform];
  const Icon = platform === 'instagram' ? Instagram : Facebook;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-black rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200 border border-gray-200 dark:border-gray-800">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            platform === 'instagram' 
              ? 'bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500' 
              : 'bg-blue-600'
          }`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Choose {platform === 'instagram' ? 'Instagram' : 'Facebook'} Account
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Select which account to follow
            </p>
          </div>
        </div>

        {/* Account options */}
        <div className="space-y-3">
          {accounts.map((account) => (
            <button
              key={account.handle}
              onClick={() => handleSelect(account.handle)}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                selectedAccount === account.handle
                  ? 'border-purple-600 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-black/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {account.label}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    @{account.handle}
                  </div>
                </div>
                {selectedAccount === account.handle && (
                  <div className="w-5 h-5 rounded-full bg-purple-600 dark:bg-purple-500 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Your preference will be saved for future visits
          </p>
        </div>
      </div>
    </div>
  );
}

