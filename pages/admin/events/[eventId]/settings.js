import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Settings, 
  Save,
  Ticket,
  DollarSign,
  Users,
  Calendar,
  ChevronRight,
  Plus,
  Trash2,
  AlertCircle
} from 'lucide-react';
import Header from '../../../../components/company/Header';
import { createClient } from '@supabase/supabase-js';
import { getEventInfo } from '../../../../utils/event-info';

// Default ticket configuration - in the future this would come from database
const getDefaultTicketConfig = (eventId) => {
  return {
    ticketTypes: {
      general_admission: {
        name: 'General Admission',
        price: 10.00,
        description: 'General admission ticket',
        available: true,
        maxQuantity: 10
      },
      early_bird: {
        name: 'Early Bird',
        price: 8.00,
        description: 'Early bird pricing',
        available: true,
        maxQuantity: 4
      }
    },
    capacity: 200
  };
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default function EventTicketSettings() {
  const router = useRouter();
  const { eventId } = router.query;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [eventInfo, setEventInfo] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [capacity, setCapacity] = useState(200);
  const [ticketSalesEnabled, setTicketSalesEnabled] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (eventId) {
      loadSettings();
    }
  }, [eventId]);

  const loadSettings = async () => {
    try {
      const info = getEventInfo(eventId);
      setEventInfo(info);

      // Load current ticket configuration
      const config = getDefaultTicketConfig(eventId);
      setTicketTypes(Object.entries(config.ticketTypes).map(([key, value]) => ({
        id: key,
        ...value
      })));
      setCapacity(config.capacity || 200);

      // In the future, we could load this from a database table
      // For now, we use the default config from utils
    } catch (error) {
      console.error('Error loading settings:', error);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Validate ticket types
      for (const type of ticketTypes) {
        if (!type.name || !type.price || type.price <= 0) {
          throw new Error('All ticket types must have a name and valid price');
        }
      }

      // For now, we'll just show a message
      // In the future, this would save to a database table
      console.log('Saving settings:', {
        eventId,
        ticketTypes,
        capacity,
        ticketSalesEnabled
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      // TODO: Save to database table (event_ticket_settings)
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addTicketType = () => {
    setTicketTypes([...ticketTypes, {
      id: `type_${Date.now()}`,
      name: '',
      price: 10.00,
      description: '',
      available: true,
      maxQuantity: 10
    }]);
  };

  const removeTicketType = (index) => {
    if (ticketTypes.length > 1) {
      setTicketTypes(ticketTypes.filter((_, i) => i !== index));
    }
  };

  const updateTicketType = (index, field, value) => {
    const updated = [...ticketTypes];
    updated[index] = {
      ...updated[index],
      [field]: field === 'price' ? parseFloat(value) || 0 : 
               field === 'maxQuantity' ? parseInt(value) || 1 :
               field === 'available' ? value :
               value
    };
    setTicketTypes(updated);
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold mx-auto mb-4"></div>
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Ticket Settings | {eventInfo?.name || eventId}</title>
      </Head>

      <Header />

      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16">
        <div className="section-container">
          <div className="max-w-4xl mx-auto">
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
              <Link href="/admin/dashboard" className="hover:text-brand-gold">Dashboard</Link>
              <ChevronRight className="w-4 h-4" />
              <Link href="/admin/tickets" className="hover:text-brand-gold">Tickets</Link>
              <ChevronRight className="w-4 h-4" />
              <Link href={`/admin/events/${eventId}/tickets`} className="hover:text-brand-gold">{eventInfo?.name || eventId}</Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-gray-900 dark:text-white">Settings</span>
            </nav>

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Ticket Settings
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {eventInfo?.name || eventId}
                </p>
              </div>
              <Link
                href={`/admin/events/${eventId}/tickets`}
                className="btn-secondary"
              >
                Back to Dashboard
              </Link>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                  <p className="text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                <p className="text-green-700 dark:text-green-300">Settings saved successfully!</p>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-8">
              {/* General Settings */}
              <div className="modern-card">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-brand-gold" />
                  General Settings
                </h2>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">
                        Ticket Sales
                      </label>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Enable or disable ticket sales for this event
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ticketSalesEnabled}
                        onChange={(e) => setTicketSalesEnabled(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-gold/20 dark:peer-focus:ring-brand-gold/30 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-gold"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                      Capacity
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        min="1"
                        value={capacity}
                        onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Maximum number of tickets available for this event
                    </p>
                  </div>
                </div>
              </div>

              {/* Ticket Types */}
              <div className="modern-card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                    <Ticket className="w-5 h-5 mr-2 text-brand-gold" />
                    Ticket Types
                  </h2>
                  <button
                    type="button"
                    onClick={addTicketType}
                    className="btn-outline text-sm py-2 px-4 flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Type
                  </button>
                </div>

                <div className="space-y-4">
                  {ticketTypes.map((type, index) => (
                    <div key={type.id || index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Ticket Type Name *
                          </label>
                          <input
                            type="text"
                            value={type.name}
                            onChange={(e) => updateTicketType(index, 'name', e.target.value)}
                            placeholder="e.g., General Admission"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Price ($) *
                          </label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={type.price}
                              onChange={(e) => updateTicketType(index, 'price', e.target.value)}
                              className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                              required
                            />
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={type.description}
                            onChange={(e) => updateTicketType(index, 'description', e.target.value)}
                            placeholder="Brief description of this ticket type"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Max Quantity per Purchase
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={type.maxQuantity || 10}
                            onChange={(e) => updateTicketType(index, 'maxQuantity', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                            Available
                          </label>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={type.available !== false}
                              onChange={(e) => updateTicketType(index, 'available', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-brand-gold/20 dark:peer-focus:ring-brand-gold/30 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-gold"></div>
                          </label>
                        </div>
                      </div>

                      {ticketTypes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTicketType(index)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm flex items-center"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-3">
                <Link
                  href={`/admin/events/${eventId}/tickets`}
                  className="btn-outline"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex items-center"
                >
                  <Save className="w-5 h-5 mr-2" />
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>

            <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Note:</strong> Currently, ticket settings are managed in code. This UI is a preview of future functionality. 
                To change ticket prices or types, update the configuration in <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">utils/event-tickets.ts</code>.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

