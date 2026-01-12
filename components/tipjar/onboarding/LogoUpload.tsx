'use client';

import { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';

interface LogoUploadProps {
  value: string;
  onChange: (url: string) => void;
  organizationId?: string;
}

export default function LogoUpload({ value, onChange, organizationId }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClientComponentClient();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Prefer PNG but allow other image types
    const isPNG = file.type === 'image/png';
    if (!isPNG) {
      // Warn but don't block
      console.log('Non-PNG image selected. PNG is recommended for best quality.');
    }

    // Validate file size (max 2MB for logos)
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 2) {
      setError('File size must be less than 2MB');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Get current user and organization
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('You must be logged in to upload images');
      }

      // Convert file to base64 for upload
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          
          // Extract file extension
          const extension = file.name.split('.').pop()?.toLowerCase() || 'png';
          
          // Call upload API
          const response = await fetch('/api/organizations/image-upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileData: base64Data,
              fileName: file.name,
              fileType: extension,
              storagePath: 'organization-assets',
            }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
          }

          const newUrl = data.url;
          onChange(newUrl);
          setUploading(false);
          
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          
          // Reset error state
          setError(null);
        } catch (err: any) {
          setError(err.message || 'Failed to upload image');
          setUploading(false);
        }
      };

      reader.onerror = () => {
        setError('Failed to read file');
        setUploading(false);
      };
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
      setUploading(false);
    }
  };

  const handleClear = () => {
    onChange('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-900 dark:text-white">
          Logo (Optional)
        </label>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-8 text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4 mr-1" />
            Remove
          </Button>
        )}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        PNG recommended for best quality with transparent background. Max 2MB.
      </p>

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
            <div>
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
                    Upload Logo
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              PNG, JPG, or WebP • Max 2MB
            </p>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
            <img
              src={value}
              alt="Logo preview"
              className="w-full max-w-xs h-24 object-contain mx-auto"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                setError('Failed to load image. Please try uploading again.');
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
