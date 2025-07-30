import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { createClient } from '@/utils/supabase/client';
import { 
  ArrowLeft,
  Mail, 
  Phone, 
  MessageSquare,
  Calendar, 
  MapPin, 
  User,
  Send,
  Plus,
  Edit3,
  Clock,
  AlertCircle,
  CheckCircle,
  Star,
  MessageCircle,
  Bell,
  Save,
  Eye,
  Trash2,
  Copy,
  ExternalLink
} from 'lucide-react';

export default function ContactDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [contact, setContact] = useState(null);
  const [communications, setCommunications] = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  
  // Form states
  const [emailForm, setEmailForm] = useState({ subject: '', content: '', template: '' });
  const [smsForm, setSmsForm] = useState({ message: '' });
  const [noteForm, setNoteForm] = useState({ content: '' });
  const [followUpForm, setFollowUpForm] = useState({ date: '', type: 'follow_up', message: '' });
  const [editingNotes, setEditingNotes] = useState(false);
  const [contactNotes, setContactNotes] = useState('');
  
  // Loading states
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (id) {
      loadContactData();
    }
  }, [id]);

  const loadContactData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const supabase = createClient();
      
      // Load contact submission
      const { data: contactData, error: contactError } = await supabase
        .from('contact_submissions')
        .select('*')
        .eq('id', id)
        .single();

      if (contactError) throw contactError;
      if (!contactData) throw new Error('Contact not found');

      setContact(contactData);
      setContactNotes(contactData.notes || '');
      
      // Load communication history
      const { data: commData, error: commError } = await supabase
        .from('communication_log')
        .select('*')
        .eq('contact_submission_id', id)
        .order('created_at', { ascending: false });

      if (commError) throw commError;
      setCommunications(commData || []);
      
      // Load email templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (templatesError) throw templatesError;
      setEmailTemplates(templatesData || []);
      
    } catch (err) {
      console.error('Error loading contact data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateContactStatus = async (newStatus) => {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('contact_submissions')
        .update({ 
          status: newStatus,
          last_contact_date: new Date().toISOString(),
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;
      
      setContact(prev => ({ ...prev, status: newStatus }));
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  const saveNotes = async () => {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('contact_submissions')
        .update({ 
          notes: contactNotes,
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) throw error;
      
      setContact(prev => ({ ...prev, notes: contactNotes }));
      setEditingNotes(false);
    } catch (err) {
      console.error('Error saving notes:', err);
      alert('Failed to save notes');
    }
  };

  const sendEmail = async () => {
    if (!emailForm.subject || !emailForm.content) {
      alert('Please fill in subject and content');
      return;
    }

    setSendingEmail(true);
    try {
      // Process template variables
      let processedContent = emailForm.content
        .replace(/\{\{client_name\}\}/g, contact.name)
        .replace(/\{\{event_type\}\}/g, contact.event_type)
        .replace(/\{\{event_date\}\}/g, contact.event_date ? new Date(contact.event_date).toLocaleDateString() : 'TBD')
        .replace(/\{\{location\}\}/g, contact.location || 'TBD');

      let processedSubject = emailForm.subject
        .replace(/\{\{client_name\}\}/g, contact.name)
        .replace(/\{\{event_type\}\}/g, contact.event_type);

      // Send email via API
      const response = await fetch('/api/admin/communications/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: id,
          to: contact.email,
          subject: processedSubject,
          content: processedContent,
          originalTemplate: emailForm.template
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      // Log the communication
      await logCommunication('email', 'outbound', processedSubject, processedContent);
      
      setEmailForm({ subject: '', content: '', template: '' });
      alert('Email sent successfully!');
      
    } catch (err) {
      console.error('Error sending email:', err);
      alert('Failed to send email: ' + err.message);
    } finally {
      setSendingEmail(false);
    }
  };

  const sendSms = async () => {
    if (!smsForm.message) {
      alert('Please enter a message');
      return;
    }

    if (!contact.phone) {
      alert('No phone number available for this contact');
      return;
    }

    setSendingSms(true);
    try {
      // Process template variables
      let processedMessage = smsForm.message
        .replace(/\{\{client_name\}\}/g, contact.name)
        .replace(/\{\{event_type\}\}/g, contact.event_type)
        .replace(/\{\{event_date\}\}/g, contact.event_date ? new Date(contact.event_date).toLocaleDateString() : 'TBD');

      // Send SMS via API
      const response = await fetch('/api/admin/communications/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: id,
          to: contact.phone,
          message: processedMessage
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error);

      // Log the communication
      await logCommunication('sms', 'outbound', null, processedMessage);
      
      setSmsForm({ message: '' });
      alert('SMS sent successfully!');
      
    } catch (err) {
      console.error('Error sending SMS:', err);
      alert('Failed to send SMS: ' + err.message);
    } finally {
      setSendingSms(false);
    }
  };

  const addNote = async () => {
    if (!noteForm.content) return;

    setSavingNote(true);
    try {
      await logCommunication('note', 'outbound', null, noteForm.content);
      setNoteForm({ content: '' });
    } catch (err) {
      console.error('Error adding note:', err);
      alert('Failed to add note');
    } finally {
      setSavingNote(false);
    }
  };

  const logCommunication = async (type, direction, subject, content) => {
    try {
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('communication_log')
        .insert([{
          contact_submission_id: id,
          communication_type: type,
          direction,
          subject,
          content,
          sent_by: 'Admin', // You could get the actual admin user here
          sent_to: type === 'email' ? contact.email : (type === 'sms' ? contact.phone : null),
          created_at: new Date().toISOString()
        }])
        .select();

      if (error) throw error;
      
      // Refresh communications
      await loadContactData();
      
    } catch (err) {
      console.error('Error logging communication:', err);
      throw err;
    }
  };

  const applyEmailTemplate = (template) => {
    setEmailForm({
      ...emailForm,
      subject: template.subject,
      content: template.content,
      template: template.id
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-blue-50 text-blue-700 border-blue-200',
      contacted: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      quoted: 'bg-purple-50 text-purple-700 border-purple-200',
      booked: 'bg-green-50 text-green-700 border-green-200',
      completed: 'bg-gray-50 text-gray-700 border-gray-200',
      cancelled: 'bg-red-50 text-red-700 border-red-200'
    };
    return colors[status] || colors.new;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'text-gray-500',
      normal: 'text-blue-500',
      high: 'text-orange-500',
      urgent: 'text-red-500'
    };
    return colors[priority] || colors.normal;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading contact details...</p>
        </div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Error Loading Contact</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'Contact not found'}</p>
          <Link href="/admin/dashboard" className="btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{contact.name} - Contact Management - M10 DJ Company Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link 
                  href="/admin/dashboard"
                  className="flex items-center text-gray-600 dark:text-gray-400 hover:text-brand-gold mr-6"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Dashboard
                </Link>
                
                <div className="w-8 h-8 bg-brand-gold rounded-lg flex items-center justify-center mr-3">
                  <User className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    {contact.name}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {contact.event_type} • {formatDate(contact.created_at)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <select
                  value={contact.status}
                  onChange={(e) => updateContactStatus(e.target.value)}
                  className={`px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(contact.status)}`}
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="quoted">Quoted</option>
                  <option value="booked">Booked</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              {[
                { id: 'details', label: 'Details', icon: User },
                { id: 'communicate', label: 'Communicate', icon: MessageSquare },
                { id: 'history', label: 'History', icon: Clock }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-brand-gold text-brand-gold'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Contact Information */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Contact Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Name
                      </label>
                      <div className="flex items-center text-gray-900 dark:text-white">
                        <User className="w-4 h-4 mr-2" />
                        {contact.name}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email
                      </label>
                      <div className="flex items-center text-gray-900 dark:text-white">
                        <Mail className="w-4 h-4 mr-2" />
                        <a href={`mailto:${contact.email}`} className="hover:text-brand-gold transition-colors">
                          {contact.email}
                        </a>
                      </div>
                    </div>
                    
                    {contact.phone && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Phone
                        </label>
                        <div className="flex items-center text-gray-900 dark:text-white">
                          <Phone className="w-4 h-4 mr-2" />
                          <a href={`tel:${contact.phone}`} className="hover:text-brand-gold transition-colors">
                            {contact.phone}
                          </a>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Event Type
                      </label>
                      <div className="text-gray-900 dark:text-white">
                        {contact.event_type}
                      </div>
                    </div>
                    
                    {contact.event_date && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Event Date
                        </label>
                        <div className="flex items-center text-gray-900 dark:text-white">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(contact.event_date).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                    
                    {contact.location && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Location
                        </label>
                        <div className="flex items-center text-gray-900 dark:text-white">
                          <MapPin className="w-4 h-4 mr-2" />
                          {contact.location}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {contact.message && (
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Original Message
                      </label>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-gray-900 dark:text-white">
                        {contact.message}
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Notes</h2>
                    <button
                      onClick={() => editingNotes ? saveNotes() : setEditingNotes(true)}
                      className="btn-secondary !px-3 !py-1"
                    >
                      {editingNotes ? <Save className="w-4 h-4 mr-1" /> : <Edit3 className="w-4 h-4 mr-1" />}
                      {editingNotes ? 'Save' : 'Edit'}
                    </button>
                  </div>
                  
                  {editingNotes ? (
                    <textarea
                      value={contactNotes}
                      onChange={(e) => setContactNotes(e.target.value)}
                      rows={6}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Add notes about this contact..."
                    />
                  ) : (
                    <div className="text-gray-900 dark:text-white whitespace-pre-wrap min-h-[100px]">
                      {contactNotes || 'No notes yet. Click Edit to add notes.'}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions Sidebar */}
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                  
                  <div className="space-y-3">
                    <a
                      href={`mailto:${contact.email}`}
                      className="w-full btn-primary flex items-center justify-center"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Send Email
                    </a>
                    
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        className="w-full btn-secondary flex items-center justify-center"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Call Client
                      </a>
                    )}
                    
                    <button
                      onClick={() => setActiveTab('communicate')}
                      className="w-full btn-secondary flex items-center justify-center"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Send Message
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Contact Stats</h2>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Communications:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{communications.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Last Contact:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {contact.last_contact_date ? formatDate(contact.last_contact_date) : 'Never'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(contact.status)}`}>
                        {contact.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'communicate' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Email Section */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                    <Mail className="w-5 h-5 mr-2" />
                    Send Email
                  </h2>
                  {emailTemplates.length > 0 && (
                    <select
                      value={emailForm.template}
                      onChange={(e) => {
                        const template = emailTemplates.find(t => t.id === e.target.value);
                        if (template) applyEmailTemplate(template);
                      }}
                      className="text-sm px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Choose Template</option>
                      {emailTemplates.map(template => (
                        <option key={template.id} value={template.id}>{template.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      To: {contact.email}
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={emailForm.subject}
                      onChange={(e) => setEmailForm({...emailForm, subject: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Email subject..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Message
                    </label>
                    <textarea
                      value={emailForm.content}
                      onChange={(e) => setEmailForm({...emailForm, content: e.target.value})}
                      rows={8}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Use {{client_name}}, {{event_type}}, {{event_date}} for personalization..."
                    />
                  </div>
                  
                  <button
                    onClick={sendEmail}
                    disabled={sendingEmail}
                    className="w-full btn-primary flex items-center justify-center"
                  >
                    {sendingEmail ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Email
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* SMS Section */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center mb-4">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Send SMS
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      To: {contact.phone || 'No phone number'}
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Message ({160 - smsForm.message.length} characters remaining)
                    </label>
                    <textarea
                      value={smsForm.message}
                      onChange={(e) => setSmsForm({message: e.target.value})}
                      rows={4}
                      maxLength={160}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Use {{client_name}}, {{event_type}}, {{event_date}} for personalization..."
                      disabled={!contact.phone}
                    />
                  </div>
                  
                  <button
                    onClick={sendSms}
                    disabled={sendingSms || !contact.phone}
                    className="w-full btn-primary flex items-center justify-center disabled:opacity-50"
                  >
                    {sendingSms ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send SMS
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Add Note Section */}
              <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center mb-4">
                  <Edit3 className="w-5 h-5 mr-2" />
                  Add Note
                </h2>
                
                <div className="space-y-4">
                  <textarea
                    value={noteForm.content}
                    onChange={(e) => setNoteForm({content: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Add a note about this contact..."
                  />
                  
                  <button
                    onClick={addNote}
                    disabled={savingNote || !noteForm.content}
                    className="btn-secondary flex items-center disabled:opacity-50"
                  >
                    {savingNote ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Note
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Communication History ({communications.length})
                </h2>
              </div>
              
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {communications.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                      No communications yet. Start a conversation!
                    </p>
                  </div>
                ) : (
                  communications.map((comm) => (
                    <div key={comm.id} className="p-6">
                      <div className="flex items-start">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          comm.communication_type === 'email' ? 'bg-blue-100 text-blue-600' :
                          comm.communication_type === 'sms' ? 'bg-green-100 text-green-600' :
                          comm.communication_type === 'call' ? 'bg-purple-100 text-purple-600' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {comm.communication_type === 'email' ? <Mail className="w-4 h-4" /> :
                           comm.communication_type === 'sms' ? <MessageCircle className="w-4 h-4" /> :
                           comm.communication_type === 'call' ? <Phone className="w-4 h-4" /> :
                           <Edit3 className="w-4 h-4" />}
                        </div>
                        
                        <div className="ml-4 flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900 dark:text-white capitalize">
                                {comm.communication_type}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                comm.direction === 'outbound' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
                              }`}>
                                {comm.direction}
                              </span>
                              {comm.subject && (
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  • {comm.subject}
                                </span>
                              )}
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(comm.created_at)}
                            </span>
                          </div>
                          
                          <div className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {comm.content}
                          </div>
                          
                          {comm.sent_by && (
                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                              By: {comm.sent_by}
                              {comm.sent_to && ` • To: ${comm.sent_to}`}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}