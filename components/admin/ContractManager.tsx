import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { 
  FileText, 
  Search, 
  Download, 
  Eye, 
  Send, 
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  RefreshCw,
  Plus,
  Copy,
  ExternalLink,
  X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ContractParticipantsManager from '@/components/admin/ContractParticipantsManager';

interface Contract {
  id: string;
  contract_number: string;
  contract_type: string;
  contact_id: string | null;
  invoice_id: string | null;
  status: string;
  event_name: string;
  event_date: string;
  start_time?: string | null;
  end_time?: string | null;
  total_amount: number;
  contract_html: string;
  signing_token: string;
  sent_at: string | null;
  signed_at: string | null;
  signed_by_vendor: string | null;
  signed_by_vendor_at: string | null;
  vendor_signature_data: string | null;
  client_signature_data: string | null;
  created_at: string;
  contacts: {
    first_name: string;
    last_name: string;
    email_address: string;
  } | null;
  invoices: {
    invoice_number: string;
  } | null;
  recipient_name?: string;
  recipient_email?: string;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email_address: string;
  event_type: string;
  event_date: string;
}

export default function ContractManager() {
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<Contract[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState('');
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    fetchContracts();
    fetchContacts();
  }, []);

  useEffect(() => {
    filterContracts();
  }, [contracts, searchTerm, statusFilter, typeFilter]);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          contacts (
            first_name,
            last_name,
            email_address
          ),
          invoices (
            invoice_number
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load contracts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email_address, event_type, event_date')
        .not('event_date', 'is', null)
        .order('event_date', { ascending: false })
        .limit(100);

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const filterContracts = () => {
    let filtered = contracts;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(c => c.contract_type === typeFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(c =>
        c.contract_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contacts?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contacts?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contacts?.email_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.recipient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.recipient_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.event_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredContracts(filtered);
  };

  const getContractTypeDisplayName = (contractType: string) => {
    const displayNames: Record<string, string> = {
      'quote_based': 'Quote-Based',
      'nda': 'NDA',
      'personal_agreement': 'Personal Agreement',
      'service_agreement': 'Service Agreement',
      'addendum': 'Addendum',
      'amendment': 'Amendment',
      'cancellation': 'Cancellation',
      'vendor_agreement': 'Vendor Agreement',
      'partnership': 'Partnership',
      'general': 'General'
    };
    return displayNames[contractType] || contractType;
  };

  const formatTime = (timeStr: string | null | undefined): string | null => {
    if (!timeStr) return null;
    
    try {
      // Handle different time formats (HH:mm:ss, HH:mm, etc.)
      const timeParts = timeStr.split(':');
      const hours = parseInt(timeParts[0], 10);
      const minutes = timeParts[1] || '00';
      
      if (isNaN(hours)) return null;
      
      const hour12 = hours % 12 || 12;
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const minutesStr = minutes.padStart(2, '0');
      
      return `${hour12}:${minutesStr} ${ampm}`;
    } catch {
      return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      viewed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      signed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      completed: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      expired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };

    const icons = {
      draft: Clock,
      sent: Send,
      viewed: Eye,
      signed: CheckCircle,
      completed: CheckCircle,
      expired: XCircle,
    };

    const Icon = icons[status as keyof typeof icons] || Clock;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles] || styles.draft}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const handleGenerateContract = async () => {
    if (!selectedContact) {
      toast({
        title: 'Error',
        description: 'Please select a contact',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);

    try {
      const res = await fetch('/api/contracts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: selectedContact
        })
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMessage = data.details || data.error || 'Failed to generate contract';
        console.error('Contract generation error:', data);
        throw new Error(errorMessage);
      }

      toast({
        title: 'Contract Generated',
        description: `Contract ${data.contract.contract_number} has been created`,
      });

      setShowGenerateModal(false);
      setSelectedContact('');
      fetchContracts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate contract',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSendContract = async (contract: Contract) => {
    try {
      const res = await fetch('/api/contracts/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId: contract.id })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send contract');
      }

      toast({
        title: 'Contract Sent',
        description: `Contract sent to ${contract.contacts?.email_address || 'contact'}`,
      });

      fetchContracts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send contract',
        variant: 'destructive',
      });
    }
  };

  const handleCopySigningLink = (contract: Contract) => {
    const signingUrl = `${window.location.origin}/sign-contract/${contract.signing_token}`;
    navigator.clipboard.writeText(signingUrl);
    toast({
      title: 'Link Copied',
      description: 'Signing link copied to clipboard',
    });
  };

  const handleUnsign = async (contract: Contract) => {
    // Only allow unsigning if vendor has signed but client hasn't
    if (!contract.vendor_signature_data && !contract.signed_by_vendor) {
      toast({
        title: 'Error',
        description: 'Contract is not signed by vendor',
        variant: 'destructive',
      });
      return;
    }

    if (contract.client_signature_data) {
      toast({
        title: 'Error',
        description: 'Cannot unsign: Customer has already signed',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Are you sure you want to remove your signature from contract ${contract.contract_number}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/contracts/${contract.id}/unsign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to unsign contract');
      }

      toast({
        title: 'Contract Unsigned',
        description: `Your signature has been removed from ${contract.contract_number}`,
      });

      fetchContracts();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to unsign contract',
        variant: 'destructive',
      });
    }
  };

  const handlePreview = (contract: Contract) => {
    setSelectedContract(contract);
    setShowPreview(true);
  };

  const handleSelectContract = (contractId: string) => {
    setSelectedContracts(prev =>
      prev.includes(contractId)
        ? prev.filter(id => id !== contractId)
        : [...prev, contractId]
    );
  };

  const handleSelectAll = () => {
    if (selectedContracts.length === filteredContracts.length) {
      setSelectedContracts([]);
    } else {
      setSelectedContracts(filteredContracts.map(c => c.id));
    }
  };

  const handleBulkSend = async () => {
    if (selectedContracts.length === 0) return;

    try {
      const contractsToSend = filteredContracts.filter(c => selectedContracts.includes(c.id) && c.status === 'draft');

      for (const contract of contractsToSend) {
        await handleSendContract(contract);
      }

      setSelectedContracts([]);
      toast({
        title: 'Bulk Send Complete',
        description: `Sent ${contractsToSend.length} contracts for signature`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Some contracts failed to send. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleBulkDownload = async () => {
    if (selectedContracts.length === 0) return;

    try {
      const contractsToDownload = filteredContracts.filter(c => selectedContracts.includes(c.id));

      for (const contract of contractsToDownload) {
        await handleDownload(contract);
        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setSelectedContracts([]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Some PDFs failed to download. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = async (contract: Contract) => {
    try {
      setDownloading(contract.id);
      
      // Generate PDF via API
      const res = await fetch('/api/contracts/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractId: contract.id })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || error.details || 'Failed to generate PDF');
      }

      // Get PDF blob
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      
      // Download PDF
      const a = document.createElement('a');
      a.href = url;
      a.download = `${contract.contract_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'PDF Downloaded',
        description: `Contract ${contract.contract_number} has been downloaded as PDF`,
      });
    } catch (error: any) {
      console.error('PDF generation error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (showPreview && selectedContract) {
    return (
      <div className="space-y-4 sm:space-y-6">
        {/* Header Section */}
        <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 sm:gap-6">
              <div className="flex-1 min-w-0">
                <div className="mb-4">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2 break-words">
                    {selectedContract.contract_number}
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                      selectedContract.contract_type === 'quote_based' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      selectedContract.contract_type === 'nda' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      selectedContract.contract_type === 'personal_agreement' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {getContractTypeDisplayName(selectedContract.contract_type)}
                    </span>
                    {getStatusBadge(selectedContract.status)}
                    {selectedContract.signed_at && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Signed: {new Date(selectedContract.signed_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Contract Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Card>
                    <CardContent className="p-3 sm:p-4">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Client</p>
                      {selectedContract.contacts ? (
                        <>
                          <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white break-words">
                            {selectedContract.contacts.first_name} {selectedContract.contacts.last_name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-all">
                            {selectedContract.contacts.email_address}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm sm:text-base font-semibold text-gray-500 dark:text-gray-400 italic">
                          No contact
                        </p>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-3 sm:p-4">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Event</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white break-words">
                        {selectedContract.event_name || 'N/A'}
                      </p>
                      {selectedContract.event_date && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(selectedContract.event_date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </p>
                      )}
                      {(selectedContract.start_time || selectedContract.end_time) && (
                        <div className="mt-2 space-y-1">
                          {selectedContract.start_time && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-medium">Start:</span> {formatTime(selectedContract.start_time) || selectedContract.start_time}
                            </p>
                          )}
                          {selectedContract.end_time && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              <span className="font-medium">End:</span> {formatTime(selectedContract.end_time) || selectedContract.end_time}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {selectedContract.total_amount && (
                    <Card className="sm:col-span-2">
                      <CardContent className="p-3 sm:p-4">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Contract Value</p>
                        <p className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">
                          ${selectedContract.total_amount.toFixed(2)}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-56 shrink-0">
                <Button
                  variant="outline"
                  onClick={() => handleCopySigningLink(selectedContract)}
                  className="w-full"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
                <Button
                  onClick={() => handleDownload(selectedContract)}
                  disabled={downloading === selectedContract.id}
                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  {downloading === selectedContract.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </>
                  )}
                </Button>
                {selectedContract.status === 'draft' && (
                  <Button
                    onClick={() => handleSendContract(selectedContract)}
                    className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send for Signature
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPreview(false);
                    setSelectedContract(null);
                  }}
                  className="w-full"
                >
                  Close Preview
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contract Preview */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">Contract Preview</CardTitle>
              <span className="text-xs text-gray-500 dark:text-gray-400">Read-only preview</span>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 lg:p-8 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto">
            <div 
              className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-white
                prose-ul:text-gray-700 dark:prose-ul:text-gray-300
                prose-li:text-gray-700 dark:prose-li:text-gray-300
                min-w-full"
              dangerouslySetInnerHTML={{ __html: selectedContract.contract_html }}
            />
          </CardContent>
        </Card>

        {/* Participants Manager */}
        <ContractParticipantsManager
          contractId={selectedContract.id}
          contractNumber={selectedContract.contract_number}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with Generate Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Contracts</h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage and track client contracts
          </p>
        </div>
        <Button
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Generate Contract</span>
          <span className="sm:hidden">Generate</span>
        </Button>
      </div>

      {/* Bulk Actions Bar */}
      {selectedContracts.length > 0 && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  {selectedContracts.length} contract{selectedContracts.length !== 1 ? 's' : ''} selected
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={handleBulkSend}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  Send Selected
                </Button>
                <Button
                  onClick={handleBulkDownload}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700"
                >
                  Download PDFs
                </Button>
                <Button
                  onClick={() => setSelectedContracts([])}
                  size="sm"
                  variant="outline"
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <Input
                type="text"
                placeholder="Search contracts, clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400 dark:text-gray-500 hidden sm:block" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="viewed">Viewed</SelectItem>
                  <SelectItem value="signed">Signed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-400 dark:text-gray-500 hidden sm:block" />
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="quote_based">Quote-Based</SelectItem>
                  <SelectItem value="nda">NDA</SelectItem>
                  <SelectItem value="personal_agreement">Personal Agreement</SelectItem>
                  <SelectItem value="service_agreement">Service Agreement</SelectItem>
                  <SelectItem value="addendum">Addendum</SelectItem>
                  <SelectItem value="amendment">Amendment</SelectItem>
                  <SelectItem value="cancellation">Cancellation</SelectItem>
                  <SelectItem value="vendor_agreement">Vendor Agreement</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={fetchContracts}
              variant="outline"
              size="icon"
              className="shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Contracts List - Mobile Cards / Desktop Table */}
      {filteredContracts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No contracts found</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Generate your first contract to get started'}
            </p>
            <Button
              onClick={() => setShowGenerateModal(true)}
              className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700"
            >
              <Plus className="w-4 h-4" />
              Generate Contract
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="block md:hidden space-y-3">
            {filteredContracts.map((contract) => (
              <Card 
                key={contract.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handlePreview(contract)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedContracts.includes(contract.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectContract(contract.id);
                        }}
                        className="mt-1 w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {contract.contract_number}
                          </h3>
                          {getStatusBadge(contract.status)}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          {getContractTypeDisplayName(contract.contract_type)}
                        </p>
                        {contract.invoices && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Invoice: {contract.invoices.invoice_number}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Client</span>
                      <span className="text-gray-900 dark:text-white font-medium text-right">
                        {contract.contacts 
                          ? `${contract.contacts.first_name} ${contract.contacts.last_name}`
                          : contract.recipient_name || 'No contact'}
                      </span>
                    </div>
                    {contract.event_name && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Event</span>
                        <span className="text-gray-900 dark:text-white text-right truncate ml-2">
                          {contract.event_name}
                        </span>
                      </div>
                    )}
                    {contract.event_date && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Date</span>
                        <span className="text-gray-900 dark:text-white">
                          {new Date(contract.event_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {contract.total_amount && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Amount</span>
                        <span className="text-gray-900 dark:text-white font-semibold">
                          ${contract.total_amount.toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Created</span>
                      <span className="text-gray-900 dark:text-white">
                        {new Date(contract.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(contract);
                      }}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopySigningLink(contract);
                      }}
                      className="flex-1"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Link
                    </Button>
                    {contract.status === 'draft' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSendContract(contract);
                        }}
                        className="flex-1"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </Button>
                    )}
                    {(contract.vendor_signature_data || contract.signed_by_vendor) && !contract.client_signature_data && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUnsign(contract);
                        }}
                        className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Unsign
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <Card className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">
                      <input
                        type="checkbox"
                        checked={selectedContracts.length === filteredContracts.length && filteredContracts.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Contract
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredContracts.map((contract) => (
                    <tr
                      key={contract.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedContracts.includes(contract.id)}
                          onChange={() => handleSelectContract(contract.id)}
                          className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handlePreview(contract)}>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {contract.contract_number}
                        </div>
                        {contract.invoices && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {contract.invoices.invoice_number}
                          </div>
                        )}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handlePreview(contract)}>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {getContractTypeDisplayName(contract.contract_type)}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handlePreview(contract)}>
                        {contract.contacts ? (
                          <>
                            <div className="text-sm text-gray-900 dark:text-white">
                              {contract.contacts.first_name} {contract.contacts.last_name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {contract.contacts.email_address}
                            </div>
                          </>
                        ) : contract.recipient_name ? (
                          <>
                            <div className="text-sm text-gray-900 dark:text-white">
                              {contract.recipient_name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {contract.recipient_email}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                            No contact
                          </div>
                        )}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handlePreview(contract)}>
                        <div className="text-sm text-gray-900 dark:text-white">
                          {contract.event_name || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {contract.event_date ? new Date(contract.event_date).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap cursor-pointer text-sm text-gray-900 dark:text-white" onClick={() => handlePreview(contract)}>
                        {contract.total_amount ? `$${contract.total_amount.toLocaleString()}` : 'N/A'}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => handlePreview(contract)}>
                        {getStatusBadge(contract.status)}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap cursor-pointer text-sm text-gray-500 dark:text-gray-400" onClick={() => handlePreview(contract)}>
                        {new Date(contract.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePreview(contract);
                            }}
                            className="h-8 w-8"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopySigningLink(contract);
                            }}
                            className="h-8 w-8"
                            title="Copy Signing Link"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          {contract.status === 'draft' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendContract(contract);
                              }}
                              className="h-8 w-8"
                              title="Send for Signature"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          )}
                          {(contract.vendor_signature_data || contract.signed_by_vendor) && !contract.client_signature_data && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnsign(contract);
                              }}
                              className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              title="Remove Your Signature"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {contracts.length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Total Contracts</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
              {contracts.filter(c => c.status === 'sent' || c.status === 'viewed').length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Awaiting Signature</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
              {contracts.filter(c => c.status === 'signed' || c.status === 'completed').length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Signed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl sm:text-3xl font-bold text-gray-600 dark:text-gray-400">
              {contracts.filter(c => c.status === 'draft').length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Drafts</div>
          </CardContent>
        </Card>
      </div>

      {/* Generate Contract Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Generate Contract</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select a contact to generate a contract for:
              </p>
              <Select value={selectedContact} onValueChange={setSelectedContact}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a contact..." />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.first_name} {contact.last_name} - {contact.event_type || 'Event'} 
                      {contact.event_date && ` (${new Date(contact.event_date).toLocaleDateString()})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowGenerateModal(false);
                    setSelectedContact('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleGenerateContract}
                  disabled={!selectedContact || generating}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 dark:bg-purple-600 dark:hover:bg-purple-700"
                >
                  {generating ? 'Generating...' : 'Generate'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}