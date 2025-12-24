'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  MessageSquare,
  ExternalLink,
  Clock,
  Edit3,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  FileText,
  Send,
  Users,
  DollarSign,
  Activity,
  Calendar as CalendarIcon,
  Sparkles,
  TestTube,
  ChevronDown
} from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import LeadCommunicationHub from '@/components/admin/LeadCommunicationHub';
import { getPhoneLocation } from '@/utils/area-code-lookup';

export default function LeadDetailsPage() {
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [relatedContacts, setRelatedContacts] = useState([]);
  const [relatedProjects, setRelatedProjects] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [generatedEmailSubject, setGeneratedEmailSubject] = useState('');
  const [generatedEmailBody, setGeneratedEmailBody] = useState('');
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeSinceSubmission, setTimeSinceSubmission] = useState(null);
  const [isEquipmentOnly, setIsEquipmentOnly] = useState(false);
  const [creatingQuote, setCreatingQuote] = useState(false);
  const [adminEmail, setAdminEmail] = useState(null);
  const [adminPhone, setAdminPhone] = useState(null);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [sendingTestSMS, setSendingTestSMS] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { id } = router.query;
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (id) {
      fetchSubmission();
      fetchRelatedData();
      fetchAdminInfo();
    }
  }, [id]);

  const fetchAdminInfo = async () => {
    try {
      // Get admin email from session
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!userError && user?.email) {
        setAdminEmail(user.email);
      }

      if (user?.id) {
        // Get admin phone from admin_settings
        const { data: phoneSetting } = await supabase
          .from('admin_settings')
          .select('setting_value')
          .eq('setting_key', 'admin_phone_number')
          .eq('user_id', user.id)
          .single();

        if (phoneSetting?.setting_value) {
          // Remove +1 prefix if present for display/storage
          setAdminPhone(phoneSetting.setting_value.replace(/^\+1/, ''));
        }
      }
    } catch (err) {
      console.error('Error fetching admin info:', err);
      // If phone setting doesn't exist, that's okay - we'll just show error when trying to send
    }
  };

  const fetchSubmission = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw error;
      }

      setSubmission(data);
      setNotesValue(data.notes || '');
    } catch (err) {
      console.error('Error fetching submission:', err);
      setError('Failed to load lead details');
      toast({
        title: "Error",
        description: "Failed to load lead details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedData = async () => {
    if (!id) return;
    
    setLoadingRelated(true);
    try {
      const submission = await supabase
        .from('contact_submissions')
        .select('email, phone')
        .eq('id', id)
        .single();

      if (submission.data) {
        // Find related contacts by email or phone
        let contactsQuery = supabase
          .from('contacts')
          .select('id, first_name, last_name, email_address, phone, lead_status, created_at')
          .is('deleted_at', null)
          .limit(10);

        const orConditions = [];
        if (submission.data.email) {
          orConditions.push(`email_address.ilike.%${submission.data.email}%`);
        }
        if (submission.data.phone) {
          orConditions.push(`phone.ilike.%${submission.data.phone}%`);
        }

        if (orConditions.length > 0) {
          contactsQuery = contactsQuery.or(orConditions.join(','));
          const { data: contacts } = await contactsQuery;
          setRelatedContacts(contacts || []);
        }

        // Find related projects/events by email
        if (submission.data.email) {
          const { data: events } = await supabase
            .from('events')
            .select('id, event_name, client_name, event_date, status')
            .eq('client_email', submission.data.email)
            .limit(10);
          setRelatedProjects(events || []);
        }
      }
    } catch (err) {
      console.error('Error fetching related data:', err);
    } finally {
      setLoadingRelated(false);
    }
  };

  const updateStatus = async (newStatus) => {
    try {
      const { error } = await supabase
        .from('contact_submissions')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      setSubmission(prev => ({ 
        ...prev, 
        status: newStatus, 
        updated_at: new Date().toISOString() 
      }));

      toast({
        title: "Success",
        description: "Status updated successfully"
      });
    } catch (err) {
      console.error('Error updating status:', err);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const saveNotes = async () => {
    setSavingNotes(true);
    try {
      const { error } = await supabase
        .from('contact_submissions')
        .update({ 
          notes: notesValue,
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      setSubmission(prev => ({ 
        ...prev, 
        notes: notesValue,
        updated_at: new Date().toISOString() 
      }));

      setIsEditingNotes(false);
      toast({
        title: "Success",
        description: "Notes saved successfully"
      });
    } catch (err) {
      console.error('Error saving notes:', err);
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive"
      });
    } finally {
      setSavingNotes(false);
    }
  };

  const updateField = async (field, value) => {
    try {
      const { error } = await supabase
        .from('contact_submissions')
        .update({ 
          [field]: value,
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      setSubmission(prev => ({ 
        ...prev, 
        [field]: value,
        updated_at: new Date().toISOString() 
      }));
    } catch (err) {
      console.error(`Error updating ${field}:`, err);
      toast({
        title: "Error",
        description: `Failed to update ${field}`,
        variant: "destructive"
      });
    }
  };

  const generateCustomEmail = async () => {
    if (!submission.email) {
      toast({
        title: "Error",
        description: "Lead email is required to generate email",
        variant: "destructive"
      });
      return;
    }

    setGeneratingEmail(true);
    try {
      const response = await fetch(`/api/leads/${id}/generate-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedEmailSubject(data.subject);
        setGeneratedEmailBody(data.body);
        
        // Switch to communications tab
        setActiveTab('communications');
        
        toast({
          title: "Success",
          description: "Custom email generated and saved as draft! Review and edit before sending."
        });
        
        // Refresh communications to load the draft
        // This will be handled by the LeadCommunicationHub component
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate email');
      }
    } catch (error) {
      console.error('Error generating email:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGeneratingEmail(false);
    }
  };

  const convertToContact = async () => {
    try {
      const response = await fetch('/api/migrate-submissions-to-contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionIds: [id]
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: "Lead converted to contact successfully"
        });
        // Redirect to the contact page if a contact was created
        if (data.contacts && data.contacts.length > 0) {
          router.push(`/admin/contacts/${data.contacts[0].id}`);
        }
      } else {
        throw new Error('Failed to convert');
      }
    } catch (err) {
      console.error('Error converting to contact:', err);
      toast({
        title: "Error",
        description: "Failed to convert lead to contact",
        variant: "destructive"
      });
    }
  };

  // Detect if this is an equipment-only inquiry
  const detectEquipmentOnly = (submission) => {
    if (!submission) return false;
    
    const message = (submission.message || '').toLowerCase();
    const eventType = (submission.event_type || '').toLowerCase();
    
    // Not equipment-only if it's a wedding
    if (eventType.includes('wedding')) return false;
    
    // Keywords that indicate equipment-only rental
    const equipmentOnlyKeywords = [
      'rent', 'rental', 'renting',
      'equipment only', 'just equipment', 'only need equipment',
      'speakers', 'microphone', 'mic', 'lighting', 'lights',
      'sound system', 'sound equipment', 'pa system',
      'cables', 'stands', 'subwoofer', 'sub', 'amplifier', 'amp'
    ];
    
    // Keywords that indicate they want DJ services
    const djServiceKeywords = [
      'dj', 'disc jockey', 'music', 'playlist', 'mixing',
      'mc', 'emcee', 'announcements', 'coordinate',
      'ceremony', 'reception', 'dance', 'entertainment'
    ];
    
    // Count matches
    const equipmentMatches = equipmentOnlyKeywords.filter(keyword => 
      message.includes(keyword)
    ).length;
    
    const djServiceMatches = djServiceKeywords.filter(keyword => 
      message.includes(keyword)
    ).length;
    
    // If they mention equipment keywords but no DJ service keywords, likely equipment-only
    const explicitEquipmentOnly = 
      message.includes('equipment only') ||
      message.includes('just need equipment') ||
      message.includes('only equipment') ||
      (message.includes('equipment rental') && djServiceMatches === 0);
    
    return (equipmentMatches > djServiceMatches && equipmentMatches >= 2) || explicitEquipmentOnly;
  };

  const createEquipmentQuote = async () => {
    if (!submission) return;

    // Parse equipment details from message to estimate price
    // For now, we'll use a default minimum of $300
    // Admin can adjust later on the quote page
    const message = (submission.message || '').toLowerCase();
    let estimatedPrice = 300; // Default minimum
    let packageName = 'Equipment Rental Package';

    // Try to estimate price from equipment mentioned
    if (message.includes('15') || message.includes('15 inch') || message.includes('15"')) {
      estimatedPrice = 350; // Minimum package
    }
    if (message.includes('subwoofer') || message.includes('sub')) {
      estimatedPrice = 400;
    }
    if (message.includes('lighting') || message.includes('lights') || message.includes('uplight')) {
      estimatedPrice = Math.max(estimatedPrice, 350);
    }

    setCreatingQuote(true);
    try {
      const response = await fetch(`/api/leads/${id}/create-equipment-quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentDetails: {
            packageName: packageName,
            originalMessage: submission.message
          },
          totalPrice: estimatedPrice,
          packageName: packageName
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: "Equipment rental quote created! Customer can now view and pay online."
        });
        
        // Open quote page in new tab
        if (data.urls && data.urls.quote) {
          window.open(data.urls.quote, '_blank');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create quote');
      }
    } catch (error) {
      console.error('Error creating equipment quote:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create equipment quote. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCreatingQuote(false);
    }
  };

  // Check if equipment-only when submission loads
  useEffect(() => {
    if (submission) {
      setIsEquipmentOnly(detectEquipmentOnly(submission));
    }
  }, [submission]);

  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
      contacted: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800',
      quoted: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800',
      booked: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
      completed: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
      cancelled: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
    };
    return colors[status] || colors.new;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysSince = (dateString) => {
    if (!dateString) return null;
    const days = Math.floor((new Date() - new Date(dateString)) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getTimeSinceSubmission = (dateString) => {
    if (!dateString) return null;
    const now = new Date();
    const submissionDate = new Date(dateString);
    const diffMs = now - submissionDate;
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds, totalMs: diffMs };
  };

  useEffect(() => {
    if (!submission?.created_at) return;
    
    // Update immediately
    setTimeSinceSubmission(getTimeSinceSubmission(submission.created_at));
    
    // Update every second
    const interval = setInterval(() => {
      setTimeSinceSubmission(getTimeSinceSubmission(submission.created_at));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [submission?.created_at]);

  const getDaysUntil = (dateString) => {
    if (!dateString) return null;
    const days = Math.ceil((new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const sendTestEmail = async () => {
    if (!adminEmail) {
      toast({
        title: "Error",
        description: "Admin email not found. Please ensure you're logged in.",
        variant: "destructive"
      });
      return;
    }

    setSendingTestEmail(true);
    try {
      const response = await fetch('/api/admin/communications/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: id,
          to: adminEmail,
          subject: 'Test Email - M10 DJ Company Lead Management',
          content: `This is a test email sent from the lead management system.

Lead Information:
- Name: ${submission.name}
- Email: ${submission.email}
- Phone: ${submission.phone || 'N/A'}
- Event Type: ${submission.event_type || 'N/A'}
- Event Date: ${submission.event_date ? formatDate(submission.event_date) : 'N/A'}

If you received this email, your email system is working correctly!`
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Test email sent to ${adminEmail}`
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send test email');
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send test email",
        variant: "destructive"
      });
    } finally {
      setSendingTestEmail(false);
    }
  };

  const sendTestSMS = async () => {
    if (!adminPhone) {
      toast({
        title: "Error",
        description: "Admin phone number not found. Please configure in settings.",
        variant: "destructive"
      });
      return;
    }

    setSendingTestSMS(true);
    try {
      // Format phone number (ensure it has country code if needed)
      // Remove any spaces, dashes, parentheses
      let formattedPhone = adminPhone.replace(/[\s\-\(\)]/g, '');
      // If it doesn't start with +, add +1 for US numbers
      if (!formattedPhone.startsWith('+')) {
        // If it's 10 digits, add +1
        if (/^\d{10}$/.test(formattedPhone)) {
          formattedPhone = `+1${formattedPhone}`;
        } else if (/^1\d{10}$/.test(formattedPhone)) {
          formattedPhone = `+${formattedPhone}`;
        }
      }

      const response = await fetch('/api/admin/communications/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: id,
          to: formattedPhone,
          message: `Test SMS from M10 DJ Lead Management. Lead: ${submission.name} (${submission.event_type || 'N/A'}). System is working!`
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: `Test SMS sent to ${adminPhone}`
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send test SMS');
      }
    } catch (error) {
      console.error('Error sending test SMS:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send test SMS",
        variant: "destructive"
      });
    } finally {
      setSendingTestSMS(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#fcba00] mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {error || 'Lead not found'}
          </h2>
          <Link href="/admin/dashboard">
            <Button className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const daysUntilEvent = submission.event_date ? getDaysUntil(submission.event_date) : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <Link href="/admin/dashboard">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            
            <div className="flex items-center gap-4">
              <Badge className={`${getStatusColor(submission.status)}`}>
                {submission.status}
              </Badge>
              
              <Link href={`/admin/contacts/${submission.id}?from=lead`}>
                <Button>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Manage Contact
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-[#fcba00] rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-black" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {submission.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {submission.event_type} • Submitted {formatDateTime(submission.created_at)}
              </p>
            </div>
          </div>
        </Card>

        {/* Quick Actions Bar */}
        <Card className="p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = `mailto:${submission.email}`}
              disabled={!submission.email}
            >
              <Mail className="h-4 w-4 mr-2" />
              Email
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = `tel:${submission.phone}`}
              disabled={!submission.phone}
            >
              <Phone className="h-4 w-4 mr-2" />
              Call
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={generateCustomEmail}
              disabled={generatingEmail || !submission.email}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {generatingEmail ? 'Generating...' : 'Generate Email'}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={convertToContact}
            >
              <Users className="h-4 w-4 mr-2" />
              Convert to Contact
            </Button>
            {isEquipmentOnly && (
              <Button 
                variant="default" 
                size="sm"
                onClick={createEquipmentQuote}
                disabled={creatingQuote}
                className="bg-[#fcba00] hover:bg-[#e6a800] text-black"
              >
                <FileText className="h-4 w-4 mr-2" />
                {creatingQuote ? 'Creating Quote...' : 'Create Quote & Invoice'}
              </Button>
            )}
            {submission.location && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(submission.location)}`, '_blank')}
              >
                <MapPin className="h-4 w-4 mr-2" />
                View Location
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={sendingTestEmail || sendingTestSMS}
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  Send Test
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={sendTestEmail}
                  disabled={!adminEmail || sendingTestEmail}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {sendingTestEmail ? 'Sending...' : 'Test Email'}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={sendTestSMS}
                  disabled={!adminPhone || sendingTestSMS}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {sendingTestSMS ? 'Sending...' : 'Test SMS'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Card>

        {/* Lead Intelligence Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Time Since Submission</p>
                {timeSinceSubmission ? (
                  <p className="text-lg font-bold text-gray-900 dark:text-white font-mono">
                    {timeSinceSubmission.days > 0 && `${timeSinceSubmission.days}d `}
                    {timeSinceSubmission.hours > 0 && `${timeSinceSubmission.hours}h `}
                    {timeSinceSubmission.minutes > 0 && `${timeSinceSubmission.minutes}m `}
                    {timeSinceSubmission.seconds}s
                  </p>
                ) : (
                  <p className="text-lg font-bold text-gray-900 dark:text-white">--</p>
                )}
              </div>
              <Clock className="h-8 w-8 text-gray-400 flex-shrink-0 ml-4" />
            </div>
          </Card>
          {daysUntilEvent !== null && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Days Until Event</p>
                  <p className={`text-2xl font-bold ${daysUntilEvent < 0 ? 'text-red-600' : daysUntilEvent < 30 ? 'text-yellow-600' : 'text-gray-900 dark:text-white'}`}>
                    {daysUntilEvent < 0 ? `${Math.abs(daysUntilEvent)} ago` : daysUntilEvent}
                  </p>
                </div>
                <CalendarIcon className="h-8 w-8 text-gray-400" />
              </div>
            </Card>
          )}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Priority</p>
                <Badge variant="outline" className="mt-1">
                  {submission.priority || 'Normal'}
                </Badge>
              </div>
              <TrendingUp className="h-8 w-8 text-gray-400" />
            </div>
          </Card>
          {submission.last_contact_date && (
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Last Contact</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {getDaysSince(submission.last_contact_date)} days ago
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-gray-400" />
              </div>
            </Card>
          )}
        </div>

        {/* Main Content Tabs */}
        <Tabs 
          value={activeTab}
          onValueChange={(value) => {
            console.log('Tab changing to:', value);
            setActiveTab(value);
          }}
          className="space-y-6"
        >
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="communications">Communications</TabsTrigger>
            <TabsTrigger value="notes">Notes & Follow-ups</TabsTrigger>
            <TabsTrigger value="related">Related Data</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Status Update */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Update Status</h2>
              <Select value={submission.status} onValueChange={updateStatus}>
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="quoted">Quoted</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contact Information */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Contact Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                    <p className="text-gray-900 dark:text-white">{submission.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a href={`mailto:${submission.email}`} className="text-[#fcba00] hover:underline">
                        {submission.email}
                      </a>
                    </div>
                  </div>
                  {submission.phone && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <a href={`tel:${submission.phone}`} className="text-[#fcba00] hover:underline">
                          {submission.phone}
                        </a>
                        {getPhoneLocation(submission.phone) && (
                          <Badge variant="outline" className="text-xs">
                            {getPhoneLocation(submission.phone)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Event Details */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Event Details
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Event Type</label>
                    <p className="text-gray-900 dark:text-white capitalize">{submission.event_type}</p>
                  </div>
                  {submission.event_date && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                      <p className="text-gray-900 dark:text-white">{formatDate(submission.event_date)}</p>
                      {daysUntilEvent !== null && (
                        <Badge className={`mt-1 ${daysUntilEvent < 0 ? 'bg-red-100 text-red-800' : daysUntilEvent < 30 ? 'bg-yellow-100 text-yellow-800' : ''}`}>
                          {daysUntilEvent < 0 ? 'Event passed' : `${daysUntilEvent} days away`}
                        </Badge>
                      )}
                    </div>
                  )}
                  {submission.location && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <p className="text-gray-900 dark:text-white">{submission.location}</p>
                      </div>
                    </div>
                  )}
                  {submission.guest_count && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Guest Count</label>
                      <p className="text-gray-900 dark:text-white">{submission.guest_count}</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Message */}
            {submission.message && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Initial Message
                </h2>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{submission.message}</p>
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Communications Tab */}
          <TabsContent value="communications">
            <LeadCommunicationHub
              submissionId={id}
              submissionEmail={submission.email}
              submissionPhone={submission.phone}
              submissionName={submission.name}
              initialEmailSubject={generatedEmailSubject}
              initialEmailBody={generatedEmailBody}
              onEmailGenerated={() => {
                // Reset after use to avoid re-triggering
                setTimeout(() => {
                  setGeneratedEmailSubject('');
                  setGeneratedEmailBody('');
                }, 100);
              }}
            />
          </TabsContent>

          {/* Notes & Follow-ups Tab */}
          <TabsContent value="notes" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes
                </h2>
                {!isEditingNotes && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditingNotes(true)}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
              
              {isEditingNotes ? (
                <div className="space-y-4">
                  <Textarea
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    placeholder="Add notes about this lead..."
                    rows={10}
                    className="dark:bg-gray-800"
                  />
                  <div className="flex gap-2">
                    <Button onClick={saveNotes} disabled={savingNotes}>
                      <Save className="h-4 w-4 mr-2" />
                      {savingNotes ? 'Saving...' : 'Save Notes'}
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setIsEditingNotes(false);
                      setNotesValue(submission.notes || '');
                    }}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 min-h-[200px]">
                  {submission.notes ? (
                    <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{submission.notes}</p>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 italic">No notes added yet. Click Edit to add notes.</p>
                  )}
                </div>
              )}
            </Card>

            {/* Follow-up Date */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Follow-up Date
              </h2>
              <Input
                type="date"
                value={submission.follow_up_date || ''}
                onChange={(e) => updateField('follow_up_date', e.target.value)}
                className="max-w-xs"
              />
              {submission.follow_up_date && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Scheduled for {formatDate(submission.follow_up_date)}
                  {getDaysUntil(submission.follow_up_date) !== null && (
                    <span className="ml-2">
                      ({getDaysUntil(submission.follow_up_date)} days from now)
                    </span>
                  )}
                </p>
              )}
            </Card>

            {/* Priority */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Priority
              </h2>
              <Select 
                value={submission.priority || 'normal'} 
                onValueChange={(value) => updateField('priority', value)}
              >
                <SelectTrigger className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </Card>
          </TabsContent>

          {/* Related Data Tab */}
          <TabsContent value="related" className="space-y-6">
            {/* Related Contacts */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Related Contacts
              </h2>
              {loadingRelated ? (
                <p className="text-gray-500">Loading...</p>
              ) : relatedContacts.length > 0 ? (
                <div className="space-y-3">
                  {relatedContacts.map((contact) => (
                    <Link key={contact.id} href={`/admin/contacts/${contact.id}`}>
                      <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {contact.first_name} {contact.last_name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {contact.email_address || contact.phone}
                          </p>
                        </div>
                        <Badge>{contact.lead_status || 'N/A'}</Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No related contacts found</p>
              )}
            </Card>

            {/* Related Projects/Events */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Related Projects/Events
              </h2>
              {loadingRelated ? (
                <p className="text-gray-500">Loading...</p>
              ) : relatedProjects.length > 0 ? (
                <div className="space-y-3">
                  {relatedProjects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {project.event_name || project.client_name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {project.event_date ? formatDate(project.event_date) : 'No date'}
                        </p>
                      </div>
                      <Badge>{project.status || 'N/A'}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No related projects found</p>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
