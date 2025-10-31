'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  Plus,
  Briefcase,
  Users,
  FileText,
  Calendar,
  Mail,
  DollarSign,
  Link as LinkIcon,
  MessageSquare,
  FileSignature,
  X,
  Loader
} from 'lucide-react';

type ModalType = 'project' | 'contact' | 'invoice' | 'contract' | 'event' | null;

export default function GlobalNewButton() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const createOptions = [
    {
      label: 'Project',
      icon: <Briefcase className="w-5 h-5" />,
      action: () => setActiveModal('project'),
      description: 'Create a new event or booking'
    },
    {
      label: 'Contact',
      icon: <Users className="w-5 h-5" />,
      action: () => setActiveModal('contact'),
      description: 'Add a new client or lead'
    },
    {
      label: 'Invoice',
      icon: <FileText className="w-5 h-5" />,
      action: () => setActiveModal('invoice'),
      description: 'Generate a new invoice'
    },
    {
      label: 'Contract',
      icon: <FileSignature className="w-5 h-5" />,
      action: () => setActiveModal('contract'),
      description: 'Create a new contract'
    },
    {
      label: 'Event',
      icon: <Calendar className="w-5 h-5" />,
      action: () => setActiveModal('event'),
      description: 'Schedule a new event'
    },
    {
      label: 'Email',
      icon: <Mail className="w-5 h-5" />,
      action: () => router.push('/admin/email?compose=true'),
      description: 'Send an email to clients'
    },
    {
      label: 'Payment Link',
      icon: <LinkIcon className="w-5 h-5" />,
      action: () => router.push('/admin/invoices/payment-link'),
      description: 'Generate a payment link'
    },
    {
      label: 'Message',
      icon: <MessageSquare className="w-5 h-5" />,
      action: () => router.push('/admin/messages?new=true'),
      description: 'Send SMS to a contact'
    }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleOptionClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* NEW Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            flex items-center gap-2 px-4 py-2 lg:px-5 lg:py-2.5
            bg-[#fcba00] hover:bg-[#e5a800] active:bg-[#d99800]
            text-black font-semibold rounded-lg
            transition-all duration-200
            shadow-sm hover:shadow-md
            text-sm lg:text-base
            ${isOpen ? 'ring-2 ring-[#fcba00] ring-offset-2' : ''}
          `}
        >
          <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
          <span className="hidden sm:inline">NEW</span>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className="
              absolute right-0 mt-2 w-72 lg:w-80
              bg-white rounded-xl shadow-2xl border border-gray-200
              overflow-hidden z-50
            "
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h3 className="text-sm font-semibold text-gray-900">Create New</h3>
              <p className="text-xs text-gray-600 mt-0.5">Choose what you'd like to create</p>
            </div>

            {/* Options List */}
            <div className="py-2 max-h-[70vh] overflow-y-auto">
              {createOptions.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionClick(option.action)}
                  className="
                    w-full flex items-start gap-3 px-4 py-3
                    hover:bg-gray-50 active:bg-gray-100
                    transition-colors duration-150
                    text-left group
                  "
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-[#fcba00]/10 flex items-center justify-center transition-colors">
                      <span className="text-gray-700 group-hover:text-[#fcba00] transition-colors">
                        {option.icon}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm group-hover:text-[#fcba00] transition-colors">
                      {option.label}
                    </div>
                    {option.description && (
                      <div className="text-xs text-gray-600 mt-0.5 line-clamp-1">
                        {option.description}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {activeModal === 'contact' && (
        <CreateContactModal
          onClose={() => setActiveModal(null)}
          onSuccess={(id) => {
            setActiveModal(null);
            router.push(`/admin/contacts/${id}`);
          }}
        />
      )}

      {activeModal === 'project' && (
        <CreateProjectModal
          onClose={() => setActiveModal(null)}
          onSuccess={(id) => {
            setActiveModal(null);
            router.push(`/admin/projects/${id}`);
          }}
        />
      )}

      {activeModal === 'invoice' && (
        <CreateInvoiceModal
          onClose={() => setActiveModal(null)}
          onSuccess={(id) => {
            setActiveModal(null);
            router.push(`/admin/invoices/${id}`);
          }}
        />
      )}

      {activeModal === 'contract' && (
        <CreateContractModal
          onClose={() => setActiveModal(null)}
          onSuccess={(id) => {
            setActiveModal(null);
            router.push(`/admin/contracts`);
          }}
        />
      )}

      {activeModal === 'event' && (
        <CreateEventModal
          onClose={() => setActiveModal(null)}
          onSuccess={() => {
            setActiveModal(null);
            router.push('/admin/calendar');
          }}
        />
      )}
    </>
  );
}

// Create Contact Modal
function CreateContactModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (id: string) => void }) {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email_address: '',
    phone: '',
    event_type: 'wedding',
    event_date: '',
    venue_name: '',
    lead_status: 'new',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('contacts')
        .insert([{
          ...formData,
          user_id: user?.id,
          lead_source: 'Manual Entry',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      onSuccess(data.id);
    } catch (error) {
      console.error('Error creating contact:', error);
      alert('Failed to create contact');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#fcba00] to-[#d99f00] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-gray-900" />
            <h2 className="text-xl font-bold text-gray-900">Create New Contact</h2>
          </div>
          <button onClick={onClose} className="text-gray-800 hover:text-black p-1 hover:bg-black/10 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              type="email"
              required
              value={formData.email_address}
              onChange={(e) => setFormData({ ...formData, email_address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
              <select
                value={formData.event_type}
                onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
              >
                <option value="wedding">Wedding</option>
                <option value="corporate">Corporate Event</option>
                <option value="school_dance">School Dance</option>
                <option value="holiday_party">Holiday Party</option>
                <option value="private_party">Private Party</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Date</label>
              <input
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name</label>
            <input
              type="text"
              value={formData.venue_name}
              onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
            />
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#fcba00] text-black rounded-lg hover:bg-[#e5a800] font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Contact'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Create Project Modal (simplified version - will expand based on your schema)
function CreateProjectModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (id: string) => void }) {
  const supabase = createClientComponentClient();
  const [loading, setLoading] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    contact_id: '',
    project_name: '',
    event_date: '',
    event_type: 'wedding',
    venue_name: '',
    status: 'lead',
    total_budget: ''
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    const { data } = await supabase
      .from('contacts')
      .select('id, first_name, last_name')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (data) setContacts(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          ...formData,
          user_id: user?.id,
          total_budget: formData.total_budget ? parseFloat(formData.total_budget) : null,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      onSuccess(data.id);
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-[#fcba00] to-[#d99f00] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Briefcase className="w-6 h-6 text-gray-900" />
            <h2 className="text-xl font-bold text-gray-900">Create New Project</h2>
          </div>
          <button onClick={onClose} className="text-gray-800 hover:text-black p-1 hover:bg-black/10 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Contact *</label>
            <select
              required
              value={formData.contact_id}
              onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
            >
              <option value="">Choose a contact...</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.first_name} {contact.last_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
            <input
              type="text"
              required
              value={formData.project_name}
              onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
              placeholder="e.g., Smith Wedding 2025"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
              <select
                value={formData.event_type}
                onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
              >
                <option value="wedding">Wedding</option>
                <option value="corporate">Corporate Event</option>
                <option value="school_dance">School Dance</option>
                <option value="private_party">Private Party</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Date *</label>
              <input
                type="date"
                required
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name</label>
            <input
              type="text"
              value={formData.venue_name}
              onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Budget</label>
            <input
              type="number"
              step="0.01"
              value={formData.total_budget}
              onChange={(e) => setFormData({ ...formData, total_budget: e.target.value })}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-[#fcba00] text-black rounded-lg hover:bg-[#e5a800] font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Placeholder modals for Invoice, Contract, and Event
function CreateInvoiceModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (id: string) => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
        <FileText className="w-16 h-16 text-[#fcba00] mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Create Invoice</h3>
        <p className="text-gray-600 mb-6">Invoice creation requires selecting a project. Redirecting to invoice page...</p>
        <button
          onClick={() => {
            onClose();
            window.location.href = '/admin/invoices/new';
          }}
          className="w-full px-4 py-2 bg-[#fcba00] text-black rounded-lg hover:bg-[#e5a800] font-medium"
        >
          Continue to Invoice Page
        </button>
      </div>
    </div>
  );
}

function CreateContractModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (id: string) => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
        <FileSignature className="w-16 h-16 text-[#fcba00] mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Create Contract</h3>
        <p className="text-gray-600 mb-6">Contract creation requires selecting a contact. Redirecting to contracts page...</p>
        <button
          onClick={() => {
            onClose();
            window.location.href = '/admin/contracts?new=true';
          }}
          className="w-full px-4 py-2 bg-[#fcba00] text-black rounded-lg hover:bg-[#e5a800] font-medium"
        >
          Continue to Contracts Page
        </button>
      </div>
    </div>
  );
}

function CreateEventModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
        <Calendar className="w-16 h-16 text-[#fcba00] mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Create Event</h3>
        <p className="text-gray-600 mb-6">Redirecting to calendar to schedule a new event...</p>
        <button
          onClick={() => {
            onClose();
            window.location.href = '/admin/calendar?new=true';
          }}
          className="w-full px-4 py-2 bg-[#fcba00] text-black rounded-lg hover:bg-[#e5a800] font-medium"
        >
          Continue to Calendar
        </button>
      </div>
    </div>
  );
}
