/**
 * White-Label Branding Management Component
 * 
 * Allows organizations to customize their branding (logo, colors, fonts)
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Upload, 
  Palette, 
  Type, 
  Save, 
  Eye, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';

interface BrandingData {
  whiteLabelEnabled: boolean;
  customLogoUrl: string | null;
  customFaviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  customDomain: string | null;
  subscriptionTier: string;
  hasAccess: boolean;
}

export default function WhiteLabelBranding() {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  
  const [branding, setBranding] = useState<BrandingData>({
    whiteLabelEnabled: false,
    customLogoUrl: null,
    customFaviconUrl: null,
    primaryColor: '#8B5CF6',
    secondaryColor: '#EC4899',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    fontFamily: 'system-ui, sans-serif',
    customDomain: null,
    subscriptionTier: 'starter',
    hasAccess: false,
  });

  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadBranding();
  }, []);

  async function loadBranding() {
    try {
      setLoading(true);
      const response = await fetch('/api/organizations/branding/get');
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to load branding');
      }

      const data = await response.json();
      setBranding(data.branding);
    } catch (err: any) {
      setError(err.message || 'Failed to load branding settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(file: File, fileType: 'logo' | 'favicon') {
    try {
      setError(null);
      setSuccess(null);

      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;

        const response = await fetch('/api/organizations/branding/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileType,
            fileData: base64Data,
            fileName: file.name,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to upload file');
        }

        const data = await response.json();
        
        // Update local state
        if (fileType === 'logo') {
          setBranding({ ...branding, customLogoUrl: data.url });
        } else {
          setBranding({ ...branding, customFaviconUrl: data.url });
        }

        setSuccess(`${fileType === 'logo' ? 'Logo' : 'Favicon'} uploaded successfully`);
        setTimeout(() => setSuccess(null), 3000);
      };

      reader.onerror = () => {
        throw new Error('Failed to read file');
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
      setTimeout(() => setError(null), 5000);
    }
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/organizations/branding/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primaryColor: branding.primaryColor,
          secondaryColor: branding.secondaryColor,
          backgroundColor: branding.backgroundColor,
          textColor: branding.textColor,
          fontFamily: branding.fontFamily,
          whiteLabelEnabled: branding.whiteLabelEnabled,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save branding');
      }

      setSuccess('Branding settings saved successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save branding');
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!branding.hasAccess) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
              White-Label Branding Not Available
            </h3>
            <p className="text-yellow-800 dark:text-yellow-300 mb-4">
              White-label branding is available for <strong>White-Label</strong> or <strong>Enterprise</strong> subscription tiers.
              Your current tier: <strong>{branding.subscriptionTier}</strong>
            </p>
            <a
              href="/onboarding/select-plan"
              className="inline-flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
            >
              Upgrade Plan
            </a>
          </div>
        </div>
      </div>
    );
  }

  const previewStyles = {
    '--brand-primary': branding.primaryColor,
    '--brand-secondary': branding.secondaryColor,
    '--brand-background': branding.backgroundColor,
    '--brand-text': branding.textColor,
    '--brand-font': branding.fontFamily,
  } as React.CSSProperties;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          White-Label Branding
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Customize your branding to match your business. Changes will appear on your public request pages.
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <p className="text-green-800 dark:text-green-200">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Logo Upload */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <ImageIcon className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Logo
          </h3>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Upload your logo to replace the platform logo on your request pages. Recommended size: 200x60px (max 5MB)
        </p>
        
        {branding.customLogoUrl && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <img 
              src={branding.customLogoUrl} 
              alt="Current logo" 
              className="max-h-20 max-w-full object-contain"
            />
          </div>
        )}

        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file, 'logo');
          }}
        />
        <button
          onClick={() => logoInputRef.current?.click()}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {branding.customLogoUrl ? 'Replace Logo' : 'Upload Logo'}
        </button>
      </div>

      {/* Favicon Upload */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <ImageIcon className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Favicon
          </h3>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Upload a favicon (16x16 or 32x32px) for browser tabs. Recommended format: PNG or ICO (max 1MB)
        </p>
        
        {branding.customFaviconUrl && (
          <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
            <img 
              src={branding.customFaviconUrl} 
              alt="Current favicon" 
              className="w-16 h-16 object-contain"
            />
          </div>
        )}

        <input
          ref={faviconInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file, 'favicon');
          }}
        />
        <button
          onClick={() => faviconInputRef.current?.click()}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {branding.customFaviconUrl ? 'Replace Favicon' : 'Upload Favicon'}
        </button>
      </div>

      {/* Color Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <Palette className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Colors
          </h3>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Customize your brand colors. These will be used throughout your request pages.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Primary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={branding.primaryColor}
                onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                className="w-16 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={branding.primaryColor}
                onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="#8B5CF6"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Secondary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={branding.secondaryColor}
                onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                className="w-16 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={branding.secondaryColor}
                onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="#EC4899"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Background Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={branding.backgroundColor}
                onChange={(e) => setBranding({ ...branding, backgroundColor: e.target.value })}
                className="w-16 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={branding.backgroundColor}
                onChange={(e) => setBranding({ ...branding, backgroundColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="#FFFFFF"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Text Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={branding.textColor}
                onChange={(e) => setBranding({ ...branding, textColor: e.target.value })}
                className="w-16 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={branding.textColor}
                onChange={(e) => setBranding({ ...branding, textColor: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="#1F2937"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Font Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <Type className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            Typography
          </h3>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Choose a font family for your request pages.
        </p>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Font Family
          </label>
          <select
            value={branding.fontFamily}
            onChange={(e) => setBranding({ ...branding, fontFamily: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="system-ui, sans-serif">System Default</option>
            <option value="'Inter', sans-serif">Inter</option>
            <option value="'Roboto', sans-serif">Roboto</option>
            <option value="'Open Sans', sans-serif">Open Sans</option>
            <option value="'Poppins', sans-serif">Poppins</option>
            <option value="'Montserrat', sans-serif">Montserrat</option>
            <option value="'Playfair Display', serif">Playfair Display (Serif)</option>
          </select>
        </div>
      </div>

      {/* Preview */}
      {previewMode && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              Preview
            </h3>
            <button
              onClick={() => setPreviewMode(false)}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div 
            className="p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600"
            style={previewStyles}
          >
            <div className="text-center">
              {branding.customLogoUrl && (
                <img 
                  src={branding.customLogoUrl} 
                  alt="Preview logo" 
                  className="mx-auto mb-4 max-h-16"
                />
              )}
              <h4 style={{ color: 'var(--brand-primary)' }} className="text-2xl font-bold mb-2">
                Your Brand Name
              </h4>
              <p style={{ color: 'var(--brand-text)' }} className="mb-4">
                This is how your request page will look
              </p>
              <button
                style={{ 
                  backgroundColor: 'var(--brand-primary)',
                  color: '#FFFFFF'
                }}
                className="px-6 py-2 rounded-lg font-semibold"
              >
                Example Button
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Changes
            </>
          )}
        </button>
        <button
          onClick={() => setPreviewMode(!previewMode)}
          className="px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
        >
          <Eye className="w-5 h-5" />
          {previewMode ? 'Hide Preview' : 'Preview'}
        </button>
      </div>
    </div>
  );
}

