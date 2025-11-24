/**
 * Embed Code Generator Component
 * 
 * Shows DJs their embed code and allows customization
 */

import { useState, useEffect } from 'react';
import { Copy, Check, Code, Eye, Settings } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { getCurrentOrganization } from '@/utils/organization-context';

interface EmbedCodeGeneratorProps {
  organizationSlug?: string;
  organizationName?: string;
}

export default function EmbedCodeGenerator({ 
  organizationSlug, 
  organizationName 
}: EmbedCodeGeneratorProps) {
  const supabase = createClientComponentClient();
  const [org, setOrg] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Embed customization options
  const [embedOptions, setEmbedOptions] = useState({
    theme: 'light',
    height: 800,
    width: '100%',
    borderRadius: 12,
    showBranding: true,
  });

  useEffect(() => {
    async function loadOrg() {
      if (organizationSlug) {
        const { data } = await supabase
          .from('organizations')
          .select('*')
          .eq('slug', organizationSlug)
          .single();
        if (data) setOrg(data);
      } else {
        const currentOrg = await getCurrentOrganization(supabase);
        if (currentOrg) {
          setOrg(currentOrg);
        }
      }
    }
    loadOrg();
  }, [organizationSlug, supabase]);

  const slug = org?.slug || organizationSlug || 'your-slug';
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
  const embedUrl = `${baseUrl}/${slug}/embed/requests?theme=${embedOptions.theme}`;

  const generateEmbedCode = () => {
    const borderStyle = embedOptions.borderRadius > 0 
      ? `border-radius: ${embedOptions.borderRadius}px;` 
      : '';
    
    const shadowStyle = 'box-shadow: 0 4px 6px rgba(0,0,0,0.1);';
    
    return `<iframe 
  src="${embedUrl}"
  width="${embedOptions.width}" 
  height="${embedOptions.height}" 
  frameborder="0"
  style="${borderStyle} ${shadowStyle}"
  allowfullscreen
></iframe>`;
  };

  const generateResponsiveEmbedCode = () => {
    return `<div style="position: relative; padding-bottom: 100%; height: 0; overflow: hidden; max-width: 100%;">
  <iframe 
    src="${embedUrl}"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
    allowfullscreen
  ></iframe>
</div>`;
  };

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const embedCode = generateEmbedCode();
  const responsiveCode = generateResponsiveEmbedCode();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <Code className="w-6 h-6 text-purple-600" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Embed Code for Your Website
        </h2>
      </div>

      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Copy and paste this code into your website to add a song request form. It works on WordPress, Wix, Squarespace, and any website that supports HTML.
      </p>

      {/* Customization Options */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Customize</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Theme
            </label>
            <select
              value={embedOptions.theme}
              onChange={(e) => setEmbedOptions({ ...embedOptions, theme: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Height (px)
            </label>
            <input
              type="number"
              value={embedOptions.height}
              onChange={(e) => setEmbedOptions({ ...embedOptions, height: parseInt(e.target.value) || 800 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              min="400"
              max="1200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Border Radius (px)
            </label>
            <input
              type="number"
              value={embedOptions.borderRadius}
              onChange={(e) => setEmbedOptions({ ...embedOptions, borderRadius: parseInt(e.target.value) || 12 })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              min="0"
              max="24"
            />
          </div>
        </div>
      </div>

      {/* Embed Code Display */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-gray-900 dark:text-white">
            Standard Embed Code
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>
            <button
              onClick={() => handleCopy(embedCode)}
              className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Code
                </>
              )}
            </button>
          </div>
        </div>
        <textarea
          readOnly
          value={embedCode}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-xs sm:text-sm text-gray-900 dark:text-white resize-none overflow-x-auto break-all"
          rows={8}
          onClick={(e) => (e.target as HTMLTextAreaElement).select()}
        />
      </div>

      {/* Responsive Embed Code (Alternative) */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-gray-900 dark:text-white">
            Responsive Embed Code (Recommended)
          </label>
          <button
            onClick={() => handleCopy(responsiveCode)}
            className="px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Code
              </>
            )}
          </button>
        </div>
        <textarea
          readOnly
          value={responsiveCode}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-xs sm:text-sm text-gray-900 dark:text-white resize-none overflow-x-auto break-all"
          rows={6}
          onClick={(e) => (e.target as HTMLTextAreaElement).select()}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          This version automatically adjusts to fit any screen size
        </p>
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Preview</h3>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <iframe
              src={embedUrl}
              width="100%"
              height={embedOptions.height}
              style={{
                border: 'none',
                borderRadius: `${embedOptions.borderRadius}px`,
              }}
            />
          </div>
        </div>
      )}

      {/* Your URLs */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Your Request Page URLs</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Direct Link</p>
              <p className="text-xs sm:text-sm font-mono text-gray-900 dark:text-white break-all">
                {baseUrl}/{slug}/requests
              </p>
            </div>
            <button
              onClick={() => handleCopy(`${baseUrl}/${slug}/requests`)}
              className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors flex-shrink-0"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Embed URL</p>
              <p className="text-xs sm:text-sm font-mono text-gray-900 dark:text-white break-all">
                {embedUrl}
              </p>
            </div>
            <button
              onClick={() => handleCopy(embedUrl)}
              className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors flex-shrink-0"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">How to Add to Your Website</h3>
        <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
          <li>Copy the embed code above</li>
          <li>Log into your website (WordPress, Wix, Squarespace, etc.)</li>
          <li>Add an HTML block/widget to your page</li>
          <li>Paste the embed code</li>
          <li>Save and publish your page</li>
        </ol>
      </div>
    </div>
  );
}

