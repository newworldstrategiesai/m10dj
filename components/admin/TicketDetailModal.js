import { XCircle, CheckCircle, Calendar, Clock, Ticket, Mail, Phone, DollarSign, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import RefundModal from './RefundModal';

export default function TicketDetailModal({ ticket, onClose, onRefund }) {
  const [showRefundModal, setShowRefundModal] = useState(false);
  if (!ticket) return null;

  const qrCodeUrl = `/api/events/tickets/qr/${ticket.qr_code_short || ticket.qr_code}`;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Ticket Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Purchaser Info */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Purchaser Information</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400 w-24">Name:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{ticket.purchaser_name}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900 dark:text-white">{ticket.purchaser_email}</span>
                </div>
                {ticket.purchaser_phone && (
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900 dark:text-white">{ticket.purchaser_phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Ticket Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Ticket className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Quantity</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{ticket.quantity}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Total Amount</span>
                </div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">${ticket.total_amount.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Ticket Type</span>
                <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
                  {ticket.ticket_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                  ${ticket.price_per_ticket.toFixed(2)} per ticket
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Payment</span>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded text-sm font-semibold ${
                    ticket.payment_status === 'paid' 
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                      : ticket.payment_status === 'cash' || ticket.payment_status === 'card_at_door'
                      ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200'
                      : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200'
                  }`}>
                    {ticket.payment_method || ticket.payment_status}
                  </span>
                </div>
              </div>
            </div>

            {/* Check-In Status */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Check-In Status</span>
                  <div className="mt-2">
                    {ticket.checked_in ? (
                      <span className="inline-flex items-center text-green-600 dark:text-green-400">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        <span className="font-semibold">Checked In</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-gray-400">
                        <XCircle className="w-5 h-5 mr-2" />
                        <span className="font-semibold">Not Checked In</span>
                      </span>
                    )}
                  </div>
                  {ticket.checked_in_at && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(ticket.checked_in_at).toLocaleString()}
                    </p>
                  )}
                  {ticket.checked_in_by && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      by {ticket.checked_in_by}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-center">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3 block">QR Code</span>
              <div className="bg-white p-4 rounded-lg inline-block border-2 border-brand-gold mb-3">
                <Image
                  src={qrCodeUrl}
                  alt="Ticket QR Code"
                  width={200}
                  height={200}
                  className="mx-auto"
                />
              </div>
              <p className="text-xs font-mono text-gray-600 dark:text-gray-300">
                {ticket.qr_code_short || ticket.qr_code}
              </p>
            </div>

            {/* Timestamps */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Created</span>
                <p className="text-gray-900 dark:text-white mt-1 flex items-center">
                  <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                  {new Date(ticket.created_at).toLocaleString()}
                </p>
              </div>
              {ticket.updated_at && (
                <div>
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Last Updated</span>
                  <p className="text-gray-900 dark:text-white mt-1 flex items-center">
                    <Clock className="w-4 h-4 mr-1 text-gray-400" />
                    {new Date(ticket.updated_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              {ticket.payment_status !== 'refunded' && ['paid', 'cash', 'card_at_door'].includes(ticket.payment_status) && (
                <button
                  onClick={() => setShowRefundModal(true)}
                  className="btn-outline flex-1 flex items-center justify-center border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refund
                </button>
              )}
              <Link
                href={`/events/tickets/${ticket.id}`}
                target="_blank"
                className="btn-primary flex-1 text-center"
              >
                View Full Ticket
              </Link>
              <button
                onClick={onClose}
                className="btn-outline flex-1"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <RefundModal
          ticket={ticket}
          onClose={() => setShowRefundModal(false)}
          onSuccess={(data) => {
            if (onRefund) {
              onRefund(data);
            }
            setShowRefundModal(false);
            onClose();
          }}
        />
      )}
    </div>
  );
}


