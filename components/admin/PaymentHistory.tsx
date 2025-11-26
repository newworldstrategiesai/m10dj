/**
 * Payment History Component
 * Displays all payments for a contact with financial summaries
 */

import React from 'react';
import { DollarSign, CreditCard, Calendar, CheckCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react';

interface Payment {
  id: string;
  payment_name: string;
  payment_status: string;
  payment_method: string;
  total_amount: number;
  net_amount: number;
  transaction_fee: number;
  gratuity?: number;
  tax_amount?: number;
  due_date?: string;
  transaction_date?: string;
  invoice_number?: string;
  receipt_url?: string;
  receipt_link?: string;
}

interface PaymentHistoryProps {
  contactId: string;
  payments: Payment[];
  projectValue?: number;
}

export default function PaymentHistory({ contactId, payments, projectValue }: PaymentHistoryProps) {
  if (!payments || payments.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <DollarSign className="h-5 w-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
        </div>
        <p className="text-gray-500 text-sm">No payments recorded yet.</p>
      </div>
    );
  }

  // Calculate totals
  const totalPaid = payments
    .filter(p => p.payment_status === 'Paid')
    .reduce((sum, p) => sum + (p.total_amount || 0), 0);
  
  const totalNet = payments
    .filter(p => p.payment_status === 'Paid')
    .reduce((sum, p) => sum + (p.net_amount || 0), 0);
  
  const totalFees = totalPaid - totalNet;
  const feePercentage = totalPaid > 0 ? (totalFees / totalPaid * 100).toFixed(2) : '0.00';
  
  const totalTips = payments.reduce((sum, p) => sum + (p.gratuity || 0), 0);
  
  const balanceDue = projectValue ? projectValue - totalPaid : 0;
  const paidCount = payments.filter(p => p.payment_status === 'Paid').length;
  const pendingCount = payments.filter(p => p.payment_status === 'Pending').length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'Overdue':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="h-6 w-6 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Total Paid</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
            <p className="text-xs text-gray-500 mt-1">{paidCount} payment{paidCount !== 1 ? 's' : ''}</p>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Net Received</p>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalNet)}</p>
            <p className="text-xs text-red-500 mt-1">-{formatCurrency(totalFees)} fees ({feePercentage}%)</p>
          </div>

          {projectValue && projectValue > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Balance Due</p>
              <p className={`text-2xl font-bold ${balanceDue > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                {formatCurrency(balanceDue)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                of {formatCurrency(projectValue)}
              </p>
            </div>
          )}

          {totalTips > 0 && (
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Tips/Gratuity</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalTips)}</p>
              <p className="text-xs text-gray-500 mt-1">Thank you! 🎉</p>
            </div>
          )}
        </div>
      </div>

      {/* Payments List */}
      <div className="p-6">
        <div className="space-y-3">
          {payments
            .sort((a, b) => {
              const dateA = a.transaction_date || a.due_date || '';
              const dateB = b.transaction_date || b.due_date || '';
              return dateB.localeCompare(dateA);
            })
            .map((payment) => (
              <div
                key={payment.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatusIcon(payment.payment_status)}
                      <span className="font-semibold text-gray-900">
                        {payment.payment_name || 'Payment'}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(payment.payment_status)}`}>
                        {payment.payment_status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">Amount:</span>
                        <p className="font-semibold text-gray-900">{formatCurrency(payment.total_amount)}</p>
                      </div>
                      
                      <div>
                        <span className="text-gray-500">Method:</span>
                        <p className="flex items-center gap-1 text-gray-900">
                          <CreditCard className="h-3 w-3" />
                          {payment.payment_method}
                        </p>
                      </div>
                      
                      {payment.transaction_date && (
                        <div>
                          <span className="text-gray-500">Paid:</span>
                          <p className="flex items-center gap-1 text-gray-900">
                            <Calendar className="h-3 w-3" />
                            {formatDate(payment.transaction_date)}
                          </p>
                        </div>
                      )}
                      
                      {payment.due_date && !payment.transaction_date && (
                        <div>
                          <span className="text-gray-500">Due:</span>
                          <p className="flex items-center gap-1 text-gray-900">
                            <Calendar className="h-3 w-3" />
                            {formatDate(payment.due_date)}
                          </p>
                        </div>
                      )}
                      
                      {payment.net_amount && payment.payment_status === 'Paid' && (
                        <div>
                          <span className="text-gray-500">Net:</span>
                          <p className="text-gray-900">
                            {formatCurrency(payment.net_amount)}
                            {payment.transaction_fee > 0 && (
                              <span className="text-xs text-red-500 block">
                                -{formatCurrency(payment.transaction_fee)} fee
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                    </div>

                    {payment.invoice_number && (
                      <p className="text-xs text-gray-400 mt-2">Invoice: {payment.invoice_number}</p>
                    )}
                    
                    {(payment.receipt_url || payment.receipt_link) && (
                      <div className="mt-2">
                        <a
                          href={payment.receipt_url || payment.receipt_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Receipt
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>

        {pendingCount > 0 && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <AlertCircle className="h-4 w-4 inline mr-1" />
              <strong>{pendingCount}</strong> pending payment{pendingCount !== 1 ? 's' : ''} • 
              Total: {formatCurrency(
                payments
                  .filter(p => p.payment_status === 'Pending')
                  .reduce((sum, p) => sum + p.total_amount, 0)
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

