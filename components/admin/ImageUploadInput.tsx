'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2, Image as ImageIcon, FolderOpen } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import MediaLibraryModal from './MediaLibraryModal';

interface ImageUploadInputProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  recommendedDimensions?: string;
  maxSizeMB?: number;
  aspectRatio?: string; // e.g., "16:9", "1:1", "4:3"
  storagePath?: string; // Custom path in storage, defaults to 'organization-assets'
  accept?: string; // File types to accept, defaults to 'image/*'
  previewClassName?: string;
  showPreview?: boolean;
  required?: boolean;
}

export default function ImageUploadInput({
  label,
  value,
  onChange,
  recommendedDimensions,
  maxSizeMB = 5,
  aspectRatio,
  storagePath = 'organization-assets',
  accept = 'image/*',
  previewClassName,
  showPreview = true,
  required = false,
}: ImageUploadInputProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
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

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setError(`File size must be less than ${maxSizeMB}MB`);
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

      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (orgError || !org) {
        throw new Error('Organization not found');
      }

      // Convert file to base64 for upload
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          
          // Extract file extension
          const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
          
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
              storagePath,
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
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={`image-upload-${label}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-8 text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {recommendedDimensions && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Recommended: {recommendedDimensions}
          {aspectRatio && ` (${aspectRatio} aspect ratio)`}
        </p>
      )}

      {/* URL Input */}
      <div className="flex gap-2">
        <Input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste URL or select from library"
          className="flex-1"
          disabled={uploading}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          id={`image-upload-${label}`}
          disabled={uploading}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowLibrary(true)}
          disabled={uploading}
          className="gap-2"
          title="Select from library"
        >
          <FolderOpen className="w-4 h-4" />
        </Button>
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
              Upload
            </>
          )}
        </Button>
      </div>
      
      {/* Media Library Modal */}
      <MediaLibraryModal
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
        onSelect={(url) => {
          onChange(url);
          setError(null);
        }}
        mediaType="image"
        title="Select Image"
      />

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}

      {/* Preview */}
      {showPreview && value && (
        <div className="mt-3">
          <img
            src={value}
            alt="Preview"
            className={`rounded-lg border-2 border-gray-200 dark:border-gray-700 ${
              previewClassName || 'w-full max-w-md h-48 object-cover'
            }`}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              setError('Failed to load image. Please check the URL.');
            }}
          />
        </div>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Max file size: {maxSizeMB}MB. Accepted formats: JPG, PNG, GIF, WebP
      </p>
    </div>
  );
}

