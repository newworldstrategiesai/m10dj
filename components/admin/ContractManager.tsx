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
  event_name: string;
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
        .select('id, first_name, last_name, email_address, event_name, event_date')
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
        throw new Error(data.error || 'Failed to generate contract');
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
    // Create a blob from the contract content and download it
    const blob = new Blob([contract.contract_html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contract.contract_number}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Contract Downloaded',
      description: 'Contract has been downloaded successfully',
    });
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
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {selectedContract.contract_number}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {selectedContract.contacts.first_name} {selectedContract.contacts.last_name} - {selectedContract.event_name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopySigningLink(selectedContract)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copy Link
            </button>
            <button
              onClick={() => handleDownload(selectedContract)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            {selectedContract.status === 'draft' && (
              <button
                onClick={() => handleSendContract(selectedContract)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
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
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          <div 
            className="prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: selectedContract.contract_html }}
          />
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
                  {contact.first_name} {contact.last_name} - {contact.event_name || 'Event'} 
                  {contact.event_date && ` (${new Date(contact.event_date).toLocaleDateString()})`}
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

