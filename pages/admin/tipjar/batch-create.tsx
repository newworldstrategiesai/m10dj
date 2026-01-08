'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '@/components/layouts/AdminLayout';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { isSuperAdminEmail } from '@/utils/auth-helpers/super-admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/Toasts/use-toast';
import {
  Plus,
  Trash2,
  Upload,
  Download,
  QrCode,
  Loader2,
  CheckCircle,
  X,
  Copy,
  ExternalLink,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface Prospect {
  email: string;
  phone?: string;
  business_name: string;
  artist_name?: string;
  slug?: string;
  configuration?: {
    requests_header_artist_name?: string;
    requests_header_location?: string;
    requests_header_date?: string;
    accent_color?: string;
    [key: string]: any;
  };
}

interface CreatedOrganization {
  id: string;
  slug: string;
  name: string;
  email: string;
  url: string;
  qr_code_url: string;
  claim_link: string;
  claim_token: string;
  prospect_email: string;
}

export default function BatchCreateTipJarPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(false);
  const [createdOrgs, setCreatedOrgs] = useState<CreatedOrganization[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'manual' | 'csv'>('manual');
  
  // Quick create mode - start with one empty prospect
  const [quickMode, setQuickMode] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const supabase = createClientComponentClient();

  // Check super admin access
  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          router.push('/signin');
          return;
        }

        const isSuper = isSuperAdminEmail(user.email);
        setIsSuperAdmin(isSuper);

        if (!isSuper) {
          toast({
            title: 'Access Denied',
            description: 'This feature is only available to super admins',
            variant: 'destructive'
          });
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/admin/dashboard');
          }, 2000);
        }
      } catch (error) {
        console.error('Error checking super admin:', error);
        router.push('/signin');
      } finally {
        setAuthLoading(false);
      }
    };

    checkSuperAdmin();
  }, [router, supabase, toast]);

  // Initialize with one empty prospect when component mounts (quick mode ready)
  useEffect(() => {
    // Check URL params for quick mode
    if (router.query.quick === 'true' && isSuperAdmin) {
      setQuickMode(true);
      setProspects([{
        email: '',
        business_name: '',
        artist_name: '',
        phone: '',
        slug: ''
      }]);
    }
  }, [router.query, isSuperAdmin]);

  // Add new prospect row
  const addProspect = () => {
    setProspects([
      ...prospects,
      {
        email: '',
        business_name: '',
        artist_name: '',
        phone: '',
        slug: ''
      }
    ]);
  };

  // Remove prospect row
  const removeProspect = (index: number) => {
    setProspects(prospects.filter((_, i) => i !== index));
  };

  // Update prospect field
  const updateProspect = (index: number, field: keyof Prospect, value: any) => {
    const updated = [...prospects];
    updated[index] = { ...updated[index], [field]: value };
    setProspects(updated);
  };

  // Handle CSV file upload
  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a CSV file',
        variant: 'destructive'
      });
      return;
    }

    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast({
          title: 'Invalid CSV',
          description: 'CSV must have at least a header row and one data row',
          variant: 'destructive'
        });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const emailIndex = headers.indexOf('email');
      const nameIndex = headers.indexOf('business_name') || headers.indexOf('name') || headers.indexOf('business name');

      if (emailIndex === -1 || nameIndex === -1) {
        toast({
          title: 'Missing columns',
          description: 'CSV must have "email" and "business_name" columns',
          variant: 'destructive'
        });
        return;
      }

      const parsed: Prospect[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values[emailIndex] && values[nameIndex]) {
          parsed.push({
            email: values[emailIndex],
            business_name: values[nameIndex],
            artist_name: values[headers.indexOf('artist_name')] || values[headers.indexOf('artist name')] || '',
            phone: values[headers.indexOf('phone')] || '',
            slug: values[headers.indexOf('slug')] || ''
          });
        }
      }

      if (parsed.length > 0) {
        setProspects(parsed);
        setActiveTab('manual');
        toast({
          title: 'CSV imported',
          description: `Imported ${parsed.length} prospects`
        });
      }
    };
    reader.readAsText(file);
  };

  // Validate prospects
  const validateProspects = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const emails = new Set<string>();

    prospects.forEach((prospect, index) => {
      if (!prospect.email || !prospect.email.includes('@')) {
        errors.push(`Row ${index + 1}: Valid email is required`);
      }
      if (prospect.email && emails.has(prospect.email.toLowerCase())) {
        errors.push(`Row ${index + 1}: Duplicate email`);
      }
      emails.add(prospect.email.toLowerCase());
      if (!prospect.business_name || prospect.business_name.trim().length === 0) {
        errors.push(`Row ${index + 1}: Business name is required`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  };

  // Create organizations
  const handleCreate = async () => {
    const validation = validateProspects();
    if (!validation.valid) {
      toast({
        title: 'Validation errors',
        description: validation.errors.join(', '),
        variant: 'destructive'
      });
      return;
    }

    if (prospects.length === 0) {
      toast({
        title: 'No prospects',
        description: quickMode ? 'Please fill in the prospect information' : 'Please add at least one prospect',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/tipjar/batch-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prospects })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create organizations');
      }

      setCreatedOrgs(data.organizations || []);
      setShowResults(true);
      
      toast({
        title: 'Success!',
        description: `Created ${data.created} Tip Jar page(s)`,
      });

      // Clear prospects after success (only if not in quick mode, or if it was single)
      if (!quickMode || data.created === 1) {
        setProspects([]);
        setCsvFile(null);
        
        // If quick mode and single creation, offer to create another
        if (quickMode && data.created === 1) {
          setTimeout(() => {
            if (confirm('Page created! Would you like to create another?')) {
              setProspects([{
                email: '',
                business_name: '',
                artist_name: '',
                phone: '',
                slug: ''
              }]);
              setShowResults(false);
            } else {
              setQuickMode(false);
            }
          }, 1000);
        }
      }
    } catch (error: any) {
      console.error('Error creating organizations:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create organizations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: `${label} copied to clipboard`
    });
  };

  // Export results to CSV
  const exportResults = () => {
    if (createdOrgs.length === 0) return;

    const headers = ['Email', 'Business Name', 'Slug', 'URL', 'Claim Link', 'QR Code URL'];
    const rows = createdOrgs.map(org => [
      org.prospect_email,
      org.name,
      org.slug,
      org.url,
      org.claim_link,
      org.qr_code_url
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tipjar-batch-created-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Exported!',
      description: 'Results exported to CSV'
    });
  };

  // Show loading or access denied
  if (authLoading) {
    return (
      <AdminLayout title="Loading..." showPageTitle={false}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (!isSuperAdmin) {
    return (
      <AdminLayout title="Access Denied" showPageTitle={false}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <AlertCircle className="w-16 h-16 mx-auto text-destructive" />
            <h1 className="text-2xl font-bold">Access Denied</h1>
            <p className="text-muted-foreground">
              This feature is only available to super admins.
            </p>
            <Button onClick={() => router.push('/admin/dashboard')} variant="outline">
              Go to Dashboard
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Batch Create Tip Jar Pages"
      description="Create multiple Tip Jar Live pages for prospects"
      showPageTitle
      pageTitle="Batch Create Tip Jar Pages"
    >
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              {quickMode ? 'Quick Create Tip Jar Page' : 'Batch Create Tip Jar Pages'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {quickMode 
                ? 'Create a single Tip Jar Live page for a prospect. Email will be sent automatically.'
                : 'Create fully configured Tip Jar Live pages for prospects. They can use the pages immediately and claim them later.'}
            </p>
          </div>
          <div className="flex gap-2">
            {!quickMode ? (
              <Button
                variant="outline"
                onClick={() => {
                  setQuickMode(true);
                  setProspects([{
                    email: '',
                    business_name: '',
                    artist_name: '',
                    phone: '',
                    slug: ''
                  }]);
                }}
              >
                Quick Create Single
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setQuickMode(false);
                  setProspects([]);
                }}
              >
                Switch to Batch Mode
              </Button>
            )}
          </div>
        </div>

        {/* Results Dialog */}
        <Dialog open={showResults} onOpenChange={setShowResults}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Created Organizations</DialogTitle>
              <DialogDescription>
                Successfully created {createdOrgs.length} Tip Jar page(s). Share the links and QR codes with prospects.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={exportResults} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              </div>

              {createdOrgs.map((org) => (
                <div key={org.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{org.name}</h3>
                      <p className="text-sm text-muted-foreground">{org.prospect_email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{org.slug}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Page URL</Label>
                      <div className="flex items-center gap-2">
                        <Input value={org.url} readOnly className="text-sm" />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(org.url, 'URL')}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(org.url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Claim Link</Label>
                      <div className="flex items-center gap-2">
                        <Input value={org.claim_link} readOnly className="text-sm" />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(org.claim_link, 'Claim link')}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">QR Code</Label>
                    <div className="flex items-center gap-4">
                      <img
                        src={org.qr_code_url}
                        alt="QR Code"
                        className="w-32 h-32 border rounded"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(org.qr_code_url, '_blank')}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Main Form */}
        <div className="bg-card border rounded-lg p-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="mb-6">
              <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              <TabsTrigger value="csv">CSV Import</TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4">
              {/* Prospects List */}
              <div className="space-y-4">
                {prospects.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">No prospects added yet</p>
                    <Button onClick={addProspect} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Prospect
                    </Button>
                  </div>
                )}

                {prospects.map((prospect, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">Prospect #{index + 1}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProspect(index)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`email-${index}`}>
                          Email <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`email-${index}`}
                          type="email"
                          value={prospect.email}
                          onChange={(e) => updateProspect(index, 'email', e.target.value)}
                          placeholder="dj@example.com"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`phone-${index}`}>Phone (Optional)</Label>
                        <Input
                          id={`phone-${index}`}
                          type="tel"
                          value={prospect.phone || ''}
                          onChange={(e) => updateProspect(index, 'phone', e.target.value)}
                          placeholder="+1234567890"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`business-${index}`}>
                          Business Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id={`business-${index}`}
                          value={prospect.business_name}
                          onChange={(e) => updateProspect(index, 'business_name', e.target.value)}
                          placeholder="DJ John's Events"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`artist-${index}`}>Artist Name (Optional)</Label>
                        <Input
                          id={`artist-${index}`}
                          value={prospect.artist_name || ''}
                          onChange={(e) => updateProspect(index, 'artist_name', e.target.value)}
                          placeholder="DJ John"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`slug-${index}`}>Custom Slug (Optional)</Label>
                        <Input
                          id={`slug-${index}`}
                          value={prospect.slug || ''}
                          onChange={(e) => updateProspect(index, 'slug', e.target.value)}
                          placeholder="dj-john"
                        />
                        <p className="text-xs text-muted-foreground">
                          If not provided, will be auto-generated from business name
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {prospects.length > 0 && (
                  <Button onClick={addProspect} variant="outline" className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Prospect
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="csv" className="space-y-4">
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <Label htmlFor="csv-upload" className="cursor-pointer">
                    <div className="space-y-2">
                      <p className="font-semibold">Upload CSV File</p>
                      <p className="text-sm text-muted-foreground">
                        CSV must include: email, business_name (or name)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Optional columns: artist_name, phone, slug
                      </p>
                    </div>
                  </Label>
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    className="hidden"
                  />
                  {csvFile && (
                    <p className="mt-4 text-sm text-muted-foreground">
                      Selected: {csvFile.name}
                    </p>
                  )}
                </div>

                {prospects.length > 0 && (
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm font-semibold mb-2">
                      {prospects.length} prospect(s) loaded from CSV
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Switch to "Manual Entry" tab to review and edit
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Actions */}
          {prospects.length > 0 && (
            <div className="mt-6 pt-6 border-t flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {prospects.length} prospect(s) ready to create
              </div>
              <Button
                onClick={handleCreate}
                disabled={loading}
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create {prospects.length} Tip Jar Page{prospects.length !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">How it works</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                <li>Pages are created immediately and accessible via link/QR code</li>
                <li>Prospects can receive tips before creating an account</li>
                <li>When ready, prospects claim their page by creating an account</li>
                <li>All tips received before claiming are transferred to their account</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

