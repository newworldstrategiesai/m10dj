'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Circle, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  FileText, 
  CreditCard, 
  Mail, 
  Phone, 
  Calendar,
  DollarSign,
  Send,
  MessageSquare,
  CheckSquare,
  XCircle,
  TrendingUp,
  TrendingDown,
  Zap,
  UserCheck,
  FileCheck,
  Receipt
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toasts/use-toast';

interface Contact {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  email_address?: string | null;
  phone?: string | null;
  lead_status?: string | null;
  lead_stage?: string | null;
  lead_temperature?: string | null;
  event_type?: string | null;
  event_date?: string | null;
  quoted_price?: number | null;
  deposit_paid?: boolean | null;
  payment_status?: string | null;
  contract_signed_date?: string | null;
  proposal_sent_date?: string | null;
  last_contacted_date?: string | null;
  next_follow_up_date?: string | null;
  created_at?: string;
  [key: string]: any; // Allow additional properties
}

interface PipelineViewProps {
  contact: Contact;
  contracts?: any[];
  invoices?: any[];
  payments?: any[];
  quoteSelections?: any[];
  onStatusUpdate?: (newStatus: string) => void;
}

const PIPELINE_STAGES = [
  { id: 'New', label: 'New Lead', icon: Circle, color: 'bg-gray-500' },
  { id: 'Contacted', label: 'Contacted', icon: MessageSquare, color: 'bg-blue-500' },
  { id: 'Qualified', label: 'Qualified', icon: UserCheck, color: 'bg-purple-500' },
  { id: 'Proposal Sent', label: 'Proposal Sent', icon: Send, color: 'bg-yellow-500' },
  { id: 'Negotiating', label: 'Negotiating', icon: TrendingUp, color: 'bg-orange-500' },
  { id: 'Booked', label: 'Booked', icon: CheckCircle, color: 'bg-green-500' },
  { id: 'Completed', label: 'Completed', icon: CheckSquare, color: 'bg-emerald-600' },
  { id: 'Lost', label: 'Lost', icon: XCircle, color: 'bg-red-500' }
];

const getStageIndex = (status: string | null): number => {
  if (!status) return 0;
  const index = PIPELINE_STAGES.findIndex(s => s.id === status);
  return index >= 0 ? index : 0;
};

const getNextActions = (contact: Contact, contracts: any[] = [], invoices: any[] = [], payments: any[] = [], quoteSelections: any[] = []): string[] => {
  const actions: string[] = [];
  const currentStage = contact.lead_status || 'New';
  const hasContract = contracts && contracts.length > 0;
  const hasInvoice = invoices && invoices.length > 0;
  const hasPayment = payments && payments.length > 0;
  const hasQuote = quoteSelections && quoteSelections.length > 0;
  const signedContract = contracts?.some(c => c.status === 'signed' || c.signed_at);
  const paidInvoice = invoices?.some(i => i.status === 'paid' || payments?.some(p => p.payment_status === 'Paid'));

  switch (currentStage) {
    case 'New':
      actions.push('Send initial response email or call');
      actions.push('Schedule consultation call');
      actions.push('Gather event details');
      break;
    case 'Contacted':
      actions.push('Qualify the lead (budget, date, needs)');
      actions.push('Send detailed information packet');
      actions.push('Schedule follow-up call');
      break;
    case 'Qualified':
      if (!hasQuote) {
        actions.push('Create and send personalized quote');
      } else {
        actions.push('Follow up on quote (waiting for response)');
      }
      actions.push('Answer any questions');
      break;
    case 'Proposal Sent':
      if (!hasQuote) {
        actions.push('Create quote selection page');
      }
      actions.push('Follow up on proposal');
      actions.push('Address any concerns or questions');
      break;
    case 'Negotiating':
      actions.push('Discuss pricing and terms');
      actions.push('Address objections');
      if (!hasContract) {
        actions.push('Prepare contract for signature');
      }
      break;
    case 'Booked':
      if (!hasContract) {
        actions.push('Send contract for signature');
      } else if (!signedContract) {
        actions.push('Follow up on unsigned contract');
      } else if (!hasInvoice) {
        actions.push('Generate invoice for deposit');
      } else if (!paidInvoice) {
        actions.push('Follow up on payment');
      } else {
        actions.push('Confirm event details');
        actions.push('Send event preparation checklist');
      }
      break;
    case 'Completed':
      actions.push('Request feedback/review');
      actions.push('Send thank you message');
      actions.push('Ask for referrals');
      break;
    case 'Lost':
      actions.push('Send follow-up to understand why');
      actions.push('Keep in database for future events');
      break;
  }

  // Add specific action items based on data
  if (currentStage === 'Booked' && signedContract && !paidInvoice) {
    actions.unshift('⚠️ Payment overdue - follow up immediately');
  }
  if (hasQuote && !hasContract && currentStage !== 'New' && currentStage !== 'Contacted') {
    actions.unshift('Send contract to secure booking');
  }
  if (contact.next_follow_up_date) {
    const followUpDate = new Date(contact.next_follow_up_date);
    const today = new Date();
    if (!isNaN(followUpDate.getTime()) && followUpDate <= today) {
      actions.unshift('⚠️ Follow-up date passed - contact now');
    }
  }

  return actions;
};

const getProgressPercentage = (contact: Contact, contracts: any[] = [], invoices: any[] = [], payments: any[] = []): number => {
  const currentStage = contact.lead_status || 'New';
  const stageIndex = getStageIndex(currentStage);
  
  // If lost, return 0
  if (currentStage === 'Lost') return 0;
  
  // Base progress on stage
  let progress = (stageIndex / (PIPELINE_STAGES.length - 2)) * 100; // Exclude Lost from calculation
  
  // Add bonus for key milestones
  if (contracts && contracts.length > 0) progress += 5;
  if (contracts?.some(c => c.status === 'signed')) progress += 10;
  if (invoices && invoices.length > 0) progress += 5;
  if (payments && payments.length > 0) progress += 10;
  if (payments?.some(p => p.payment_status === 'Paid')) progress += 10;
  
  return Math.min(100, Math.round(progress));
};

export default function PipelineView({ 
  contact, 
  contracts = [], 
  invoices = [], 
  payments = [], 
  quoteSelections = [],
  onStatusUpdate 
}: PipelineViewProps) {
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);
  
  const currentStage = contact.lead_status || 'New';
  const currentStageIndex = getStageIndex(currentStage);
  const progress = getProgressPercentage(contact, contracts, invoices, payments);
  const nextActions = getNextActions(contact, contracts, invoices, payments, quoteSelections);
  const hasContract = contracts && contracts.length > 0;
  const signedContract = contracts?.some(c => c.status === 'signed' || c.signed_at);
  const hasInvoice = invoices && invoices.length > 0;
  const hasPayment = payments && payments.length > 0;
  const paidPayment = payments?.some(p => p.payment_status === 'Paid');
  const hasQuote = quoteSelections && quoteSelections.length > 0;
  const quoteId = quoteSelections?.[0]?.id || contact.id;

  const handleStatusChange = async (newStatus: string) => {
    if (updating) return;
    
    setUpdating(true);
    try {
      const response = await fetch(`/api/contacts/${contact.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_status: newStatus })
      });

      if (response.ok) {
        toast({
          title: "Status Updated",
          description: `Contact status changed to ${newStatus}`,
        });
        if (onStatusUpdate) {
          onStatusUpdate(newStatus);
        }
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update contact status",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Pipeline Progress Bar */}
      <Card className="p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Pipeline Progress</h3>
            <Badge variant={contact.lead_temperature === 'Hot' ? 'destructive' : contact.lead_temperature === 'Warm' ? 'default' : 'secondary'}>
              {contact.lead_temperature || 'Unknown'} Lead
            </Badge>
          </div>
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 mb-2">
            <div
              className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">{progress}% complete</p>
        </div>

        {/* Pipeline Stages */}
        <div className="relative">
          <div className="flex items-center justify-between overflow-x-auto pb-4">
            {PIPELINE_STAGES.map((stage, index) => {
              const StageIcon = stage.icon;
              const isActive = index === currentStageIndex;
              const isCompleted = index < currentStageIndex;
              const isLost = currentStage === 'Lost' && stage.id === 'Lost';
              
              return (
                <div key={stage.id} className="flex flex-col items-center min-w-[100px] relative">
                  {/* Connector Line */}
                  {index < PIPELINE_STAGES.length - 1 && (
                    <div 
                      className={`absolute top-5 left-[60px] right-[-60px] h-0.5 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                  
                  {/* Stage Icon */}
                  <div className={`
                    relative z-10 w-10 h-10 rounded-full flex items-center justify-center
                    ${isActive ? `${stage.color} text-white` : ''}
                    ${isCompleted ? 'bg-green-500 text-white' : ''}
                    ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-400' : ''}
                    ${isLost ? 'bg-red-500 text-white' : ''}
                  `}>
                    <StageIcon className="w-5 h-5" />
                  </div>
                  
                  {/* Stage Label */}
                  <div className="mt-2 text-center">
                    <p className={`text-xs font-medium ${
                      isActive ? 'text-gray-900' : isCompleted ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {stage.label}
                    </p>
                    {isActive && (
                      <Badge className="mt-1 text-xs" variant="outline">
                        Current
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Current Status & Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Stage</p>
              <p className="text-lg font-semibold">{currentStage}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Contract</p>
              <p className="text-lg font-semibold">
                {signedContract ? 'Signed' : hasContract ? 'Pending' : 'None'}
              </p>
            </div>
            {signedContract ? (
              <FileCheck className="w-8 h-8 text-green-500" />
            ) : (
              <FileText className="w-8 h-8 text-gray-400" />
            )}
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Payment</p>
              <p className="text-lg font-semibold">
                {paidPayment ? 'Paid' : hasPayment ? 'Partial' : 'Pending'}
              </p>
            </div>
            {paidPayment ? (
              <Receipt className="w-8 h-8 text-green-500" />
            ) : (
              <CreditCard className="w-8 h-8 text-gray-400" />
            )}
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Quote Value</p>
              <p className="text-lg font-semibold">
                {contact.quoted_price ? `$${contact.quoted_price.toLocaleString()}` : 'N/A'}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-500" />
          </div>
        </Card>
      </div>

      {/* Next Actions */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-yellow-500" />
          <h3 className="text-lg font-semibold">Next Actions</h3>
        </div>
        <ul className="space-y-3">
          {nextActions.map((action, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className={`mt-1 w-2 h-2 rounded-full ${
                action.startsWith('⚠️') ? 'bg-red-500' : 'bg-blue-500'
              }`} />
              <span className={`flex-1 ${action.startsWith('⚠️') ? 'text-red-700 font-medium' : 'text-gray-700'}`}>
                {action}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {!hasQuote && (
            <Link href={`/quote/${quoteId}`} target="_blank">
              <Button variant="outline" className="w-full">
                <FileText className="w-4 h-4 mr-2" />
                View Quote
              </Button>
            </Link>
          )}
          
          {hasContract && (
            <Link href={`/quote/${quoteId}/contract`} target="_blank">
              <Button variant="outline" className="w-full">
                <FileCheck className="w-4 h-4 mr-2" />
                View Contract
              </Button>
            </Link>
          )}
          
          {hasInvoice && (
            <Link href={`/quote/${quoteId}/invoice`} target="_blank">
              <Button variant="outline" className="w-full">
                <CreditCard className="w-4 h-4 mr-2" />
                View Invoice
              </Button>
            </Link>
          )}
          
          {contact.email_address && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.open(`mailto:${contact.email_address}`, '_blank')}
            >
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
          )}
          
          {contact.phone && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.open(`tel:${contact.phone}`, '_blank')}
            >
              <Phone className="w-4 h-4 mr-2" />
              Call
            </Button>
          )}
        </div>
      </Card>

      {/* Move to Next Stage */}
      {currentStage !== 'Completed' && currentStage !== 'Lost' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Move to Next Stage</h3>
          <div className="flex flex-wrap gap-2">
            {PIPELINE_STAGES.map((stage, index) => {
              if (index <= currentStageIndex || stage.id === 'Lost') return null;
              
              return (
                <Button
                  key={stage.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange(stage.id)}
                  disabled={updating}
                >
                  Move to {stage.label}
                </Button>
              );
            })}
          </div>
        </Card>
      )}

      {/* Timeline */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Timeline</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Circle className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium">Contact Created</p>
              <p className="text-sm text-gray-600">
                {contact.created_at ? new Date(contact.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'N/A'}
              </p>
            </div>
          </div>
          
          {contact.last_contacted_date && (
            <div className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="font-medium">Last Contacted</p>
                <p className="text-sm text-gray-600">
                  {new Date(contact.last_contacted_date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          )}
          
          {contact.proposal_sent_date && (
            <div className="flex items-start gap-3">
              <Send className="w-5 h-5 text-yellow-400 mt-0.5" />
              <div>
                <p className="font-medium">Proposal Sent</p>
                <p className="text-sm text-gray-600">
                  {new Date(contact.proposal_sent_date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          )}
          
          {contact.contract_signed_date && (
            <div className="flex items-start gap-3">
              <FileCheck className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <p className="font-medium">Contract Signed</p>
                <p className="text-sm text-gray-600">
                  {new Date(contact.contract_signed_date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          )}
          
          {hasPayment && payments[0]?.transaction_date && (
            <div className="flex items-start gap-3">
              <Receipt className="w-5 h-5 text-green-400 mt-0.5" />
              <div>
                <p className="font-medium">Payment Received</p>
                <p className="text-sm text-gray-600">
                  {new Date(payments[0].transaction_date || payments[0].created_at || '').toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          )}
          
          {contact.event_date && (
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-purple-400 mt-0.5" />
              <div>
                <p className="font-medium">Event Date</p>
                <p className="text-sm text-gray-600">
                  {new Date(contact.event_date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

