'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2, Video } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface VideoUploadInputProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  maxSizeMB?: number;
  previewClassName?: string;
  showPreview?: boolean;
  required?: boolean;
  helpText?: string;
}

export default function VideoUploadInput({
  label,
  value,
  onChange,
  maxSizeMB = 100,
  previewClassName,
  showPreview = true,
  required = false,
  helpText,
}: VideoUploadInputProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClientComponentClient();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setError('Please select a video file (MP4, WebM, etc.)');
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setError(`File size must be less than ${maxSizeMB}MB. Your file is ${fileSizeMB.toFixed(1)}MB`);
      return;
    }

    setError(null);
    setUploading(true);
    setUploadProgress(10);

    try {
      // Get current user and organization
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('You must be logged in to upload videos');
      }
      
      setUploadProgress(20);

      // Convert file to base64 for upload
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          const progress = 20 + (e.loaded / e.total) * 40; // 20-60% for reading
          setUploadProgress(Math.round(progress));
        }
      };
      
      reader.onload = async () => {
        try {
          setUploadProgress(60);
          const base64Data = reader.result as string;
          
          // Extract file extension
          const extension = file.name.split('.').pop()?.toLowerCase() || 'mp4';
          
          // Call upload API
          const response = await fetch('/api/organizations/video-upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileData: base64Data,
              fileName: file.name,
              fileType: extension,
            }),
          });

          setUploadProgress(90);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
          }

          setUploadProgress(100);
          const newUrl = data.url;
          onChange(newUrl);
          
          // Reset after short delay
          setTimeout(() => {
            setUploading(false);
            setUploadProgress(0);
          }, 500);
          
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          
          // Reset error state
          setError(null);
        } catch (err: any) {
          setError(err.message || 'Failed to upload video');
          setUploading(false);
          setUploadProgress(0);
        }
      };

      reader.onerror = () => {
        setError('Failed to read file');
        setUploading(false);
        setUploadProgress(0);
      };
    } catch (err: any) {
      setError(err.message || 'Failed to upload video');
      setUploading(false);
      setUploadProgress(0);
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
        <Label htmlFor={`video-upload-${label}`}>
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

      {helpText && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {helpText}
        </p>
      )}

      {/* URL Input */}
      <div className="flex gap-2">
        <Input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/video.mp4 or upload below"
          className="flex-1"
          disabled={uploading}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/mov,video/quicktime"
          onChange={handleFileSelect}
          className="hidden"
          id={`video-upload-${label}`}
          disabled={uploading}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="gap-2 min-w-[120px]"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {uploadProgress}%
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload
            </>
          )}
        </Button>
      </div>

      {/* Upload progress bar */}
      {uploading && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-[#fcba00] h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}

      {/* Preview */}
      {showPreview && value && (
        <div className="mt-3">
          <video
            src={value}
            className={`rounded-lg border-2 border-gray-200 dark:border-gray-700 ${
              previewClassName || 'w-full max-w-md h-48 object-cover'
            }`}
            autoPlay
            loop
            muted
            playsInline
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              setError('Failed to load video. Please check the URL.');
            }}
          />
        </div>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Max file size: {maxSizeMB}MB. Accepted formats: MP4, WebM, MOV
      </p>
    </div>
  );
}

