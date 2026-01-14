'use client';

import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  X, 
  Mail, 
  Send, 
  CheckCircle, 
  Clock, 
  User,
  Copy,
  Trash2
} from 'lucide-react';

interface Participant {
  id: string;
  contract_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string | null;
  title: string | null;
  signing_token: string | null;
  signing_token_expires_at: string | null;
  signed_at: string | null;
  signed_by: string | null;
  signature_data: string | null;
  status: 'pending' | 'sent' | 'viewed' | 'signed' | 'declined';
  display_order: number;
  notes: string | null;
  created_at: string;
}

interface ContractParticipantsManagerProps {
  contractId: string;
  contractNumber: string;
}

export default function ContractParticipantsManager({
  contractId,
  contractNumber
}: ContractParticipantsManagerProps) {
  const supabase = createClientComponentClient();
  const { toast } = useToast();
  
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Additional Signer',
    title: '',
    notes: '',
  });

  useEffect(() => {
    fetchParticipants();
  }, [contractId]);

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contract_participants')
        .select('*')
        .eq('contract_id', contractId)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      setParticipants(data || []);
    } catch (error: any) {
      console.error('Error fetching participants:', error);
      toast({
        title: 'Error',
        description: 'Failed to load participants',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddParticipant = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Name is required',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // Get current max display_order
      const maxOrder = participants.length > 0 
        ? Math.max(...participants.map(p => p.display_order || 0))
        : 0;

      const { data, error } = await supabase
        .from('contract_participants')
        .insert({
          contract_id: contractId,
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          role: formData.role || null,
          title: formData.title.trim() || null,
          notes: formData.notes.trim() || null,
          display_order: maxOrder + 1,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Participant Added',
        description: `${formData.name} has been added to the contract`,
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'Additional Signer',
        title: '',
        notes: '',
      });
      setShowAddDialog(false);
      fetchParticipants();
    } catch (error: any) {
      console.error('Error adding participant:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add participant',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteParticipant = async (participantId: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from this contract?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('contract_participants')
        .delete()
        .eq('id', participantId);

      if (error) throw error;

      toast({
        title: 'Participant Removed',
        description: `${name} has been removed from the contract`,
      });

      fetchParticipants();
    } catch (error: any) {
      console.error('Error deleting participant:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove participant',
        variant: 'destructive',
      });
    }
  };

  const handleSendInvite = async (participant: Participant) => {
    if (!participant.email) {
      toast({
        title: 'Error',
        description: 'Email is required to send signing invitation',
        variant: 'destructive',
      });
      return;
    }

    setSending(participant.id);
    try {
      // Generate signing token
      const signingToken = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

      // Update participant with token
      const { error: updateError } = await supabase
        .from('contract_participants')
        .update({
          signing_token: signingToken,
          signing_token_expires_at: expiresAt.toISOString(),
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', participant.id);

      if (updateError) throw updateError;

      // Send email via API
      const res = await fetch('/api/contracts/send-participant-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantId: participant.id,
          contractId: contractId,
          contractNumber: contractNumber,
          participantName: participant.name,
          participantEmail: participant.email,
          signingToken: signingToken,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send invitation');
      }

      toast({
        title: 'Invitation Sent',
        description: `Signing link sent to ${participant.email}`,
      });

      fetchParticipants();
    } catch (error: any) {
      console.error('Error sending invite:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setSending(null);
    }
  };

  const handleCopySigningLink = (participant: Participant) => {
    if (!participant.signing_token) {
      toast({
        title: 'Error',
        description: 'No signing token available. Please send invitation first.',
        variant: 'destructive',
      });
      return;
    }

    const signingUrl = `${window.location.origin}/sign-contract/${participant.signing_token}`;
    navigator.clipboard.writeText(signingUrl);
    toast({
      title: 'Link Copied',
      description: 'Signing link copied to clipboard',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      viewed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      signed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      declined: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };

    const icons = {
      pending: Clock,
      sent: Send,
      viewed: Mail,
      signed: CheckCircle,
      declined: X,
    };

    const Icon = icons[status as keyof typeof icons] || Clock;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles] || styles.pending}`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Additional Participants</CardTitle>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Participant
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Participant</DialogTitle>
                <DialogDescription>
                  Add an additional signer to this contract
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Phone</label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Role</label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Additional Signer">Additional Signer</SelectItem>
                      <SelectItem value="Witness">Witness</SelectItem>
                      <SelectItem value="Co-signer">Co-signer</SelectItem>
                      <SelectItem value="Third Party">Third Party</SelectItem>
                      <SelectItem value="Authorized Representative">Authorized Representative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Title (Optional)</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Best Man, Coordinator"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Notes (Optional)</label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Internal notes"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowAddDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddParticipant}
                    disabled={saving || !formData.name.trim()}
                    className="flex-1"
                  >
                    {saving ? 'Adding...' : 'Add Participant'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {participants.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No additional participants</p>
            <p className="text-sm mt-1">Add participants to require additional signatures</p>
          </div>
        ) : (
          <div className="space-y-3">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        {participant.name}
                      </h4>
                      {getStatusBadge(participant.status)}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      {participant.role && (
                        <p><span className="font-medium">Role:</span> {participant.role}</p>
                      )}
                      {participant.title && (
                        <p><span className="font-medium">Title:</span> {participant.title}</p>
                      )}
                      {participant.email && (
                        <p className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {participant.email}
                        </p>
                      )}
                      {participant.signed_at && (
                        <p className="text-green-600 dark:text-green-400">
                          Signed: {new Date(participant.signed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteParticipant(participant.id, participant.name)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Remove participant"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  {participant.email && participant.status !== 'signed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleSendInvite(participant)}
                      disabled={sending === participant.id}
                      className="flex-1"
                    >
                      {sending === participant.id ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3 mr-2" />
                          Send Invite
                        </>
                      )}
                    </Button>
                  )}
                  {participant.signing_token && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopySigningLink(participant)}
                      className="flex-1"
                    >
                      <Copy className="w-3 h-3 mr-2" />
                      Copy Link
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
