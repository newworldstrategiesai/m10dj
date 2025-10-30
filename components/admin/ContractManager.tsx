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
  ExternalLink
} from 'lucide-react';

interface Contract {
  id: string;
  contract_number: string;
  contact_id: string;
  invoice_id: string;
  status: string;
  event_name: string;
  event_date: string;
  total_amount: number;
  contract_html: string;
  signing_token: string;
  sent_at: string | null;
  signed_at: string | null;
  created_at: string;
  contacts: {
    first_name: string;
    last_name: string;
    email_address: string;
  };
  invoices: {
    invoice_number: string;
  } | null;
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
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState('');
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchContracts();
    fetchContacts();
  }, []);

  useEffect(() => {
    filterContracts();
  }, [contracts, searchTerm, statusFilter]);

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

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.contract_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contacts?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contacts?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contacts?.email_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.event_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredContracts(filtered);
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
        description: `Contract sent to ${contract.contacts.email_address}`,
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

  const handlePreview = (contract: Contract) => {
    setSelectedContract(contract);
    setShowPreview(true);
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
      <div className="space-y-6">
        {/* Improved Header Section with Better Layout */}
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {selectedContract.contract_number}
                  </h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(selectedContract.status)}
                    {selectedContract.signed_at && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Signed: {new Date(selectedContract.signed_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Contract Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Client</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {selectedContract.contacts.first_name} {selectedContract.contacts.last_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {selectedContract.contacts.email_address}
                  </p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Event</p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
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
                </div>
                
                {selectedContract.total_amount && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Contract Value</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                      ${selectedContract.total_amount.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Buttons - Improved Layout */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-56">
              <button
                onClick={() => handleCopySigningLink(selectedContract)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium bg-white dark:bg-gray-800"
                title="Copy signing link"
              >
                <Copy className="w-4 h-4" />
                Copy Link
              </button>
              <button
                onClick={() => handleDownload(selectedContract)}
                disabled={downloading === selectedContract.id}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium shadow-sm"
                title="Download as PDF"
              >
                {downloading === selectedContract.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download PDF
                  </>
                )}
              </button>
              {selectedContract.status === 'draft' && (
                <button
                  onClick={() => handleSendContract(selectedContract)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium shadow-sm"
                  title="Send contract for signature"
                >
                  <Send className="w-4 h-4" />
                  Send for Signature
                </button>
              )}
              <button
                onClick={() => {
                  setShowPreview(false);
                  setSelectedContract(null);
                }}
                className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium bg-white dark:bg-gray-800"
                title="Close preview"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>

        {/* Improved Contract Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
          <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Contract Preview</h3>
              <span className="text-xs text-gray-500 dark:text-gray-400">Read-only preview</span>
            </div>
          </div>
          <div className="p-8 max-h-[70vh] overflow-y-auto">
            <div 
              className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-white prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-strong:text-gray-900 dark:prose-strong:text-white
                prose-ul:text-gray-700 dark:prose-ul:text-gray-300
                prose-li:text-gray-700 dark:prose-li:text-gray-300
                min-w-full"
              dangerouslySetInnerHTML={{ __html: selectedContract.contract_html }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Generate Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Contracts</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage and track client contracts
          </p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Generate Contract
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search contracts, clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="viewed">Viewed</option>
            <option value="signed">Signed</option>
            <option value="completed">Completed</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <button
          onClick={fetchContracts}
          className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Contracts Table */}
      {filteredContracts.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No contracts found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Generate your first contract to get started'}
          </p>
          <button
            onClick={() => setShowGenerateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Generate Contract
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contract
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredContracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {contract.contract_number}
                      </div>
                      {contract.invoices && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {contract.invoices.invoice_number}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {contract.contacts.first_name} {contract.contacts.last_name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {contract.contacts.email_address}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {contract.event_name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {contract.event_date ? new Date(contract.event_date).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      ${contract.total_amount?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(contract.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(contract.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handlePreview(contract)}
                          className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCopySigningLink(contract)}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                          title="Copy Signing Link"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        {contract.status === 'draft' && (
                          <button
                            onClick={() => handleSendContract(contract)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Send for Signature"
                          >
                            <Send className="w-4 h-4" />
                          </button>
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {contracts.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Contracts</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {contracts.filter(c => c.status === 'sent' || c.status === 'viewed').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Awaiting Signature</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {contracts.filter(c => c.status === 'signed' || c.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Signed</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
            {contracts.filter(c => c.status === 'draft').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Drafts</div>
        </div>
      </div>

      {/* Generate Contract Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Generate Contract
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Select a contact to generate a contract for:
            </p>
            <select
              value={selectedContact}
              onChange={(e) => setSelectedContact(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-6"
            >
              <option value="">Select a contact...</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.first_name} {contact.last_name} - {contact.event_type || 'Event'} 
                  {contact.event_date && `(${new Date(contact.event_date).toLocaleDateString()})`}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setShowGenerateModal(false);
                  setSelectedContact('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateContract}
                disabled={!selectedContact || generating}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {generating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}