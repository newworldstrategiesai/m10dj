'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button/Button';
import Card from '@/components/ui/Card/Card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { updateAvatar } from '@/utils/auth-helpers/server';
import { Upload, Trash2 } from 'lucide-react';

interface AvatarFormProps {
  avatarUrl: string | null;
  /** Used for fallback initials when no avatar */
  userName?: string;
}

function getInitials(name: string | undefined): string {
  if (!name || !name.trim()) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function AvatarForm({ avatarUrl, userName }: AvatarFormProps) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image (JPEG, PNG, WebP, or GIF)');
      return;
    }

    const maxMB = 2;
    if (file.size > maxMB * 1024 * 1024) {
      setError(`Image must be under ${maxMB}MB`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64 = reader.result as string;
          const res = await fetch('/api/account/avatar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileData: base64, fileName: file.name })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Upload failed');

          setSaving(true);
          const formData = new FormData();
          formData.set('avatar_url', data.url);
          const redirectUrl = await updateAvatar(formData);
          if (fileInputRef.current) fileInputRef.current.value = '';
          router.push(redirectUrl);
          router.refresh();
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
          setUploading(false);
          setSaving(false);
        }
      };
      reader.onerror = () => {
        setError('Failed to read file');
        setUploading(false);
      };
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setError(null);
    setSaving(true);
    try {
      const formData = new FormData();
      formData.set('avatar_url', '');
      const redirectUrl = await updateAvatar(formData);
      router.push(redirectUrl);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to remove avatar');
    } finally {
      setSaving(false);
    }
  };

  const busy = uploading || saving;

  return (
    <Card
      title="Profile photo"
      description="This image may appear where your account is shown (e.g. comments or messages)."
      footer={
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            JPEG, PNG, WebP or GIF. Max 2MB.
          </p>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileSelect}
              disabled={busy}
            />
            <Button
              variant="slim"
              type="button"
              loading={busy}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading…' : saving ? 'Saving…' : 'Change photo'}
            </Button>
            {avatarUrl && (
              <Button
                variant="slim"
                type="button"
                disabled={busy}
                onClick={handleRemove}
                className="text-zinc-400 hover:text-red-500 hover:bg-red-500/10 dark:text-zinc-500 dark:hover:text-red-400 dark:hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="mt-6 mb-4 flex flex-col sm:flex-row items-start gap-4">
        <Avatar className="h-24 w-24 rounded-full border-2 border-zinc-600 dark:border-zinc-500">
          <AvatarImage
            src={avatarUrl || undefined}
            alt="Profile"
            className="object-cover"
          />
          <AvatarFallback className="bg-zinc-700 dark:bg-zinc-600 text-zinc-200 dark:text-zinc-300 text-2xl">
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>
        {error && (
          <p className="text-sm text-red-500 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    </Card>
  );
}
