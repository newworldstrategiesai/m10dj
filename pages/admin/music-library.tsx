/**
 * Music Library Management Page
 * Allows admins to manage song requests through:
 * - Music library (boundary list)
 * - Blacklist
 * - Special pricing rules
 * - Duplicate request handling
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Music, 
  Save, 
  Upload, 
  Trash2, 
  Plus,
  Search,
  X,
  AlertCircle,
  DollarSign,
  Ban,
  Repeat,
  Settings as SettingsIcon,
  Loader2,
  FileText,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import AdminLayout from '@/components/layouts/AdminLayout';
import PageLoadingWrapper from '@/components/ui/PageLoadingWrapper';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { getCurrentOrganization } from '@/utils/organization-context';

interface MusicLibrarySong {
  id: string;
  song_title: string;
  song_artist: string;
  genre?: string;
  bpm?: number;
  key_signature?: string;
  notes?: string;
  created_at: string;
}

interface BlacklistSong {
  id: string;
  song_title: string;
  song_artist: string;
  reason?: string;
  blacklisted_at: string;
}

interface PricingRule {
  id: string;
  song_title: string;
  song_artist: string;
  custom_price_cents: number;
  applies_to_fast_track: boolean;
  applies_to_regular: boolean;
  notes?: string;
}

interface DuplicateRules {
  enable_duplicate_detection: boolean;
  duplicate_action: 'deny' | 'premium_price' | 'allow';
  duplicate_time_window_minutes: number;
  duplicate_premium_multiplier: number;
  duplicate_premium_fixed_cents?: number;
  match_by_exact_title: boolean;
  match_by_exact_artist: boolean;
  match_case_sensitive: boolean;
}

interface LibrarySettings {
  music_library_enabled: boolean;
  music_library_action: 'deny' | 'premium_price' | 'allow';
  music_library_premium_multiplier: number;
  music_library_premium_fixed_cents?: number;
}

export default function MusicLibraryPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [organization, setOrganization] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'library' | 'blacklist' | 'pricing' | 'duplicates' | 'settings'>('library');

  // Library state
  const [librarySongs, setLibrarySongs] = useState<MusicLibrarySong[]>([]);
  const [librarySearch, setLibrarySearch] = useState('');
  const [libraryPage, setLibraryPage] = useState(0);
  const [libraryTotal, setLibraryTotal] = useState(0);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [selectedLibrarySongs, setSelectedLibrarySongs] = useState<string[]>([]);

  // Blacklist state
  const [blacklistSongs, setBlacklistSongs] = useState<BlacklistSong[]>([]);
  const [blacklistSearch, setBlacklistSearch] = useState('');
  const [blacklistPage, setBlacklistPage] = useState(0);
  const [blacklistTotal, setBlacklistTotal] = useState(0);
  const [showAddBlacklistDialog, setShowAddBlacklistDialog] = useState(false);
  const [newBlacklistSong, setNewBlacklistSong] = useState({ title: '', artist: '', reason: '' });
  const [selectedBlacklistSongs, setSelectedBlacklistSongs] = useState<string[]>([]);

  // Pricing rules state
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [pricingSearch, setPricingSearch] = useState('');
  const [pricingPage, setPricingPage] = useState(0);
  const [pricingTotal, setPricingTotal] = useState(0);
  const [showAddPricingDialog, setShowAddPricingDialog] = useState(false);
  const [newPricingRule, setNewPricingRule] = useState({
    title: '',
    artist: '',
    priceCents: '',
    appliesToFastTrack: true,
    appliesToRegular: true,
    notes: ''
  });
  const [selectedPricingRules, setSelectedPricingRules] = useState<string[]>([]);

  // Duplicate rules state
  const [duplicateRules, setDuplicateRules] = useState<DuplicateRules>({
    enable_duplicate_detection: true,
    duplicate_action: 'premium_price',
    duplicate_time_window_minutes: 60,
    duplicate_premium_multiplier: 1.5,
    duplicate_premium_fixed_cents: undefined,
    match_by_exact_title: true,
    match_by_exact_artist: true,
    match_case_sensitive: false
  });

  // Settings state
  const [settings, setSettings] = useState<LibrarySettings>({
    music_library_enabled: false,
    music_library_action: 'premium_price',
    music_library_premium_multiplier: 2.0,
    music_library_premium_fixed_cents: undefined
  });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (organization) {
      fetchLibrary();
      fetchBlacklist();
      fetchPricingRules();
      fetchDuplicateRules();
      fetchSettings();
    }
  }, [organization, libraryPage, blacklistPage, pricingPage]);

  // Debounced search effects
  useEffect(() => {
    if (organization) {
      const timer = setTimeout(() => {
        fetchLibrary();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [librarySearch]);

  useEffect(() => {
    if (organization) {
      const timer = setTimeout(() => {
        fetchBlacklist();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [blacklistSearch]);

  useEffect(() => {
    if (organization) {
      const timer = setTimeout(() => {
        fetchPricingRules();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pricingSearch]);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/signin?redirect=/admin/music-library');
        return;
      }

      const org = await getCurrentOrganization(supabase);
      if (!org) {
        toast({
          title: 'Error',
          description: 'No organization found',
          variant: 'destructive'
        });
        return;
      }

      setOrganization(org);
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/signin?redirect=/admin/music-library');
    } finally {
      setLoading(false);
    }
  };

  const fetchLibrary = async () => {
    if (!organization) return;
    try {
      const response = await fetch(`/api/music-library/library?organizationId=${organization.id}&limit=50&offset=${libraryPage * 50}&search=${encodeURIComponent(librarySearch)}`);
      if (response.ok) {
        const data = await response.json();
        setLibrarySongs(data.songs || []);
        setLibraryTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching library:', error);
    }
  };

  const fetchBlacklist = async () => {
    if (!organization) return;
    try {
      const response = await fetch(`/api/music-library/blacklist?organizationId=${organization.id}&limit=50&offset=${blacklistPage * 50}&search=${encodeURIComponent(blacklistSearch)}`);
      if (response.ok) {
        const data = await response.json();
        setBlacklistSongs(data.songs || []);
        setBlacklistTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching blacklist:', error);
    }
  };

  const fetchPricingRules = async () => {
    if (!organization) return;
    try {
      const response = await fetch(`/api/music-library/pricing-rules?organizationId=${organization.id}&limit=50&offset=${pricingPage * 50}&search=${encodeURIComponent(pricingSearch)}`);
      if (response.ok) {
        const data = await response.json();
        setPricingRules(data.rules || []);
        setPricingTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching pricing rules:', error);
    }
  };

  const fetchDuplicateRules = async () => {
    if (!organization) return;
    try {
      const response = await fetch(`/api/music-library/duplicate-rules?organizationId=${organization.id}`);
      if (response.ok) {
        const data = await response.json();
        setDuplicateRules(data);
      }
    } catch (error) {
      console.error('Error fetching duplicate rules:', error);
    }
  };

  const fetchSettings = async () => {
    if (!organization) return;
    try {
      const response = await fetch(`/api/music-library/settings?organizationId=${organization.id}`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleUploadLibrary = async () => {
    if (!uploadFile || !organization) return;

    setSaving(true);
    try {
      const text = await uploadFile.text();
      let songs: Array<{ songTitle: string; songArtist: string }> = [];

      // Parse CSV or JSON
      if (uploadFile.name.endsWith('.csv')) {
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
        const titleIdx = headers.findIndex(h => h.includes('title') || h.includes('song'));
        const artistIdx = headers.findIndex(h => h.includes('artist') || h.includes('artist'));

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          if (values[titleIdx] && values[artistIdx]) {
            songs.push({
              songTitle: values[titleIdx],
              songArtist: values[artistIdx]
            });
          }
        }
      } else if (uploadFile.name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        songs = Array.isArray(parsed) ? parsed : parsed.songs || [];
      }

      if (songs.length === 0) {
        toast({
          title: 'Error',
          description: 'No songs found in file',
          variant: 'destructive'
        });
        return;
      }

      const response = await fetch('/api/music-library/library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songs })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Added ${songs.length} songs to library`
        });
        setShowUploadDialog(false);
        setUploadFile(null);
        fetchLibrary();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to upload songs',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process file',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLibrarySongs = async () => {
    if (selectedLibrarySongs.length === 0 || !organization) return;

    setSaving(true);
    try {
      const response = await fetch('/api/music-library/library', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songIds: selectedLibrarySongs })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Deleted ${selectedLibrarySongs.length} song(s)`
        });
        setSelectedLibrarySongs([]);
        fetchLibrary();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to delete songs',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete songs',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddBlacklist = async () => {
    if (!newBlacklistSong.title || !newBlacklistSong.artist || !organization) return;

    setSaving(true);
    try {
      const response = await fetch('/api/music-library/blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songTitle: newBlacklistSong.title,
          songArtist: newBlacklistSong.artist,
          reason: newBlacklistSong.reason || null
        })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Song added to blacklist'
        });
        setShowAddBlacklistDialog(false);
        setNewBlacklistSong({ title: '', artist: '', reason: '' });
        fetchBlacklist();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to add to blacklist',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add to blacklist',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBlacklist = async () => {
    if (selectedBlacklistSongs.length === 0 || !organization) return;

    setSaving(true);
    try {
      const response = await fetch('/api/music-library/blacklist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ songIds: selectedBlacklistSongs })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Removed ${selectedBlacklistSongs.length} song(s) from blacklist`
        });
        setSelectedBlacklistSongs([]);
        fetchBlacklist();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to remove from blacklist',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove from blacklist',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddPricingRule = async () => {
    if (!newPricingRule.title || !newPricingRule.artist || !newPricingRule.priceCents || !organization) return;

    const priceCents = newPricingRule.priceCents === '-1' ? -1 : parseInt(newPricingRule.priceCents);
    if (isNaN(priceCents) || priceCents < -1) {
      toast({
        title: 'Error',
        description: 'Invalid price',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/music-library/pricing-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songTitle: newPricingRule.title,
          songArtist: newPricingRule.artist,
          customPriceCents: priceCents,
          appliesToFastTrack: newPricingRule.appliesToFastTrack,
          appliesToRegular: newPricingRule.appliesToRegular,
          notes: newPricingRule.notes || null
        })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Pricing rule added'
        });
        setShowAddPricingDialog(false);
        setNewPricingRule({ title: '', artist: '', priceCents: '', appliesToFastTrack: true, appliesToRegular: true, notes: '' });
        fetchPricingRules();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to add pricing rule',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add pricing rule',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePricingRules = async () => {
    if (selectedPricingRules.length === 0 || !organization) return;

    setSaving(true);
    try {
      const response = await fetch('/api/music-library/pricing-rules', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleIds: selectedPricingRules })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Deleted ${selectedPricingRules.length} pricing rule(s)`
        });
        setSelectedPricingRules([]);
        fetchPricingRules();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to delete pricing rules',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete pricing rules',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDuplicateRules = async () => {
    if (!organization) return;

    setSaving(true);
    try {
      const response = await fetch('/api/music-library/duplicate-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enableDuplicateDetection: duplicateRules.enable_duplicate_detection,
          duplicateAction: duplicateRules.duplicate_action,
          duplicateTimeWindowMinutes: duplicateRules.duplicate_time_window_minutes,
          duplicatePremiumMultiplier: duplicateRules.duplicate_premium_multiplier,
          duplicatePremiumFixedCents: duplicateRules.duplicate_premium_fixed_cents || null,
          matchByExactTitle: duplicateRules.match_by_exact_title,
          matchByExactArtist: duplicateRules.match_by_exact_artist,
          matchCaseSensitive: duplicateRules.match_case_sensitive
        })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Duplicate rules saved'
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to save duplicate rules',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save duplicate rules',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!organization) return;

    setSaving(true);
    try {
      const response = await fetch('/api/music-library/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          musicLibraryEnabled: settings.music_library_enabled,
          musicLibraryAction: settings.music_library_action,
          musicLibraryPremiumMultiplier: settings.music_library_premium_multiplier,
          musicLibraryPremiumFixedCents: settings.music_library_premium_fixed_cents || null
        })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Settings saved'
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to save settings',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageLoadingWrapper isLoading={true} message="Loading music library management...">
        <div></div>
      </PageLoadingWrapper>
    );
  }

  return (
    <AdminLayout title="Music Library Management" description="Manage song requests, blacklist, pricing, and duplicate handling">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Music className="h-6 w-6 text-[#fcba00]" />
            Music Library Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your music library, blacklist, pricing rules, and duplicate handling
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="blacklist">Blacklist</TabsTrigger>
            <TabsTrigger value="pricing">Pricing Rules</TabsTrigger>
            <TabsTrigger value="duplicates">Duplicates</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Library Tab */}
          <TabsContent value="library" className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Music Library</h2>
                <div className="flex gap-2">
                  <Button onClick={() => setShowUploadDialog(true)}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload CSV/JSON
                  </Button>
                  {selectedLibrarySongs.length > 0 && (
                    <Button variant="destructive" onClick={handleDeleteLibrarySongs} disabled={saving}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete ({selectedLibrarySongs.length})
                    </Button>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search library..."
                    value={librarySearch}
                    onChange={(e) => {
                      setLibrarySearch(e.target.value);
                      setLibraryPage(0);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left p-2">
                        <input
                          type="checkbox"
                          checked={selectedLibrarySongs.length === librarySongs.length && librarySongs.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLibrarySongs(librarySongs.map(s => s.id));
                            } else {
                              setSelectedLibrarySongs([]);
                            }
                          }}
                        />
                      </th>
                      <th className="text-left p-2">Title</th>
                      <th className="text-left p-2">Artist</th>
                      <th className="text-left p-2">Genre</th>
                      <th className="text-left p-2">Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {librarySongs.map((song) => (
                      <tr key={song.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={selectedLibrarySongs.includes(song.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedLibrarySongs([...selectedLibrarySongs, song.id]);
                              } else {
                                setSelectedLibrarySongs(selectedLibrarySongs.filter(id => id !== song.id));
                              }
                            }}
                          />
                        </td>
                        <td className="p-2">{song.song_title}</td>
                        <td className="p-2">{song.song_artist}</td>
                        <td className="p-2">{song.genre || '-'}</td>
                        <td className="p-2 text-gray-500">{new Date(song.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {librarySongs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No songs in library. Upload a CSV or JSON file to get started.
                  </div>
                )}

                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-500">
                    Showing {librarySongs.length} of {libraryTotal} songs
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLibraryPage(Math.max(0, libraryPage - 1))}
                      disabled={libraryPage === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLibraryPage(libraryPage + 1)}
                      disabled={(libraryPage + 1) * 50 >= libraryTotal}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Blacklist Tab */}
          <TabsContent value="blacklist" className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Blacklist</h2>
                <div className="flex gap-2">
                  <Button onClick={() => setShowAddBlacklistDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Song
                  </Button>
                  {selectedBlacklistSongs.length > 0 && (
                    <Button variant="destructive" onClick={handleDeleteBlacklist} disabled={saving}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Remove ({selectedBlacklistSongs.length})
                    </Button>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search blacklist..."
                    value={blacklistSearch}
                    onChange={(e) => {
                      setBlacklistSearch(e.target.value);
                      setBlacklistPage(0);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left p-2">
                        <input
                          type="checkbox"
                          checked={selectedBlacklistSongs.length === blacklistSongs.length && blacklistSongs.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBlacklistSongs(blacklistSongs.map(s => s.id));
                            } else {
                              setSelectedBlacklistSongs([]);
                            }
                          }}
                        />
                      </th>
                      <th className="text-left p-2">Title</th>
                      <th className="text-left p-2">Artist</th>
                      <th className="text-left p-2">Reason</th>
                      <th className="text-left p-2">Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blacklistSongs.map((song) => (
                      <tr key={song.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={selectedBlacklistSongs.includes(song.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedBlacklistSongs([...selectedBlacklistSongs, song.id]);
                              } else {
                                setSelectedBlacklistSongs(selectedBlacklistSongs.filter(id => id !== song.id));
                              }
                            }}
                          />
                        </td>
                        <td className="p-2">{song.song_title}</td>
                        <td className="p-2">{song.song_artist}</td>
                        <td className="p-2">{song.reason || '-'}</td>
                        <td className="p-2 text-gray-500">{new Date(song.blacklisted_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {blacklistSongs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No songs in blacklist.
                  </div>
                )}

                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-500">
                    Showing {blacklistSongs.length} of {blacklistTotal} songs
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBlacklistPage(Math.max(0, blacklistPage - 1))}
                      disabled={blacklistPage === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBlacklistPage(blacklistPage + 1)}
                      disabled={(blacklistPage + 1) * 50 >= blacklistTotal}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Pricing Rules Tab */}
          <TabsContent value="pricing" className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pricing Rules</h2>
                <div className="flex gap-2">
                  <Button onClick={() => setShowAddPricingDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Rule
                  </Button>
                  {selectedPricingRules.length > 0 && (
                    <Button variant="destructive" onClick={handleDeletePricingRules} disabled={saving}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete ({selectedPricingRules.length})
                    </Button>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search pricing rules..."
                    value={pricingSearch}
                    onChange={(e) => {
                      setPricingSearch(e.target.value);
                      setPricingPage(0);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left p-2">
                        <input
                          type="checkbox"
                          checked={selectedPricingRules.length === pricingRules.length && pricingRules.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPricingRules(pricingRules.map(r => r.id));
                            } else {
                              setSelectedPricingRules([]);
                            }
                          }}
                        />
                      </th>
                      <th className="text-left p-2">Title</th>
                      <th className="text-left p-2">Artist</th>
                      <th className="text-left p-2">Price</th>
                      <th className="text-left p-2">Applies To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricingRules.map((rule) => (
                      <tr key={rule.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={selectedPricingRules.includes(rule.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPricingRules([...selectedPricingRules, rule.id]);
                              } else {
                                setSelectedPricingRules(selectedPricingRules.filter(id => id !== rule.id));
                              }
                            }}
                          />
                        </td>
                        <td className="p-2">{rule.song_title}</td>
                        <td className="p-2">{rule.song_artist}</td>
                        <td className="p-2">
                          {rule.custom_price_cents === -1 ? (
                            <span className="text-red-600 dark:text-red-400 font-semibold">Denied</span>
                          ) : rule.custom_price_cents === 0 ? (
                            <span className="text-green-600 dark:text-green-400 font-semibold">Free</span>
                          ) : (
                            `$${(rule.custom_price_cents / 100).toFixed(2)}`
                          )}
                        </td>
                        <td className="p-2">
                          {rule.applies_to_fast_track && rule.applies_to_regular ? 'All' : 
                           rule.applies_to_fast_track ? 'Fast Track' : 'Regular'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {pricingRules.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No pricing rules. Add a rule to set custom pricing for specific songs.
                  </div>
                )}

                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-500">
                    Showing {pricingRules.length} of {pricingTotal} rules
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPricingPage(Math.max(0, pricingPage - 1))}
                      disabled={pricingPage === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPricingPage(pricingPage + 1)}
                      disabled={(pricingPage + 1) * 50 >= pricingTotal}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Duplicate Rules Tab */}
          <TabsContent value="duplicates" className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Duplicate Request Handling</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Duplicate Detection</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Automatically detect when a song has already been played
                    </p>
                  </div>
                  <Switch
                    checked={duplicateRules.enable_duplicate_detection}
                    onCheckedChange={(checked) => setDuplicateRules({ ...duplicateRules, enable_duplicate_detection: checked })}
                  />
                </div>

                {duplicateRules.enable_duplicate_detection && (
                  <>
                    <div>
                      <Label>Action for Duplicates</Label>
                      <Select
                        value={duplicateRules.duplicate_action}
                        onValueChange={(value: 'deny' | 'premium_price' | 'allow') => 
                          setDuplicateRules({ ...duplicateRules, duplicate_action: value })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="deny">Deny Request</SelectItem>
                          <SelectItem value="premium_price">Charge Premium Price</SelectItem>
                          <SelectItem value="allow">Allow (No Change)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Time Window (minutes)</Label>
                      <Input
                        type="number"
                        value={duplicateRules.duplicate_time_window_minutes}
                        onChange={(e) => setDuplicateRules({ ...duplicateRules, duplicate_time_window_minutes: parseInt(e.target.value) || 60 })}
                        className="mt-1"
                        min={1}
                      />
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        How long after a song is played to consider a new request a duplicate
                      </p>
                    </div>

                    {duplicateRules.duplicate_action === 'premium_price' && (
                      <>
                        <div>
                          <Label>Premium Multiplier</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={duplicateRules.duplicate_premium_multiplier}
                            onChange={(e) => setDuplicateRules({ ...duplicateRules, duplicate_premium_multiplier: parseFloat(e.target.value) || 1.5 })}
                            className="mt-1"
                            min={1}
                          />
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Multiply base price by this amount (e.g., 1.5 = 50% increase)
                          </p>
                        </div>

                        <div>
                          <Label>Fixed Premium Amount (cents) - Optional</Label>
                          <Input
                            type="number"
                            value={duplicateRules.duplicate_premium_fixed_cents || ''}
                            onChange={(e) => setDuplicateRules({ 
                              ...duplicateRules, 
                              duplicate_premium_fixed_cents: e.target.value ? parseInt(e.target.value) : undefined 
                            })}
                            className="mt-1"
                            placeholder="Leave empty to use multiplier"
                          />
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Fixed premium amount in cents (overrides multiplier if set)
                          </p>
                        </div>
                      </>
                    )}
                  </>
                )}

                <Button onClick={handleSaveDuplicateRules} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Duplicate Rules
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Music Library Settings</h2>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Music Library Boundary</Label>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Use your music library as a boundary for song requests
                    </p>
                  </div>
                  <Switch
                    checked={settings.music_library_enabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, music_library_enabled: checked })}
                  />
                </div>

                {settings.music_library_enabled && (
                  <>
                    <div>
                      <Label>Action for Songs Not in Library</Label>
                      <Select
                        value={settings.music_library_action}
                        onValueChange={(value: 'deny' | 'premium_price' | 'allow') => 
                          setSettings({ ...settings, music_library_action: value })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="deny">Deny Request</SelectItem>
                          <SelectItem value="premium_price">Charge Premium Price</SelectItem>
                          <SelectItem value="allow">Allow (No Change)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {settings.music_library_action === 'premium_price' && (
                      <>
                        <div>
                          <Label>Premium Multiplier</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={settings.music_library_premium_multiplier}
                            onChange={(e) => setSettings({ ...settings, music_library_premium_multiplier: parseFloat(e.target.value) || 2.0 })}
                            className="mt-1"
                            min={1}
                          />
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Multiply base price by this amount (e.g., 2.0 = double the price)
                          </p>
                        </div>

                        <div>
                          <Label>Fixed Premium Amount (cents) - Optional</Label>
                          <Input
                            type="number"
                            value={settings.music_library_premium_fixed_cents || ''}
                            onChange={(e) => setSettings({ 
                              ...settings, 
                              music_library_premium_fixed_cents: e.target.value ? parseInt(e.target.value) : undefined 
                            })}
                            className="mt-1"
                            placeholder="Leave empty to use multiplier"
                          />
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Fixed premium amount in cents (overrides multiplier if set)
                          </p>
                        </div>
                      </>
                    )}
                  </>
                )}

                <Button onClick={handleSaveSettings} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Settings
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Upload Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Music Library</DialogTitle>
              <DialogDescription>
                Upload a CSV or JSON file containing your music library. CSV should have columns: title, artist (or song_title, song_artist).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>File (CSV or JSON)</Label>
                <Input
                  type="file"
                  accept=".csv,.json"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>Cancel</Button>
              <Button onClick={handleUploadLibrary} disabled={!uploadFile || saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                Upload
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Blacklist Dialog */}
        <Dialog open={showAddBlacklistDialog} onOpenChange={setShowAddBlacklistDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to Blacklist</DialogTitle>
              <DialogDescription>
                Songs in the blacklist will be denied immediately when requested.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Song Title *</Label>
                <Input
                  value={newBlacklistSong.title}
                  onChange={(e) => setNewBlacklistSong({ ...newBlacklistSong, title: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Artist *</Label>
                <Input
                  value={newBlacklistSong.artist}
                  onChange={(e) => setNewBlacklistSong({ ...newBlacklistSong, artist: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Reason (Optional)</Label>
                <Input
                  value={newBlacklistSong.reason}
                  onChange={(e) => setNewBlacklistSong({ ...newBlacklistSong, reason: e.target.value })}
                  className="mt-1"
                  placeholder="Why is this song blacklisted?"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddBlacklistDialog(false)}>Cancel</Button>
              <Button onClick={handleAddBlacklist} disabled={!newBlacklistSong.title || !newBlacklistSong.artist || saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Add to Blacklist
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Pricing Rule Dialog */}
        <Dialog open={showAddPricingDialog} onOpenChange={setShowAddPricingDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Pricing Rule</DialogTitle>
              <DialogDescription>
                Set custom pricing for a specific song. Use -1 to deny, 0 for free, or a positive amount in cents.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Song Title *</Label>
                <Input
                  value={newPricingRule.title}
                  onChange={(e) => setNewPricingRule({ ...newPricingRule, title: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Artist *</Label>
                <Input
                  value={newPricingRule.artist}
                  onChange={(e) => setNewPricingRule({ ...newPricingRule, artist: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Price (cents) *</Label>
                <Input
                  type="number"
                  value={newPricingRule.priceCents}
                  onChange={(e) => setNewPricingRule({ ...newPricingRule, priceCents: e.target.value })}
                  className="mt-1"
                  placeholder="-1 to deny, 0 for free, or amount in cents"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  -1 = Deny, 0 = Free, or enter amount in cents (e.g., 5000 = $50.00)
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newPricingRule.appliesToFastTrack}
                  onCheckedChange={(checked) => setNewPricingRule({ ...newPricingRule, appliesToFastTrack: checked })}
                />
                <Label>Applies to Fast Track Requests</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={newPricingRule.appliesToRegular}
                  onCheckedChange={(checked) => setNewPricingRule({ ...newPricingRule, appliesToRegular: checked })}
                />
                <Label>Applies to Regular Requests</Label>
              </div>
              <div>
                <Label>Notes (Optional)</Label>
                <Input
                  value={newPricingRule.notes}
                  onChange={(e) => setNewPricingRule({ ...newPricingRule, notes: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddPricingDialog(false)}>Cancel</Button>
              <Button onClick={handleAddPricingRule} disabled={!newPricingRule.title || !newPricingRule.artist || !newPricingRule.priceCents || saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Add Rule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
