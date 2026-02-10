/**
 * M10 DJ Company Gallery Admin
 * Add, edit, delete gallery photos. Photos stored in Supabase (gallery_photos + m10-gallery bucket).
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import {
  Image as ImageIcon,
  Plus,
  Pencil,
  Trash2,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type GalleryPhoto = {
  id: string;
  src: string;
  alt: string;
  caption: string;
  sort_order: number;
  created_at?: string;
};

const ADMIN_EMAILS = [
  'admin@m10djcompany.com',
  'manager@m10djcompany.com',
  'djbenmurray@gmail.com',
];

export default function AdminGalleryPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [fetching, setFetching] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<GalleryPhoto | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [formAlt, setFormAlt] = useState('');
  const [formCaption, setFormCaption] = useState('');
  const [formSortOrder, setFormSortOrder] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) fetchPhotos();
  }, [user]);

  const checkAuth = async () => {
    try {
      const { data: { user: u }, error } = await supabase.auth.getUser();
      if (error || !u) {
        router.push('/signin?redirect=/admin/gallery');
        return;
      }
      if (!ADMIN_EMAILS.includes(u.email || '')) {
        router.push('/admin/dashboard');
        return;
      }
      setUser(u);
    } catch (err) {
      console.error('Auth error:', err);
      router.push('/signin?redirect=/admin/gallery');
    } finally {
      setLoading(false);
    }
  };

  const fetchPhotos = async () => {
    setFetching(true);
    try {
      const res = await fetch('/api/gallery-photos');
      const data = await res.json();
      if (res.ok) setPhotos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch gallery error:', err);
    } finally {
      setFetching(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setFileData(null);
    setFileName('');
    setFormAlt('');
    setFormCaption('');
    setFormSortOrder(photos.length);
    setModalOpen(true);
  };

  const openEdit = (photo: GalleryPhoto) => {
    setEditing(photo);
    setFileData(null);
    setFileName('');
    setFormAlt(photo.alt);
    setFormCaption(photo.caption);
    setFormSortOrder(photo.sort_order);
    setModalOpen(true);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFileData(reader.result as string);
      setFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const savePhoto = async () => {
    if (editing) {
      const body: Record<string, unknown> = {
        alt: formAlt,
        caption: formCaption,
        sort_order: formSortOrder,
      };
      if (fileData && fileName) {
        body.fileData = fileData;
        body.fileName = fileName;
      }
      setSaving(true);
      try {
        const res = await fetch(`/api/admin/gallery-photos/${editing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          setModalOpen(false);
          fetchPhotos();
        } else {
          const err = await res.json();
          alert(err.error || 'Update failed');
        }
      } catch (err) {
        alert('Update failed');
      } finally {
        setSaving(false);
      }
    } else {
      if (!fileData || !fileName) {
        alert('Please select an image');
        return;
      }
      setSaving(true);
      try {
        const res = await fetch('/api/admin/gallery-photos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileData,
            fileName,
            alt: formAlt,
            caption: formCaption,
            sort_order: formSortOrder,
          }),
        });
        if (res.ok) {
          setModalOpen(false);
          fetchPhotos();
        } else {
          const err = await res.json();
          alert(err.error || 'Upload failed');
        }
      } catch (err) {
        alert('Upload failed');
      } finally {
        setSaving(false);
      }
    }
  };

  const deletePhoto = async (id: string) => {
    if (!confirm('Delete this photo from the gallery?')) return;
    setDeleteId(id);
    try {
      const res = await fetch(`/api/admin/gallery-photos/${id}`, { method: 'DELETE' });
      if (res.ok) fetchPhotos();
      else alert('Delete failed');
    } catch (err) {
      alert('Delete failed');
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <>
      <Head>
        <title>Gallery | M10 DJ Admin</title>
      </Head>
      <AdminLayout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/admin/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                Photo Gallery
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Manage photos shown on the public gallery page (m10djcompany.com/gallery).
              </p>
            </div>
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add photo
            </Button>
          </div>

          {fetching ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
            </div>
          ) : photos.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <ImageIcon className="h-12 w-12 mx-auto text-zinc-400 mb-4" />
                <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                  No photos yet. Add your first photo to show on the gallery page.
                </p>
                <Button onClick={openAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add photo
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {photos.map((photo) => (
                <Card key={photo.id} className="overflow-hidden">
                  <div className="relative aspect-[3/2] bg-zinc-100 dark:bg-zinc-800">
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      unoptimized={photo.src.startsWith('http') && photo.src.includes('supabase')}
                    />
                  </div>
                  <CardHeader className="p-4">
                    <CardTitle className="text-base truncate" title={photo.alt}>
                      {photo.alt || 'No alt text'}
                    </CardTitle>
                    {photo.caption && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                        {photo.caption}
                      </p>
                    )}
                    <p className="text-xs text-zinc-400">Order: {photo.sort_order}</p>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEdit(photo)}
                      className="flex-1"
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deletePhoto(photo.id)}
                      disabled={deleteId === photo.id}
                    >
                      {deleteId === photo.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editing ? 'Edit photo' : 'Add photo'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>{editing ? 'New image (optional)' : 'Image (required)'}</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                />
                {fileData && (
                  <p className="text-xs text-zinc-500">{fileName}</p>
                )}
                {editing && !fileData && (
                  <div className="relative w-full aspect-video rounded border bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <Image
                      src={editing.src}
                      alt={editing.alt}
                      fill
                      className="object-contain"
                      unoptimized={editing.src.includes('supabase')}
                    />
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="alt">Alt text</Label>
                <Input
                  id="alt"
                  value={formAlt}
                  onChange={(e) => setFormAlt(e.target.value)}
                  placeholder="Describe the image for accessibility"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="caption">Caption</Label>
                <Input
                  id="caption"
                  value={formCaption}
                  onChange={(e) => setFormCaption(e.target.value)}
                  placeholder="Short caption (e.g. venue or event)"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sort">Sort order</Label>
                <Input
                  id="sort"
                  type="number"
                  value={formSortOrder}
                  onChange={(e) => setFormSortOrder(Number(e.target.value) || 0)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={savePhoto} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {editing ? 'Save' : 'Add photo'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </>
  );
}
