'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { X, Loader2, Image as ImageIcon, Video, Trash2, Check, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MediaFile {
  name: string;
  url: string;
  type: 'image' | 'video';
  size: number;
  created_at: string;
  path: string;
}

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  mediaType?: 'image' | 'video' | 'all';
  title?: string;
}

export default function MediaLibraryModal({
  isOpen,
  onClose,
  onSelect,
  mediaType = 'all',
  title = 'Media Library'
}: MediaLibraryModalProps) {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (isOpen) {
      fetchFiles();
    }
  }, [isOpen]);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Not authenticated');
        return;
      }

      // Get user's organization
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!org) {
        setError('Organization not found');
        return;
      }

      // List files from storage
      const { data: imageFiles, error: imageError } = await supabase.storage
        .from('organization-assets')
        .list(`organizations/${org.id}/images`, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      const { data: videoFiles, error: videoError } = await supabase.storage
        .from('organization-assets')
        .list(`organizations/${org.id}/videos`, {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      const allFiles: MediaFile[] = [];

      // Process image files
      if (imageFiles && !imageError) {
        for (const file of imageFiles) {
          if (file.name === '.emptyFolderPlaceholder') continue;
          const path = `organizations/${org.id}/images/${file.name}`;
          const { data: { publicUrl } } = supabase.storage
            .from('organization-assets')
            .getPublicUrl(path);
          
          allFiles.push({
            name: file.name,
            url: publicUrl,
            type: 'image',
            size: file.metadata?.size || 0,
            created_at: file.created_at || '',
            path
          });
        }
      }

      // Process video files
      if (videoFiles && !videoError) {
        for (const file of videoFiles) {
          if (file.name === '.emptyFolderPlaceholder') continue;
          const path = `organizations/${org.id}/videos/${file.name}`;
          const { data: { publicUrl } } = supabase.storage
            .from('organization-assets')
            .getPublicUrl(path);
          
          allFiles.push({
            name: file.name,
            url: publicUrl,
            type: 'video',
            size: file.metadata?.size || 0,
            created_at: file.created_at || '',
            path
          });
        }
      }

      // Filter by media type if specified
      const filteredFiles = mediaType === 'all' 
        ? allFiles 
        : allFiles.filter(f => f.type === mediaType);

      // Sort by created_at descending
      filteredFiles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setFiles(filteredFiles);
    } catch (err: any) {
      setError(err.message || 'Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (file: MediaFile) => {
    if (!confirm(`Delete "${file.name}"? This cannot be undone.`)) return;
    
    setDeleting(file.path);
    try {
      const { error } = await supabase.storage
        .from('organization-assets')
        .remove([file.path]);

      if (error) throw error;
      
      setFiles(files.filter(f => f.path !== file.path));
      if (selectedFile === file.url) setSelectedFile(null);
    } catch (err: any) {
      alert('Failed to delete file: ' + err.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleSelect = () => {
    if (selectedFile) {
      onSelect(selectedFile);
      onClose();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <FolderOpen className="w-5 h-5 text-[#fcba00]" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {files.length} file{files.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#fcba00]" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
              <Button onClick={fetchFiles} className="mt-4">Try Again</Button>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">No media files yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Upload files using the upload button and they&apos;ll appear here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {files.map((file) => (
                <div
                  key={file.path}
                  onClick={() => setSelectedFile(file.url)}
                  className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    selectedFile === file.url
                      ? 'border-[#fcba00] ring-2 ring-[#fcba00]/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="aspect-square bg-gray-100 dark:bg-gray-900">
                    {file.type === 'image' ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '';
                          e.currentTarget.className = 'hidden';
                        }}
                      />
                    ) : (
                      <video
                        src={file.url}
                        className="w-full h-full object-cover"
                        muted
                        onMouseEnter={(e) => e.currentTarget.play()}
                        onMouseLeave={(e) => {
                          e.currentTarget.pause();
                          e.currentTarget.currentTime = 0;
                        }}
                      />
                    )}
                    
                    {/* Type badge */}
                    <div className="absolute top-2 left-2">
                      {file.type === 'video' ? (
                        <div className="px-2 py-1 bg-black/70 rounded text-white text-xs flex items-center gap-1">
                          <Video className="w-3 h-3" />
                          Video
                        </div>
                      ) : (
                        <div className="px-2 py-1 bg-black/70 rounded text-white text-xs flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          Image
                        </div>
                      )}
                    </div>

                    {/* Selected checkmark */}
                    {selectedFile === file.url && (
                      <div className="absolute top-2 right-2">
                        <div className="w-6 h-6 bg-[#fcba00] rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-black" />
                        </div>
                      </div>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(file);
                      }}
                      disabled={deleting === file.path}
                      className="absolute bottom-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                    >
                      {deleting === file.path ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* File info */}
                  <div className="p-2 bg-white dark:bg-gray-800">
                    <p className="text-xs text-gray-900 dark:text-white truncate font-medium">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {selectedFile ? 'Click "Use Selected" to apply' : 'Select a file to use'}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSelect}
              disabled={!selectedFile}
              className="bg-[#fcba00] hover:bg-[#d99f00] text-black"
            >
              Use Selected
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

