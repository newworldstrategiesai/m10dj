/**
 * Service Selection Link Tester
 * Admin component to quickly generate and test service selection links
 */

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Link2, 
  ExternalLink, 
  Copy, 
  CheckCircle,
  Users,
  Mail,
  Calendar,
  AlertCircle
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/Toasts/use-toast';

export default function ServiceSelectionTester() {
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [recentLinks, setRecentLinks] = useState<any[]>([]);

  useEffect(() => {
    fetchContacts();
    fetchRecentLinks();
  }, []);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name, email_address, primary_email, event_type, event_date')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error && data) {
        setContacts(data);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('service_selection_tokens')
        .select('*, contacts(first_name, last_name, email_address, primary_email)')
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setRecentLinks(data);
      }
    } catch (error) {
      console.error('Error fetching recent links:', error);
    }
  };

  const handleGenerateLink = async () => {
    if (!selectedContact) {
      toast({
        title: "Select Contact",
        description: "Please select a contact first",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch('/api/service-selection/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: selectedContact })
      });

      const data = await response.json();

      if (response.ok) {
        setGeneratedLink(data.link);
        await fetchRecentLinks();
        
        toast({
          title: "Link Generated!",
          description: "Service selection link created successfully",
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate link",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSendLink = async () => {
    if (!selectedContact) return;

    try {
      const response = await fetch('/api/automation/send-service-selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: selectedContact })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Email Sent!",
          description: "Service selection email sent to contact",
        });
        setGeneratedLink(data.selection_link);
        await fetchRecentLinks();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Send Failed",
        description: error instanceof Error ? error.message : "Failed to send email",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-400 mt-4">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Demo Link */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 p-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">🧪 Quick Demo Link</h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              Test the service selection page without needing a real contact or token:
            </p>
            <div className="flex flex-wrap gap-3">
              <a 
                href="/select-services/demo" 
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-semibold transition"
              >
                <ExternalLink className="h-4 w-4" />
                Open Demo Page
              </a>
              <Button
                variant="slim"
                onClick={() => copyToClipboard(`${window.location.origin}/select-services/demo`)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Demo URL
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Generate Link for Real Contact */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Link2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          Generate Service Selection Link
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Contact
            </label>
            <select
              value={selectedContact}
              onChange={(e) => {
                setSelectedContact(e.target.value);
                setGeneratedLink('');
              }}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a contact...</option>
              {contacts.map(contact => (
                <option key={contact.id} value={contact.id}>
                  {contact.first_name} {contact.last_name} - {contact.email_address || contact.primary_email} 
                  {contact.event_type && ` (${contact.event_type})`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleGenerateLink}
              disabled={!selectedContact || generating}
              className="flex items-center gap-2"
            >
              <Link2 className="h-4 w-4" />
              {generating ? 'Generating...' : 'Generate Link Only'}
            </Button>

            <Button
              onClick={handleSendLink}
              disabled={!selectedContact || generating}
              variant="slim"
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Generate & Send Email
            </Button>
          </div>

          {generatedLink && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-green-900 dark:text-green-200 mb-2">Link Generated!</p>
                  <div className="bg-white dark:bg-gray-800 rounded p-3 mb-3">
                    <code className="text-sm text-gray-900 dark:text-gray-200 break-all">
                      {generatedLink}
                    </code>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="slim"
                      onClick={() => copyToClipboard(generatedLink)}
                      className="text-sm"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy Link
                    </Button>
                    <a
                      href={generatedLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded font-medium transition"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Open Link
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Links */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Service Selection Links</h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {recentLinks.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Link2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p>No links generated yet</p>
            </div>
          ) : (
            recentLinks.map(link => (
              <div key={link.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {link.contacts?.first_name} {link.contacts?.last_name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {link.contacts?.email_address || link.contacts?.primary_email}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Created: {formatDate(link.created_at)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Expires: {formatDate(link.expires_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge variant="outline" className={link.is_used ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'}>
                      {link.is_used ? 'Used' : 'Active'}
                    </Badge>
                    <div className="flex gap-1">
                      <Button
                        variant="slim"
                        onClick={() => copyToClipboard(`${window.location.origin}/select-services/${link.token}`)}
                        className="text-xs px-2 py-1"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <a
                        href={`/select-services/${link.token}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 px-2 py-1 rounded text-xs transition"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

