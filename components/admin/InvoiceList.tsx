/**
 * Invoice List Component
 * Displays all invoices for a contact with status, amounts, and actions
 */

import React from 'react';
import { FileText, Calendar, DollarSign, AlertCircle, CheckCircle, Clock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_status: string;
  invoice_title?: string;
  invoice_date: string;
  due_date: string;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  project_id?: string;
  project_name?: string;
  payment_count?: number;
  days_overdue?: number;
  last_payment_date?: string;
}

interface InvoiceListProps {
  contactId: string;
  invoices: Invoice[];
  onViewInvoice?: (invoiceId: string) => void;
  onCreateInvoice?: () => void;
}

export default function InvoiceList({ 
  contactId, 
  invoices, 
  onViewInvoice,
  onCreateInvoice 
}: InvoiceListProps) {
  
  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'partial':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'sent':
      case 'viewed':
        return <Eye className="h-4 w-4 text-blue-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'sent':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'viewed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateTotalBalance = () => {
    return invoices.reduce((sum, inv) => sum + (inv.balance_due || 0), 0);
  };

  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);
  const totalBalance = calculateTotalBalance();
  const paidCount = invoices.filter(inv => inv.invoice_status.toLowerCase() === 'paid').length;
  const overdueCount = invoices.filter(inv => inv.invoice_status.toLowerCase() === 'overdue').length;

  if (!invoices || invoices.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900">Invoices</h3>
          </div>
          {onCreateInvoice && (
            <Button onClick={onCreateInvoice} className="text-sm">
              + Create Invoice
            </Button>
          )}
        </div>
        <p className="text-gray-500 text-sm">No invoices for this contact yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">Invoices</h3>
          </div>
          {onCreateInvoice && (
            <Button onClick={onCreateInvoice} className="text-sm">
              + Create Invoice
            </Button>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Total Invoiced</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalInvoiced)}</p>
            <p className="text-xs text-gray-500 mt-1">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</p>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Total Paid</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
            <p className="text-xs text-gray-500 mt-1">{paidCount} paid</p>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Balance Due</p>
            <p className={`text-2xl font-bold ${totalBalance > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
              {formatCurrency(totalBalance)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {totalBalance > 0 ? 'Outstanding' : 'Paid in full'}
            </p>
          </div>

          {overdueCount > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm border-l-4 border-red-500">
              <p className="text-xs text-gray-500 mb-1">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
              <p className="text-xs text-red-500 mt-1">⚠️ Needs attention</p>
            </div>
          )}
        </div>
      </div>

      {/* Invoices List */}
      <div className="p-6">
        <div className="space-y-3">
          {invoices
            .sort((a, b) => new Date(b.invoice_date).getTime() - new Date(a.invoice_date).getTime())
            .map((invoice) => (
              <div
                key={invoice.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => onViewInvoice && onViewInvoice(invoice.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {getStatusIcon(invoice.invoice_status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{invoice.invoice_number}</span>
                          <span className={`text-xs px-2.5 py-1 rounded-full border ${getStatusColor(invoice.invoice_status)}`}>
                            {invoice.invoice_status}
                          </span>
                          {invoice.days_overdue && invoice.days_overdue > 0 && (
                            <span className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded">
                              {invoice.days_overdue} days overdue
                            </span>
                          )}
                        </div>
                        {invoice.invoice_title && (
                          <p className="text-sm text-gray-600 mt-1">{invoice.invoice_title}</p>
                        )}
                        {invoice.project_name && (
                          <p className="text-xs text-indigo-600 mt-1">
                            📋 {invoice.project_name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500 block mb-1">Invoice Date:</span>
                        <p className="flex items-center gap-1 text-gray-900">
                          <Calendar className="h-3 w-3" />
                          {formatDate(invoice.invoice_date)}
                        </p>
                      </div>

                      <div>
                        <span className="text-gray-500 block mb-1">Due Date:</span>
                        <p className="flex items-center gap-1 text-gray-900">
                          <Calendar className="h-3 w-3" />
                          {formatDate(invoice.due_date)}
                        </p>
                      </div>

                      <div>
                        <span className="text-gray-500 block mb-1">Total:</span>
                        <p className="font-bold text-gray-900">{formatCurrency(invoice.total_amount)}</p>
                      </div>

                      <div>
                        <span className="text-gray-500 block mb-1">Balance:</span>
                        <p className={`font-bold ${invoice.balance_due > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                          {formatCurrency(invoice.balance_due)}
                        </p>
                      </div>
                    </div>

                    {invoice.amount_paid > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">
                            Paid: {formatCurrency(invoice.amount_paid)} 
                            {invoice.payment_count && invoice.payment_count > 0 && (
                              <span className="text-xs text-gray-500 ml-2">
                                ({invoice.payment_count} payment{invoice.payment_count !== 1 ? 's' : ''})
                              </span>
                            )}
                          </span>
                          {invoice.last_payment_date && (
                            <span className="text-xs text-gray-500">
                              Last payment: {formatDate(invoice.last_payment_date)}
                            </span>
                          )}
                        </div>
                        {/* Payment progress bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className={`h-2 rounded-full ${
                              invoice.amount_paid >= invoice.total_amount
                                ? 'bg-green-500'
                                : 'bg-blue-500'
                            }`}
                            style={{
                              width: `${Math.min(
                                (invoice.amount_paid / invoice.total_amount) * 100,
                                100
                              )}%`
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

