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
  AlertCircle,
  Mail,
  Send,
  Eye
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { generateProspectWelcomeEmail } from '@/lib/email/tipjar-batch-emails';

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
  const [previewEmail, setPreviewEmail] = useState<{ html: string; subject: string } | null>(null);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [reviewOrg, setReviewOrg] = useState<CreatedOrganization | null>(null);
  const [previewProspect, setPreviewProspect] = useState<Prospect | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  
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
  const handleCreate = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    console.log('handleCreate called', { prospectsCount: prospects.length, prospects });
    
    const validation = validateProspects();
    if (!validation.valid) {
      console.log('Validation failed', validation.errors);
      toast({
        title: 'Validation errors',
        description: validation.errors.join(', '),
        variant: 'destructive'
      });
      return;
    }

    if (prospects.length === 0) {
      console.log('No prospects to create');
      toast({
        title: 'No prospects',
        description: quickMode ? 'Please fill in the prospect information' : 'Please add at least one prospect',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Sending request to /api/admin/tipjar/batch-create', { prospects, quickMode });
      
      // For single page creation, don't send emails automatically (admin reviews first)
      // For batch creation, send emails automatically
      const sendEmails = !quickMode || prospects.length > 1;
      
      const response = await fetch('/api/admin/tipjar/batch-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          prospects,
          send_emails: sendEmails
        })
      });

      console.log('Response status:', response.status, response.ok);
      
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        console.error('API error:', response.status, data);
        // Show more detailed error message if available
        const errorMessage = data.message || data.error || `Failed to create organizations (${response.status})`;
        const errorDetails = data.details ? ` Details: ${data.details}` : '';
        const errorHint = data.hint ? ` Hint: ${data.hint}` : '';
        throw new Error(errorMessage + errorDetails + errorHint);
      }

      console.log('Success! Created organizations:', data.organizations?.length);
      
      setCreatedOrgs(data.organizations || []);
      
      // For single page creation in quick mode, show review step first
      if (quickMode && data.created === 1 && data.organizations?.[0]) {
        setReviewOrg(data.organizations[0]);
        setShowReview(true);
        setShowResults(false); // Don't show results dialog yet
      } else {
        // For batch creation or multiple pages, show results immediately
        setShowResults(true);
      }
      
      toast({
        title: 'Success!',
        description: `Created ${data.created} Tip Jar page(s)`,
      });

      // Clear prospects after success (only if not in quick mode, or if it was single)
      if (!quickMode || data.created === 1) {
        setProspects([]);
        setCsvFile(null);
      }
    } catch (error: any) {
      console.error('Error creating organizations:', error);
      console.error('Error stack:', error.stack);
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

  // Send welcome email for a created organization
  const sendWelcomeEmail = async (org: CreatedOrganization) => {
    setSendingEmail(true);
    try {
      const response = await fetch('/api/admin/tipjar/send-welcome-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_id: org.id,
          prospect_email: org.prospect_email
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      toast({
        title: 'Email sent!',
        description: `Welcome email sent to ${org.prospect_email}`,
      });

      // Close review dialog and show success
      setShowReview(false);
      setReviewOrg(null);
      
      // Option to create another
      setTimeout(() => {
        if (confirm('Email sent! Would you like to create another page?')) {
          setProspects([{
            email: '',
            business_name: '',
            artist_name: '',
            phone: '',
            slug: ''
          }]);
        } else {
          setQuickMode(false);
        }
      }, 500);

    } catch (error: any) {
      console.error('Error sending email:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send email',
        variant: 'destructive'
      });
    } finally {
      setSendingEmail(false);
    }
  };

  // Preview and send email for a created organization
  const previewAndSendEmail = (org: CreatedOrganization) => {
    const { html } = generateProspectWelcomeEmail({
      prospectEmail: org.prospect_email,
      prospectName: org.name,
      businessName: org.name,
      pageUrl: org.url,
      claimLink: org.claim_link,
      qrCodeUrl: org.qr_code_url,
      productContext: 'tipjar'
    });

    const subject = `Your TipJar page is ready! 🎉`;

    setPreviewEmail({ html, subject });
    setPreviewProspect(null); // Clear previewProspect when previewing created org
    setShowEmailPreview(true);
    // reviewOrg is set by the button onClick handler
  };

  // Preview email for a prospect
  const previewEmailForProspect = (prospect: Prospect) => {
    if (!prospect.email || !prospect.business_name) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in email and business name to preview email',
        variant: 'destructive'
      });
      return;
    }

    // Generate preview data with placeholder URLs
    const baseUrl = process.env.NEXT_PUBLIC_TIPJAR_URL || window.location.origin;
    const slug = prospect.slug || prospect.business_name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    const { html } = generateProspectWelcomeEmail({
      prospectEmail: prospect.email,
      prospectName: prospect.artist_name,
      businessName: prospect.business_name,
      pageUrl: `${baseUrl}/${slug}/requests`,
      claimLink: `${baseUrl}/tipjar/claim?token=PREVIEW_TOKEN`,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${baseUrl}/${slug}/requests`)}`,
      productContext: 'tipjar'
    });

    const subject = `Your TipJar page is ready! 🎉`;

    setPreviewEmail({ html, subject });
    setPreviewProspect(prospect);
    setReviewOrg(null); // Clear reviewOrg when previewing prospect
    setShowEmailPreview(true);
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
                ? 'Create a single Tip Jar Live page for a prospect. Review the page and then send the welcome email.'
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

        {/* Review & Send Email Dialog (Single Page Creation) */}
        <Dialog open={showReview} onOpenChange={(open) => {
          if (!open && reviewOrg) {
            // If closing review without sending, ask to confirm
            if (!confirm('Close without sending email? You can send it later from the dashboard.')) {
              return;
            }
            setReviewOrg(null);
          }
          setShowReview(open);
        }}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Page Created Successfully! 🎉</DialogTitle>
              <DialogDescription>
                Review the page and then preview & send the welcome email
              </DialogDescription>
            </DialogHeader>
            
            {reviewOrg && (
              <div className="space-y-6 mt-4">
                {/* Page URL and QR Code */}
                <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                  <div>
                    <Label className="text-sm font-semibold mb-2 block">Page URL</Label>
                    <div className="flex items-center gap-2">
                      <Input value={reviewOrg.url} readOnly className="text-sm font-mono" />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(reviewOrg.url, 'URL')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(reviewOrg.url, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-semibold mb-2 block">QR Code</Label>
                    <div className="flex items-start gap-4">
                      <img
                        src={reviewOrg.qr_code_url}
                        alt="QR Code"
                        className="w-40 h-40 border-2 border-border rounded-lg"
                      />
                      <div className="flex-1 space-y-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(reviewOrg.qr_code_url, '_blank')}
                          className="w-full"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download QR Code
                        </Button>
                        <p className="text-xs text-muted-foreground">
                          Share this QR code with your prospect. They can scan it to access their Tip Jar page.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      <strong>💡 Tip:</strong> Visit the page URL above to review the page before sending the email. Make sure everything looks good!
                    </p>
                  </div>
                </div>

                {/* Email Actions */}
                <div className="border-t pt-4 space-y-3">
                  <h3 className="font-semibold">Next Step: Send Welcome Email</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const { html } = generateProspectWelcomeEmail({
                          prospectEmail: reviewOrg.prospect_email,
                          prospectName: reviewOrg.name,
                          businessName: reviewOrg.name,
                          pageUrl: reviewOrg.url,
                          claimLink: reviewOrg.claim_link,
                          qrCodeUrl: reviewOrg.qr_code_url,
                          productContext: 'tipjar'
                        });
                        setPreviewEmail({ html, subject: 'Your TipJar page is ready! 🎉' });
                        setShowEmailPreview(true);
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview Email
                    </Button>
                    <Button
                      onClick={() => sendWelcomeEmail(reviewOrg)}
                      disabled={sendingEmail}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {sendingEmail ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Welcome Email
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowReview(false);
                        setReviewOrg(null);
                        if (confirm('Skip email for now? You can send it later from the dashboard.')) {
                          if (confirm('Would you like to create another page?')) {
                            setProspects([{
                              email: '',
                              business_name: '',
                              artist_name: '',
                              phone: '',
                              slug: ''
                            }]);
                          } else {
                            setQuickMode(false);
                          }
                        }
                      }}
                    >
                      Skip for Now
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Email Preview Dialog */}
        <Dialog open={showEmailPreview} onOpenChange={(open) => {
          setShowEmailPreview(open);
          // If closing preview and we have a review org, optionally send email
          if (!open && reviewOrg && previewEmail) {
            // Email preview closed, continue with review dialog
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Email Preview - Welcome Email</DialogTitle>
              <DialogDescription>
                This is how the email will look to prospects
              </DialogDescription>
            </DialogHeader>
            
            {previewEmail && (
              <>
                <div className="flex-1 overflow-y-auto border rounded-lg bg-gray-50 p-4">
                  <div className="mb-4 text-sm text-muted-foreground bg-white p-3 rounded border">
                    <p><strong>Subject:</strong> {previewEmail.subject}</p>
                    {reviewOrg && (
                      <p className="text-xs mt-1">
                        <strong>Recipient:</strong> {reviewOrg.prospect_email}
                      </p>
                    )}
                    {previewProspect && (
                      <p className="text-xs mt-1">
                        <strong>Recipient:</strong> {previewProspect.email}
                      </p>
                    )}
                  </div>
                  <div 
                    className="bg-white rounded-lg shadow-sm overflow-hidden"
                    style={{ minHeight: '500px' }}
                    dangerouslySetInnerHTML={{ __html: previewEmail.html }}
                  />
                </div>
                
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEmailPreview(false);
                      setPreviewProspect(null);
                    }}
                    disabled={sendingEmail}
                  >
                    Close
                  </Button>
                  {reviewOrg && (
                    <Button
                      onClick={() => {
                        setShowEmailPreview(false);
                        sendWelcomeEmail(reviewOrg);
                      }}
                      disabled={sendingEmail}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {sendingEmail ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send Email
                        </>
                      )}
                    </Button>
                  )}
                  {previewProspect && (
                    <Button
                      variant="outline"
                      disabled
                      className="opacity-50 cursor-not-allowed"
                      title="Create the organization first to send the email"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Create Page to Send
                    </Button>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

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
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setReviewOrg(org);
                          previewAndSendEmail(org);
                        }}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Preview & Send Email
                      </Button>
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

                  {/* Email Action */}
                  <div className="border-t pt-3 mt-3">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => {
                        setReviewOrg(org);
                        previewAndSendEmail(org);
                      }}
                      className="w-full"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Preview & Send Welcome Email
                    </Button>
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
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => previewEmailForProspect(prospect)}
                          disabled={!prospect.email || !prospect.business_name}
                          title="Preview welcome email"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProspect(index)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
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
                onClick={(e) => {
                  console.log('Create button clicked');
                  handleCreate(e);
                }}
                disabled={loading || !isSuperAdmin}
                size="lg"
                type="button"
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

