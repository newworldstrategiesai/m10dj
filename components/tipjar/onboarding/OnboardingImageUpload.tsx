'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';

/** Subfolder in organization-assets bucket: organizations/{id}/images/{subfolder}/ */
export type OnboardingImageSubfolder = 'cover' | 'profile' | '';

interface OnboardingImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  organizationId?: string;
  /** Store under organizations/{id}/images/{subfolder}/ in Supabase bucket */
  subfolder?: OnboardingImageSubfolder;
  /** Max file size in MB. Cover: 5MB, profile/logo: 2MB */
  maxSizeMB?: number;
  helpText?: string;
  /** 'circle' for profile photo preview, default rectangle */
  previewShape?: 'circle' | 'rectangle';
  /** Recommended dimensions hint */
  recommendedDimensions?: string;
  required?: boolean;
}

/**
 * Uploads images to Supabase Storage bucket `organization-assets` via /api/organizations/image-upload.
 * Files are stored at: organizations/{organizationId}/images/{subfolder}/{timestamp}-{filename}
 */
export default function OnboardingImageUpload({
  label,
  value,
  onChange,
  subfolder = '',
  maxSizeMB = 5,
  helpText,
  previewShape = 'rectangle',
  recommendedDimensions,
  required = false
}: OnboardingImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClientComponentClient();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, or WebP)');
      return;
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setError(`File size must be under ${maxSizeMB}MB`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('You must be logged in to upload images');
      }

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
          const body: Record<string, string> = {
            fileData: base64Data,
            fileName: file.name,
            fileType: extension,
            storagePath: 'organization-assets'
          };
          if (subfolder) body.subfolder = subfolder;

          const response = await fetch('/api/organizations/image-upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });

          const data = await response.json();
          if (!response.ok) throw new Error(data.error || 'Upload failed');

          onChange(data.url);
          setUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
          setError(null);
        } catch (err: any) {
          setError(err.message || 'Upload failed');
          setUploading(false);
        }
      };
      reader.onerror = () => {
        setError('Failed to read file');
        setUploading(false);
      };
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      setUploading(false);
    }
  };

  const handleClear = () => {
    onChange('');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-900 dark:text-white">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-8 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <X className="w-4 h-4 mr-1" />
            Remove
          </Button>
        )}
      </div>

      {(helpText || recommendedDimensions) && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {helpText}
          {recommendedDimensions && (
            <span className="block mt-0.5">Recommended: {recommendedDimensions}. Stored in your account.</span>
          )}
          {!recommendedDimensions && helpText && ' Stored securely in your account.'}
        </p>
      )}

      {!value ? (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-purple-500 dark:hover:border-purple-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              {uploading ? (
                <Loader2 className="w-6 h-6 text-purple-600 dark:text-purple-400 animate-spin" />
              ) : (
                <ImageIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload image
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              PNG, JPG, or WebP • Max {maxSizeMB}MB
            </p>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div
            className={`border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50 overflow-hidden ${
              previewShape === 'circle' ? 'flex justify-center' : ''
            }`}
          >
            <img
              src={value}
              alt={label}
              className={
                previewShape === 'circle'
                  ? 'w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600'
                  : 'w-full max-w-md h-32 sm:h-40 object-cover rounded-lg mx-auto'
              }
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                setError('Failed to load image. Try uploading again.');
              }}
            />
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400 flex items-center gap-1">
          {error}
        </p>
      )}
    </div>
  );
}
