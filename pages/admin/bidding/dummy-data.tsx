'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Upload, 
  FileText, 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  X,
  Music,
  DollarSign,
  User,
  Plus,
  Trash2
} from 'lucide-react';

interface DummyRequest {
  song_title: string;
  song_artist: string;
  bid_amount: number; // in cents
  bidder_name: string;
}

interface ParsedRequest extends DummyRequest {
  id: string;
  errors?: string[];
}

export default function DummyDataAdmin() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [activeRoundId, setActiveRoundId] = useState<string | null>(null);
  
  // Input states
  const [inputMethod, setInputMethod] = useState<'paste' | 'upload'>('paste');
  const [pasteText, setPasteText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // Parsed data
  const [parsedRequests, setParsedRequests] = useState<ParsedRequest[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  
  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string; created?: number } | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (organizationId) {
      loadActiveRound();
    }
  }, [organizationId]);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        router.push('/signin?redirect=/admin/bidding/dummy-data');
        return;
      }

      // Check admin status
      const { isAdminEmail } = await import('@/utils/auth-helpers/admin-roles');
      const isUserAdmin = await isAdminEmail(user.email);
      
      setUser(user);
      setIsAdmin(isUserAdmin);
      
      if (!isUserAdmin) {
        router.push('/');
        return;
      }

      // Get user's organization
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)
        .single();

      if (orgs) {
        setOrganizationId(orgs.id);
      }
    } catch (err) {
      console.error('Auth error:', err);
      router.push('/signin?redirect=/admin/bidding/dummy-data');
    } finally {
      setLoading(false);
    }
  };

  const loadActiveRound = async () => {
    if (!organizationId) return;

    try {
      const response = await fetch(`/api/bidding/current-round?organizationId=${organizationId}`);
      const data = await response.json();
      
      if (data.active && data.round) {
        setActiveRoundId(data.round.id);
      } else {
        setActiveRoundId(null);
      }
    } catch (err) {
      console.error('Error loading active round:', err);
    }
  };

  const parseJSON = (text: string): DummyRequest[] => {
    try {
      const parsed = JSON.parse(text);
      
      if (!Array.isArray(parsed)) {
        throw new Error('Data must be an array of objects');
      }

      return parsed.map((item, idx) => {
        if (!item.song_title || !item.song_artist) {
          throw new Error(`Item ${idx + 1}: Missing song_title or song_artist`);
        }
        
        const bidAmount = typeof item.bid_amount === 'number' 
          ? item.bid_amount 
          : typeof item.bid_amount === 'string'
          ? parseFloat(item.bid_amount) * 100 // Convert dollars to cents
          : 0;

        if (isNaN(bidAmount) || bidAmount < 0) {
          throw new Error(`Item ${idx + 1}: Invalid bid_amount`);
        }

        return {
          song_title: String(item.song_title).trim(),
          song_artist: String(item.song_artist).trim(),
          bid_amount: Math.round(bidAmount),
          bidder_name: String(item.bidder_name || 'Guest').trim()
        };
      });
    } catch (err: any) {
      throw new Error(`JSON Parse Error: ${err.message}`);
    }
  };

  const parseCSV = (text: string): DummyRequest[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have at least a header row and one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const titleIdx = headers.findIndex(h => h.includes('title') || h.includes('song'));
    const artistIdx = headers.findIndex(h => h.includes('artist'));
    const bidIdx = headers.findIndex(h => h.includes('bid') || h.includes('amount'));
    const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('bidder'));

    if (titleIdx === -1 || artistIdx === -1 || bidIdx === -1) {
      throw new Error('CSV must have columns: song_title (or title), song_artist (or artist), bid_amount (or bid/amount)');
    }

    const requests: DummyRequest[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const songTitle = values[titleIdx] || '';
      const songArtist = values[artistIdx] || '';
      const bidStr = values[bidIdx] || '0';
      const bidderName = values[nameIdx] || 'Guest';

      if (!songTitle || !songArtist) {
        throw new Error(`Row ${i + 1}: Missing song_title or song_artist`);
      }

      const bidAmount = parseFloat(bidStr.replace('$', '')) * 100; // Convert to cents
      if (isNaN(bidAmount) || bidAmount < 0) {
        throw new Error(`Row ${i + 1}: Invalid bid_amount`);
      }

      requests.push({
        song_title: songTitle,
        song_artist: songArtist,
        bid_amount: Math.round(bidAmount),
        bidder_name: bidderName
      });
    }

    return requests;
  };

  const validateRequests = (requests: DummyRequest[]): ParsedRequest[] => {
    const errors: string[] = [];
    const validated: ParsedRequest[] = [];

    requests.forEach((req, idx) => {
      const reqErrors: string[] = [];
      
      if (!req.song_title || req.song_title.trim().length === 0) {
        reqErrors.push('Song title is required');
      }
      
      if (!req.song_artist || req.song_artist.trim().length === 0) {
        reqErrors.push('Song artist is required');
      }
      
      if (!req.bid_amount || req.bid_amount < 100) {
        reqErrors.push('Bid amount must be at least $1.00');
      }
      
      if (!req.bidder_name || req.bidder_name.trim().length === 0) {
        req.bidder_name = 'Guest';
      }

      validated.push({
        ...req,
        id: `req-${idx}`,
        errors: reqErrors.length > 0 ? reqErrors : undefined
      });

      if (reqErrors.length > 0) {
        errors.push(`Request ${idx + 1}: ${reqErrors.join(', ')}`);
      }
    });

    setParseErrors(errors);
    return validated;
  };

  const handlePasteChange = (text: string) => {
    setPasteText(text);
    setParsedRequests([]);
    setParseErrors([]);
    setSubmitResult(null);

    if (!text.trim()) return;

    try {
      let requests: DummyRequest[] = [];
      
      // Try JSON first
      if (text.trim().startsWith('[') || text.trim().startsWith('{')) {
        requests = parseJSON(text);
      } else {
        // Try CSV
        requests = parseCSV(text);
      }

      const validated = validateRequests(requests);
      setParsedRequests(validated);
    } catch (err: any) {
      setParseErrors([err.message]);
      setParsedRequests([]);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setParsedRequests([]);
    setParseErrors([]);
    setSubmitResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      handlePasteChange(text);
    };
    reader.onerror = () => {
      setParseErrors(['Failed to read file']);
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleSubmit = async () => {
    if (parsedRequests.length === 0) {
      setSubmitResult({ success: false, message: 'No valid requests to create' });
      return;
    }

    const validRequests = parsedRequests.filter(r => !r.errors);
    if (validRequests.length === 0) {
      setSubmitResult({ success: false, message: 'No valid requests to create. Please fix errors first.' });
      return;
    }

    if (!organizationId || !activeRoundId) {
      setSubmitResult({ success: false, message: 'No active bidding round found. Please start a bidding round first.' });
      return;
    }

    setSubmitting(true);
    setSubmitResult(null);

    try {
      const response = await fetch('/api/admin/bidding/create-dummy-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          organizationId,
          biddingRoundId: activeRoundId,
          requests: validRequests.map(r => ({
            song_title: r.song_title,
            song_artist: r.song_artist,
            bid_amount: r.bid_amount,
            bidder_name: r.bidder_name
          }))
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create dummy requests');
      }

      setSubmitResult({
        success: true,
        message: `Successfully created ${data.created} dummy request(s)!`,
        created: data.created
      });

      // Clear inputs
      setPasteText('');
      setUploadedFile(null);
      setParsedRequests([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Reload active round to show new requests
      setTimeout(() => {
        loadActiveRound();
      }, 1000);
    } catch (err: any) {
      setSubmitResult({
        success: false,
        message: err.message || 'Failed to create dummy requests'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const removeRequest = (id: string) => {
    setParsedRequests(prev => prev.filter(r => r.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Manage Dummy Bidding Data
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Create dummy song requests for testing and demonstration purposes
              </p>
            </div>
            <button
              onClick={() => router.push('/admin/bidding-rounds')}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {!activeRoundId && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                <AlertCircle className="w-5 h-5" />
                <p>No active bidding round found. Please start a bidding round first.</p>
              </div>
            </div>
          )}
        </div>

        {/* Input Method Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setInputMethod('paste')}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                inputMethod === 'paste'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Copy className="w-5 h-5 inline-block mr-2" />
              Copy & Paste
            </button>
            <button
              onClick={() => setInputMethod('upload')}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-colors ${
                inputMethod === 'upload'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Upload className="w-5 h-5 inline-block mr-2" />
              Upload File
            </button>
          </div>

          {inputMethod === 'paste' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Paste JSON or CSV Data
              </label>
              <textarea
                value={pasteText}
                onChange={(e) => handlePasteChange(e.target.value)}
                placeholder={`JSON Format:
[
  {
    "song_title": "Uptown Funk",
    "song_artist": "Bruno Mars",
    "bid_amount": 1000,
    "bidder_name": "Sarah M."
  }
]

Or CSV Format:
song_title,song_artist,bid_amount,bidder_name
Uptown Funk,Bruno Mars,10.00,Sarah M.`}
                className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload JSON or CSV File
              </label>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv,.txt"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Choose File
                </button>
                {uploadedFile && (
                  <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                    Selected: {uploadedFile.name}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Parse Errors */}
        {parseErrors.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">Parse Errors</h3>
                <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-1">
                  {parseErrors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Preview */}
        {parsedRequests.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Preview ({parsedRequests.length} request{parsedRequests.length !== 1 ? 's' : ''})
              </h2>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {parsedRequests.filter(r => !r.errors).length} valid, {parsedRequests.filter(r => r.errors).length} with errors
              </div>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {parsedRequests.map((req) => (
                <div
                  key={req.id}
                  className={`p-4 rounded-lg border-2 ${
                    req.errors
                      ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
                      : 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Music className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {req.song_title}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">by</span>
                        <span className="text-gray-700 dark:text-gray-300">{req.song_artist}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          <DollarSign className="w-4 h-4" />
                          <span>${(req.bid_amount / 100).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                          <User className="w-4 h-4" />
                          <span>{req.bidder_name}</span>
                        </div>
                      </div>
                      {req.errors && (
                        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                          {req.errors.join(', ')}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeRequest(req.id)}
                      className="ml-4 p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Result */}
        {submitResult && (
          <div
            className={`mb-6 rounded-lg p-4 border-2 ${
              submitResult.success
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {submitResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
              <p
                className={
                  submitResult.success
                    ? 'text-green-800 dark:text-green-200'
                    : 'text-red-800 dark:text-red-200'
                }
              >
                {submitResult.message}
              </p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        {parsedRequests.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <button
              onClick={handleSubmit}
              disabled={submitting || parsedRequests.filter(r => !r.errors).length === 0 || !activeRoundId}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Requests...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Create {parsedRequests.filter(r => !r.errors).length} Request{parsedRequests.filter(r => !r.errors).length !== 1 ? 's' : ''}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

