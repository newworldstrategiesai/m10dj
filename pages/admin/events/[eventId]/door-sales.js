import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { 
  Ticket, 
  DollarSign,
  CheckCircle,
  AlertCircle,
  Users
} from 'lucide-react';
import Header from '../../../../components/company/Header';
import { createClient } from '@supabase/supabase-js';
import { generateShortQRCode } from '../../../../utils/event-tickets';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default function DoorSales() {
  const router = useRouter();
  const { eventId } = useRouter().query;
  const [formData, setFormData] = useState({
    purchaserName: '',
    purchaserEmail: '',
    purchaserPhone: '',
    quantity: 1,
    ticketType: 'general_admission',
    paymentMethod: 'cash',
    price: 12.00
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdTicket, setCreatedTicket] = useState(null);
  const [error, setError] = useState(null);

  const ticketTypes = {
    general_admission: {
      name: 'General Admission',
      price: 12.00
    },
    early_bird: {
      name: 'Early Bird',
      price: 10.00
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const qrCode = `TKT-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      const qrCodeShort = generateShortQRCode();
      const totalAmount = formData.price * formData.quantity;

      const { data, error: insertError } = await supabase
        .from('event_tickets')
        .insert({
          event_id: eventId,
          ticket_type: formData.ticketType,
          purchaser_name: formData.purchaserName,
          purchaser_email: formData.purchaserEmail || 'door-sale@m10djcompany.com',
          purchaser_phone: formData.purchaserPhone,
          quantity: formData.quantity,
          price_per_ticket: formData.price,
          total_amount: totalAmount,
          payment_status: formData.paymentMethod === 'cash' ? 'cash' : 'card_at_door',
          payment_method: formData.paymentMethod,
          qr_code: qrCode,
          qr_code_short: qrCodeShort
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      setCreatedTicket(data);
      setSuccess(true);
      
      // Reset form
      setTimeout(() => {
        setFormData({
          purchaserName: '',
          purchaserEmail: '',
          purchaserPhone: '',
          quantity: 1,
          ticketType: 'general_admission',
          paymentMethod: 'cash',
          price: 12.00
        });
        setSuccess(false);
        setCreatedTicket(null);
      }, 5000);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formData.ticketType) {
      const ticketType = ticketTypes[formData.ticketType];
      if (ticketType) {
        setFormData(prev => ({ ...prev, price: ticketType.price }));
      }
    }
  }, [formData.ticketType]);

  if (!eventId) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <p>Loading...</p>
        </main>
      </>
    );
  }

  const totalPrice = formData.price * formData.quantity;

  return (
    <>
      <Head>
        <title>Door Sales | {eventId}</title>
      </Head>

      <Header />

      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16">
        <div className="section-container">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Door Sales
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Create tickets for in-person purchases
              </p>
            </div>

            {success && createdTicket && (
              <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 rounded-lg p-6 mb-6">
                <div className="flex items-start">
                  <CheckCircle className="w-6 h-6 text-green-500 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-bold text-green-800 dark:text-green-200 mb-2">
                      Ticket Created Successfully!
                    </h3>
                    <div className="space-y-1 text-sm text-green-700 dark:text-green-300">
                      <div><strong>QR Code:</strong> {createdTicket.qr_code_short || createdTicket.qr_code}</div>
                      <div><strong>Total:</strong> ${createdTicket.total_amount.toFixed(2)}</div>
                      <div><strong>Payment:</strong> {createdTicket.payment_method}</div>
                    </div>
                    <a
                      href={`/events/tickets/${createdTicket.id}`}
                      target="_blank"
                      className="text-green-600 dark:text-green-400 hover:underline text-sm mt-2 inline-block"
                    >
                      View Ticket →
                    </a>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                  <p className="text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="modern-card space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Ticket Type
                </label>
                <select
                  value={formData.ticketType}
                  onChange={(e) => setFormData({ ...formData, ticketType: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {Object.entries(ticketTypes).map(([key, type]) => (
                    <option key={key} value={key}>
                      {type.name} - ${type.price.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Customer Name *
                </label>
                <input
                  type="text"
                  value={formData.purchaserName}
                  onChange={(e) => setFormData({ ...formData, purchaserName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={formData.purchaserEmail}
                  onChange={(e) => setFormData({ ...formData, purchaserEmail: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={formData.purchaserPhone}
                  onChange={(e) => setFormData({ ...formData, purchaserPhone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="(901) 555-1234"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Payment Method
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="cash">Cash</option>
                  <option value="card_at_door">Card at Door</option>
                </select>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total:</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    ${totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary text-lg py-4 flex items-center justify-center"
              >
                {loading ? (
                  'Creating Ticket...'
                ) : (
                  <>
                    <Ticket className="w-5 h-5 mr-2" />
                    Create Ticket
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}

