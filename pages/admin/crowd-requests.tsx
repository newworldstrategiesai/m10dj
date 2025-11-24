'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  QrCode, 
  Music, 
  Mic, 
  Download, 
  Copy, 
  CheckCircle, 
  AlertCircle, 
  Plus,
  RefreshCw,
  Search,
  Filter,
  DollarSign,
  Calendar,
  User,
  Trash2,
  Eye,
  Edit3,
  Printer,
  Zap,
  X,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/Toasts/use-toast';
import AdminLayout from '@/components/layouts/AdminLayout';

interface CrowdRequest {
  id: string;
  event_qr_code: string;
  request_type: 'song_request' | 'shoutout';
  song_artist: string | null;
  song_title: string | null;
  recipient_name: string | null;
  recipient_message: string | null;
  requester_name: string;
  requester_email: string | null;
  requester_phone: string | null;
  amount_requested: number;
  amount_paid: number;
  payment_status: string;
  payment_method: string | null;
  payment_intent_id: string | null;
  refund_amount: number | null;
  refunded_at: string | null;
  status: string;
  event_name: string | null;
  event_date: string | null;
  is_fast_track: boolean;
  fast_track_fee: number;
  priority_order: number;
  created_at: string;
  paid_at: string | null;
}

export default function CrowdRequestsPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  const [requests, setRequests] = useState<CrowdRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showQRGenerator, setShowQRGenerator] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [qrType, setQrType] = useState<'event' | 'public'>('event');
  
  // QR Code Generator State
  const [qrEventCode, setQrEventCode] = useState('');
  const [qrEventName, setQrEventName] = useState('');
  const [qrEventDate, setQrEventDate] = useState('');
  const [generatedQR, setGeneratedQR] = useState<string | null>(null);
  const [generatedPublicQR, setGeneratedPublicQR] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Settings State
  const [paymentSettings, setPaymentSettings] = useState({
    cashAppTag: '$DJbenmurray',
    venmoUsername: '@djbenmurray'
  });
  const [requestSettings, setRequestSettings] = useState({
    fastTrackFee: 1000, // in cents ($10.00)
    minimumAmount: 100, // in cents ($1.00)
    presetAmounts: [500, 1000, 2000, 5000] // in cents: $5, $10, $20, $50
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchRequests();
    fetchPaymentSettings();
  }, []);

  const fetchPaymentSettings = async () => {
    try {
      const response = await fetch('/api/admin-settings');
      if (response.ok) {
        const data = await response.json();
        const cashAppSetting = data.find((s: any) => s.setting_key === 'crowd_request_cashapp_tag');
        const venmoSetting = data.find((s: any) => s.setting_key === 'crowd_request_venmo_username');
        const fastTrackFeeSetting = data.find((s: any) => s.setting_key === 'crowd_request_fast_track_fee');
        const minimumAmountSetting = data.find((s: any) => s.setting_key === 'crowd_request_minimum_amount');
        const presetAmountsSetting = data.find((s: any) => s.setting_key === 'crowd_request_preset_amounts');
        
        if (cashAppSetting) {
          setPaymentSettings(prev => ({ ...prev, cashAppTag: cashAppSetting.setting_value }));
        }
        if (venmoSetting) {
          setPaymentSettings(prev => ({ ...prev, venmoUsername: venmoSetting.setting_value }));
        }
        if (fastTrackFeeSetting) {
          setRequestSettings(prev => ({ ...prev, fastTrackFee: parseInt(fastTrackFeeSetting.setting_value) || 1000 }));
        }
        if (minimumAmountSetting) {
          setRequestSettings(prev => ({ ...prev, minimumAmount: parseInt(minimumAmountSetting.setting_value) || 100 }));
        }
        if (presetAmountsSetting) {
          try {
            const amounts = JSON.parse(presetAmountsSetting.setting_value);
            if (Array.isArray(amounts)) {
              setRequestSettings(prev => ({ ...prev, presetAmounts: amounts }));
            }
          } catch (e) {
            console.error('Error parsing preset amounts:', e);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching payment settings:', err);
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      // Save CashApp tag
      await fetch('/api/admin-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settingKey: 'crowd_request_cashapp_tag',
          settingValue: paymentSettings.cashAppTag
        })
      });

      // Save Venmo username
      await fetch('/api/admin-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settingKey: 'crowd_request_venmo_username',
          settingValue: paymentSettings.venmoUsername
        })
      });

      // Save fast-track fee
      await fetch('/api/admin-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settingKey: 'crowd_request_fast_track_fee',
          settingValue: requestSettings.fastTrackFee.toString()
        })
      });

      // Save minimum amount
      await fetch('/api/admin-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settingKey: 'crowd_request_minimum_amount',
          settingValue: requestSettings.minimumAmount.toString()
        })
      });

      // Save preset amounts
      await fetch('/api/admin-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settingKey: 'crowd_request_preset_amounts',
          settingValue: JSON.stringify(requestSettings.presetAmounts)
        })
      });

      toast({
        title: 'Success',
        description: 'Settings saved successfully',
      });
    } catch (err) {
      console.error('Error saving settings:', err);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('crowd_requests')
        .select('*')
        .order('priority_order', { ascending: true }) // Fast-track (0) comes first
        .order('created_at', { ascending: false }); // Then by date within each priority group

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load crowd requests',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (requestId: string, fullRefund: boolean = true, partialAmount?: number) => {
    if (!confirm(`Are you sure you want to ${fullRefund ? 'fully' : 'partially'} refund this payment?`)) {
      return;
    }

    try {
      const response = await fetch('/api/crowd-request/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          amount: fullRefund ? undefined : partialAmount,
          reason: 'requested_by_admin',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process refund');
      }

      toast({
        title: 'Success',
        description: data.message || 'Refund processed successfully',
      });

      // Refresh requests to show updated status
      fetchRequests();
    } catch (error: any) {
      console.error('Error processing refund:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to process refund',
        variant: 'destructive',
      });
    }
  };

  const generateQRCode = () => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    let requestUrl: string;
    let qrCodeUrl: string;

    if (qrType === 'public') {
      // Generate QR for public requests page
      requestUrl = `${baseUrl}/requests`;
      qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(requestUrl)}`;
      setGeneratedPublicQR(qrCodeUrl);
      setGeneratedQR(null);
    } else {
      // Generate QR for event-specific page
      if (!qrEventCode.trim()) {
        toast({
          title: 'Error',
          description: 'Please enter an event code',
          variant: 'destructive',
        });
        return;
      }
      requestUrl = `${baseUrl}/crowd-request/${encodeURIComponent(qrEventCode)}`;
      qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(requestUrl)}`;
      setGeneratedQR(qrCodeUrl);
      setGeneratedPublicQR(null);
    }
    
    toast({
      title: 'QR Code Generated',
      description: 'Your QR code is ready!',
    });
  };

  const copyQRUrl = () => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    let requestUrl: string;
    
    if (qrType === 'public') {
      requestUrl = `${baseUrl}/requests`;
    } else {
      if (!qrEventCode.trim()) return;
      requestUrl = `${baseUrl}/crowd-request/${encodeURIComponent(qrEventCode)}`;
    }
    
    navigator.clipboard.writeText(requestUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: 'Copied!',
      description: 'QR code URL copied to clipboard',
    });
  };

  const downloadQRCode = () => {
    const qrToDownload = qrType === 'public' ? generatedPublicQR : generatedQR;
    if (!qrToDownload) return;
    
    const link = document.createElement('a');
    link.href = qrToDownload;
    const filename = qrType === 'public' ? 'qr-code-public-requests.png' : `qr-code-${qrEventCode}.png`;
    link.download = filename;
    link.click();
  };

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('crowd_requests')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Request status updated',
      });
      
      fetchRequests();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const updatePaymentStatus = async (requestId: string, paymentStatus: string, paymentMethod?: string) => {
    try {
      const response = await fetch('/api/crowd-request/update-payment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          paymentStatus,
          paymentMethod
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update payment status');
      }
      
      toast({
        title: 'Success',
        description: `Payment status updated to ${paymentStatus}`,
      });
      
      fetchRequests();
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update payment status',
        variant: 'destructive',
      });
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.requester_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.song_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.song_artist?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.event_qr_code?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter || 
                         (statusFilter === 'paid' && request.payment_status === 'paid');
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string, paymentStatus: string) => {
    if (paymentStatus === 'refunded') {
      return <Badge className="bg-red-600 text-white">Refunded</Badge>;
    } else if (paymentStatus === 'partially_refunded') {
      return <Badge className="bg-orange-600 text-white">Partially Refunded</Badge>;
    } else if (paymentStatus === 'paid') {
      return <Badge className="bg-green-500 text-white">Paid</Badge>;
    } else if (paymentStatus === 'pending') {
      return <Badge className="bg-yellow-500 text-white">Pending</Badge>;
    } else if (paymentStatus === 'failed') {
      return <Badge className="bg-red-500 text-white">Failed</Badge>;
    }
    
    switch (status) {
      case 'new':
        return <Badge className="bg-blue-500 text-white">New</Badge>;
      case 'acknowledged':
        return <Badge className="bg-purple-500 text-white">Acknowledged</Badge>;
      case 'playing':
        return <Badge className="bg-orange-500 text-white">Playing</Badge>;
      case 'played':
        return <Badge className="bg-green-600 text-white">Played</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Crowd Requests
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage song requests and shoutouts from events
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowSettings(!showSettings)}
              variant="outline"
              className="inline-flex items-center gap-2"
            >
              <Edit3 className="w-5 h-5" />
              Payment Settings
            </Button>
            <Button
              onClick={() => setShowQRGenerator(!showQRGenerator)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <QrCode className="w-5 h-5" />
              {showQRGenerator ? 'Hide' : 'Generate'} QR Code
            </Button>
          </div>
        </div>

        {/* QR Code Generator */}
        {showQRGenerator && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Generate QR Code
            </h2>
            
            {/* QR Type Selection */}
            <div className="flex gap-3 mb-6 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setQrType('event');
                  setGeneratedQR(null);
                  setGeneratedPublicQR(null);
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all ${
                  qrType === 'event'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Event-Specific
              </button>
              <button
                type="button"
                onClick={() => {
                  setQrType('public');
                  setGeneratedQR(null);
                  setGeneratedPublicQR(null);
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-semibold transition-all ${
                  qrType === 'public'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Public Requests Page
              </button>
            </div>

            {qrType === 'event' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Event Code <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={qrEventCode}
                      onChange={(e) => setQrEventCode(e.target.value)}
                      placeholder="e.g., wedding-2025-01-15"
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Unique identifier for this event (used in URL)
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Event Name (optional)
                    </label>
                    <Input
                      value={qrEventName}
                      onChange={(e) => setQrEventName(e.target.value)}
                      placeholder="e.g., Sarah & Michael's Wedding"
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Event Date (optional)
                    </label>
                    <Input
                      type="date"
                      value={qrEventDate}
                      onChange={(e) => setQrEventDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mb-4">
                  <Button
                    onClick={generateQRCode}
                    className="btn-primary inline-flex items-center gap-2"
                    disabled={!qrEventCode.trim()}
                  >
                    <QrCode className="w-4 h-4" />
                    Generate QR Code
                  </Button>
                  
                  {generatedQR && (
                    <>
                      <Button
                        onClick={copyQRUrl}
                        variant="outline"
                        className="inline-flex items-center gap-2"
                      >
                        {copied ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy URL
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={downloadQRCode}
                        variant="outline"
                        className="inline-flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download QR
                      </Button>
                      
                      <Button
                        onClick={() => window.print()}
                        variant="outline"
                        className="inline-flex items-center gap-2"
                      >
                        <Printer className="w-4 h-4" />
                        Print
                      </Button>
                    </>
                  )}
                </div>

                {generatedQR && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-start gap-6">
                      <div className="bg-white p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <img 
                          src={generatedQR} 
                          alt="QR Code" 
                          className="w-48 h-48"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          Request URL:
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded break-all">
                          {process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/crowd-request/{qrEventCode}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Scan this QR code or share the URL above with your event attendees.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    This QR code will link to the public requests page at <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">/requests</code>. 
                    Anyone can use this page to submit song requests or shoutouts.
                  </p>
                </div>

                <div className="flex gap-3 mb-4">
                  <Button
                    onClick={generateQRCode}
                    className="btn-primary inline-flex items-center gap-2"
                  >
                    <QrCode className="w-4 h-4" />
                    Generate Public QR Code
                  </Button>
                  
                  {generatedPublicQR && (
                    <>
                      <Button
                        onClick={copyQRUrl}
                        variant="outline"
                        className="inline-flex items-center gap-2"
                      >
                        {copied ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy URL
                          </>
                        )}
                      </Button>
                      
                      <Button
                        onClick={downloadQRCode}
                        variant="outline"
                        className="inline-flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download QR
                      </Button>
                      
                      <Button
                        onClick={() => window.print()}
                        variant="outline"
                        className="inline-flex items-center gap-2"
                      >
                        <Printer className="w-4 h-4" />
                        Print
                      </Button>
                    </>
                  )}
                </div>

                {generatedPublicQR && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex items-start gap-6">
                      <div className="bg-white p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                        <img 
                          src={generatedPublicQR} 
                          alt="Public Requests QR Code" 
                          className="w-48 h-48"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          Public Requests URL:
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-mono bg-gray-50 dark:bg-gray-900 p-2 rounded break-all">
                          {process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/requests
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          Scan this QR code or share the URL above. This page is publicly accessible to anyone.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Settings */}
        {showSettings && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Crowd Request Settings
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Configure payment methods, pricing, and other parameters for crowd requests.
            </p>
            
            <div className="space-y-6">
              {/* Payment Method Settings */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Payment Methods
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      CashApp Tag
                    </label>
                    <Input
                      value={paymentSettings.cashAppTag}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, cashAppTag: e.target.value }))}
                      placeholder="$DJbenmurray"
                      className="max-w-md"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Your CashApp cashtag (e.g., $DJbenmurray)
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Venmo Username
                    </label>
                    <Input
                      value={paymentSettings.venmoUsername}
                      onChange={(e) => setPaymentSettings(prev => ({ ...prev, venmoUsername: e.target.value }))}
                      placeholder="@djbenmurray"
                      className="max-w-md"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Your Venmo username (e.g., @djbenmurray)
                    </p>
                  </div>
                </div>
              </div>

              {/* Pricing Settings */}
              <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Pricing Configuration
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Fast-Track Fee (in dollars)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={(requestSettings.fastTrackFee / 100).toFixed(2)}
                      onChange={(e) => {
                        const dollars = parseFloat(e.target.value) || 0;
                        setRequestSettings(prev => ({ ...prev, fastTrackFee: Math.round(dollars * 100) }));
                      }}
                      placeholder="10.00"
                      className="max-w-md"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Additional fee for fast-tracking song requests to the front of the queue
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Minimum Payment Amount (in dollars)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={(requestSettings.minimumAmount / 100).toFixed(2)}
                      onChange={(e) => {
                        const dollars = parseFloat(e.target.value) || 0;
                        setRequestSettings(prev => ({ ...prev, minimumAmount: Math.round(dollars * 100) }));
                      }}
                      placeholder="1.00"
                      className="max-w-md"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Minimum amount users can pay for a request
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Quick Amount Presets (in dollars)
                    </label>
                    <div className="space-y-2 max-w-md">
                      {requestSettings.presetAmounts.map((amount, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={(amount / 100).toFixed(2)}
                              onChange={(e) => {
                                const dollars = parseFloat(e.target.value) || 0;
                                if (dollars > 0) {
                                  const newAmounts = [...requestSettings.presetAmounts];
                                  newAmounts[index] = Math.round(dollars * 100);
                                  setRequestSettings(prev => ({ ...prev, presetAmounts: newAmounts }));
                                }
                              }}
                              className="pl-8"
                              placeholder="0.00"
                            />
                          </div>
                          {requestSettings.presetAmounts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newAmounts = requestSettings.presetAmounts.filter((_, i) => i !== index);
                                setRequestSettings(prev => ({ ...prev, presetAmounts: newAmounts }));
                              }}
                              className="px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Remove this amount"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setRequestSettings(prev => ({ 
                            ...prev, 
                            presetAmounts: [...prev.presetAmounts, 500] // Add $5.00 by default
                          }));
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Add Amount
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Preset payment amounts shown as quick options. Click the X to remove an amount.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={saveSettings}
                  disabled={savingSettings}
                  className="btn-primary"
                >
                  {savingSettings ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save All Settings'
                  )}
                </Button>
                <Button
                  onClick={() => setShowSettings(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search requests..."
              className="pl-10"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="new">New</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="playing">Playing</option>
            <option value="played">Played</option>
            <option value="paid">Paid</option>
          </select>
          
          <Button
            onClick={fetchRequests}
            variant="outline"
            className="inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Requests List */}
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-400">Loading requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No requests found</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Request
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Requester
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredRequests.map((request) => (
                    <tr 
                      key={request.id} 
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        request.is_fast_track ? 'bg-orange-50 dark:bg-orange-900/10 border-l-4 border-orange-500' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {request.request_type === 'song_request' ? (
                            <Music className={`w-5 h-5 ${request.is_fast_track ? 'text-orange-500' : 'text-purple-500'}`} />
                          ) : (
                            <Mic className="w-5 h-5 text-pink-500" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-gray-900 dark:text-white">
                                {request.request_type === 'song_request' 
                                  ? request.song_title || 'Unknown Song'
                                  : `Shoutout for ${request.recipient_name}`}
                              </p>
                              {request.is_fast_track && (
                                <Badge className="bg-orange-500 text-white flex items-center gap-1 px-2 py-0.5">
                                  <Zap className="w-3 h-3" />
                                  Fast-Track
                                </Badge>
                              )}
                            </div>
                            {request.request_type === 'song_request' && request.song_artist && (
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                by {request.song_artist}
                              </p>
                            )}
                            {request.request_type === 'shoutout' && request.recipient_message && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                                {request.recipient_message}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {request.requester_name}
                          </p>
                          {request.requester_email && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {request.requester_email}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold text-gray-900 dark:text-white">
                              ${((request.amount_paid || request.amount_requested) / 100).toFixed(2)}
                            </span>
                          </div>
                          {request.is_fast_track && request.fast_track_fee > 0 && (
                            <span className="text-xs text-orange-600 dark:text-orange-400">
                              +${(request.fast_track_fee / 100).toFixed(2)} fast-track
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(request.status, request.payment_status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(request.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <select
                            value={request.status}
                            onChange={(e) => updateRequestStatus(request.id, e.target.value)}
                            className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="new">New</option>
                            <option value="acknowledged">Acknowledged</option>
                            <option value="playing">Playing</option>
                            <option value="played">Played</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          
                          {/* Payment Status Update - Show for pending payments */}
                          {request.payment_status === 'pending' && (
                            <Button
                              onClick={() => {
                                const paymentMethod = request.payment_method || 'manual';
                                updatePaymentStatus(request.id, 'paid', paymentMethod);
                              }}
                              size="sm"
                              className="text-xs h-6 bg-green-600 hover:bg-green-700 text-white"
                            >
                              Mark Paid
                            </Button>
                          )}
                          
                          {/* Show payment method if paid */}
                          {request.payment_status === 'paid' && request.payment_method && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {request.payment_method === 'card' ? '💳 Card' : 
                                 request.payment_method === 'cashapp' ? '💰 CashApp' :
                                 request.payment_method === 'venmo' ? '💸 Venmo' :
                                 '✅ Paid'}
                              </span>
                              {/* Refund button - only for Stripe payments */}
                              {request.payment_intent_id && (
                                <Button
                                  onClick={() => handleRefund(request.id, true)}
                                  size="sm"
                                  className="text-xs h-6 bg-red-600 hover:bg-red-700 text-white"
                                  title="Refund payment"
                                >
                                  <RotateCcw className="w-3 h-3 mr-1" />
                                  Refund
                                </Button>
                              )}
                            </div>
                          )}
                          {/* Show refund status if refunded */}
                          {(request.payment_status === 'refunded' || request.payment_status === 'partially_refunded') && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                                {request.payment_status === 'refunded' ? '🔄 Refunded' : '🔄 Partially Refunded'}
                              </span>
                              {request.refund_amount && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  ${(request.refund_amount / 100).toFixed(2)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Requests</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {requests.length}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Paid</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {requests.filter(r => r.payment_status === 'paid').length}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${(requests
                .filter(r => r.payment_status === 'paid' || r.payment_status === 'partially_refunded')
                .reduce((sum, r) => {
                  const paid = r.amount_paid || 0;
                  const refunded = r.refund_amount || 0;
                  return sum + (paid - refunded);
                }, 0) / 100).toFixed(2)}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {requests.filter(r => r.payment_status === 'pending').length}
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

