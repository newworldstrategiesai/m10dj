import React, { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { 
  FileText, 
  Plus, 
  Save, 
  Eye, 
  Trash2, 
  Edit2, 
  Copy,
  ChevronDown,
  X,
  AlertCircle,
  Check
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  template_content: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  version: number;
}

interface SmartField {
  id: string;
  label: string;
  placeholder: string;
  source: string;
  category: string;
}

export default function ContractTemplateEditor() {
  const supabase = createClientComponentClient();
  const { toast } = useToast();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showSmartFields, setShowSmartFields] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);

  // Smart fields organized by category
  const smartFields: SmartField[] = [
    // Client Information
    { id: '{{client_first_name}}', label: 'Client First Name', placeholder: 'John', source: 'contacts.first_name', category: 'Client Info' },
    { id: '{{client_last_name}}', label: 'Client Last Name', placeholder: 'Smith', source: 'contacts.last_name', category: 'Client Info' },
    { id: '{{client_full_name}}', label: 'Client Full Name', placeholder: 'John Smith', source: 'contacts.first_name + last_name', category: 'Client Info' },
    { id: '{{client_email}}', label: 'Client Email', placeholder: 'john@example.com', source: 'contacts.email_address', category: 'Client Info' },
    { id: '{{client_phone}}', label: 'Client Phone', placeholder: '(901) 555-1234', source: 'contacts.phone', category: 'Client Info' },
    
    // Event Details
    { id: '{{event_name}}', label: 'Event Name', placeholder: 'Smith Wedding', source: 'contacts.event_name', category: 'Event Details' },
    { id: '{{event_type}}', label: 'Event Type', placeholder: 'Wedding', source: 'contacts.event_type', category: 'Event Details' },
    { id: '{{event_date}}', label: 'Event Date', placeholder: 'Sat, May 2, 2026', source: 'contacts.event_date', category: 'Event Details' },
    { id: '{{event_date_short}}', label: 'Event Date (Short)', placeholder: '05/02/2026', source: 'contacts.event_date', category: 'Event Details' },
    { id: '{{venue_name}}', label: 'Venue Name', placeholder: 'Memphis Botanic Garden', source: 'contacts.venue_name', category: 'Event Details' },
    { id: '{{venue_address}}', label: 'Venue Address', placeholder: '750 Cherry Rd, Memphis, TN 38117', source: 'contacts.venue_address', category: 'Event Details' },
    { id: '{{guest_count}}', label: 'Guest Count', placeholder: '150', source: 'contacts.guest_count', category: 'Event Details' },
    
    // Financial
    { id: '{{invoice_total}}', label: 'Invoice Total', placeholder: '$2,500.00', source: 'invoices.total', category: 'Financial' },
    { id: '{{invoice_subtotal}}', label: 'Invoice Subtotal', placeholder: '$2,500.00', source: 'invoices.subtotal', category: 'Financial' },
    { id: '{{deposit_amount}}', label: 'Deposit Amount', placeholder: '$750.00', source: 'calculated', category: 'Financial' },
    { id: '{{remaining_balance}}', label: 'Remaining Balance', placeholder: '$1,750.00', source: 'calculated', category: 'Financial' },
    { id: '{{payment_schedule}}', label: 'Payment Schedule', placeholder: '50% due on...', source: 'invoices.payment_schedule', category: 'Financial' },
    
    // Contract Details
    { id: '{{contract_number}}', label: 'Contract Number', placeholder: 'CONT-20250128-001', source: 'contracts.contract_number', category: 'Contract Details' },
    { id: '{{effective_date}}', label: 'Effective Date', placeholder: 'Jan 28, 2025', source: 'contracts.created_at', category: 'Contract Details' },
    { id: '{{effective_date_short}}', label: 'Effective Date (Short)', placeholder: '01/28/2025', source: 'contracts.created_at', category: 'Contract Details' },
    { id: '{{today_date}}', label: 'Today\'s Date', placeholder: 'Oct 28, 2025', source: 'current_date', category: 'Contract Details' },
    
    // Company Info
    { id: '{{company_name}}', label: 'Company Name', placeholder: 'M10 DJ Company', source: 'config', category: 'Company Info' },
    { id: '{{company_address}}', label: 'Company Address', placeholder: '65 Stewart Rd, Eads, TN 38028', source: 'config', category: 'Company Info' },
    { id: '{{company_email}}', label: 'Company Email', placeholder: 'm10djcompany@gmail.com', source: 'config', category: 'Company Info' },
    { id: '{{company_phone}}', label: 'Company Phone', placeholder: '(901) 555-0000', source: 'config', category: 'Company Info' },
    { id: '{{owner_name}}', label: 'Owner Name', placeholder: 'Ben Murray', source: 'config', category: 'Company Info' },
  ];

  const groupedFields = smartFields.reduce((acc, field) => {
    if (!acc[field.category]) {
      acc[field.category] = [];
    }
    acc[field.category].push(field);
    return acc;
  }, {} as Record<string, SmartField[]>);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contract_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load templates',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewTemplate = () => {
    setSelectedTemplate(null);
    setTemplateName('');
    setTemplateDescription('');
    setTemplateContent('');
    setIsEditing(true);
  };

  const handleEditTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setTemplateName(template.name);
    setTemplateDescription(template.description);
    setTemplateContent(template.template_content);
    setIsEditing(true);
    setShowPreview(false);
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim() || !templateContent.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Template name and content are required',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (selectedTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('contract_templates')
          .update({
            name: templateName,
            description: templateDescription,
            template_content: templateContent,
            version: selectedTemplate.version + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedTemplate.id);

        if (error) throw error;

        toast({
          title: 'Template Updated',
          description: 'Contract template has been updated successfully',
        });
      } else {
        // Create new template
        const { error } = await supabase
          .from('contract_templates')
          .insert({
            name: templateName,
            description: templateDescription,
            template_content: templateContent,
            is_active: true,
            version: 1,
          });

        if (error) throw error;

        toast({
          title: 'Template Created',
          description: 'New contract template has been created',
        });
      }

      setIsEditing(false);
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Error',
        description: 'Failed to save template',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('contract_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: 'Template Deleted',
        description: 'Contract template has been deleted',
      });

      if (selectedTemplate?.id === templateId) {
        setSelectedTemplate(null);
        setIsEditing(false);
      }

      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive',
      });
    }
  };

  const handleDuplicateTemplate = async (template: Template) => {
    try {
      const { error } = await supabase
        .from('contract_templates')
        .insert({
          name: `${template.name} (Copy)`,
          description: template.description,
          template_content: template.template_content,
          is_active: false,
          version: 1,
        });

      if (error) throw error;

      toast({
        title: 'Template Duplicated',
        description: 'A copy of the template has been created',
      });

      fetchTemplates();
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast({
        title: 'Error',
        description: 'Failed to duplicate template',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (template: Template) => {
    try {
      const { error } = await supabase
        .from('contract_templates')
        .update({ is_active: !template.is_active })
        .eq('id', template.id);

      if (error) throw error;

      toast({
        title: template.is_active ? 'Template Deactivated' : 'Template Activated',
        description: `Template is now ${!template.is_active ? 'active' : 'inactive'}`,
      });

      fetchTemplates();
    } catch (error) {
      console.error('Error toggling template:', error);
      toast({
        title: 'Error',
        description: 'Failed to update template status',
        variant: 'destructive',
      });
    }
  };

  const insertSmartField = (field: SmartField) => {
    const textarea = document.getElementById('template-content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = templateContent;
    const before = text.substring(0, start);
    const after = text.substring(end);

    const newContent = before + field.id + after;
    setTemplateContent(newContent);

    // Set cursor position after the inserted field
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + field.id.length, start + field.id.length);
    }, 0);

    setShowSmartFields(false);
  };

  const generatePreview = () => {
    // Replace smart fields with example data for preview
    let preview = templateContent;
    smartFields.forEach(field => {
      const regex = new RegExp(field.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      preview = preview.replace(regex, field.placeholder);
    });
    return preview;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {selectedTemplate ? 'Edit Template' : 'New Contract Template'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Create templates with smart fields that auto-populate from client data
            </p>
          </div>
          <button
            onClick={() => {
              setIsEditing(false);
              setShowPreview(false);
            }}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Template Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Template Name *
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="e.g., Standard DJ Services Contract"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <input
              type="text"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Brief description of when to use this template"
            />
          </div>
        </div>

        {/* Editor */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {/* Toolbar */}
          <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSmartFields(!showSmartFields)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Insert Smart Field
                <ChevronDown className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Eye className="w-4 h-4" />
                {showPreview ? 'Edit' : 'Preview'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setShowPreview(false);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>

          {/* Smart Fields Dropdown */}
          {showSmartFields && (
            <div className="border-b border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
              <div className="max-h-96 overflow-y-auto space-y-4">
                {Object.entries(groupedFields).map(([category, fields]) => (
                  <div key={category}>
                    <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                      {category}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {fields.map((field) => (
                        <button
                          key={field.id}
                          onClick={() => insertSmartField(field)}
                          className="text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-800 hover:border-purple-300 dark:hover:border-purple-600 transition-colors group"
                        >
                          <div className="font-medium text-sm text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400">
                            {field.label}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {field.placeholder}
                          </div>
                          <div className="text-xs font-mono text-gray-400 dark:text-gray-500 mt-1">
                            {field.id}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="p-6">
            {showPreview ? (
              <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                {generatePreview()}
              </div>
            ) : (
              <textarea
                id="template-content"
                value={templateContent}
                onChange={(e) => setTemplateContent(e.target.value)}
                className="w-full h-[600px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Start typing your contract template. Use Insert Smart Field to add dynamic data..."
              />
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">How to use Smart Fields:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                <li>Click "Insert Smart Field" to add dynamic data that auto-populates</li>
                <li>Smart fields appear as <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{'{{field_name}}'}</code> in your template</li>
                <li>Use Preview to see how the contract will look with sample data</li>
                <li>All fields will be replaced with actual client data when generating contracts</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Contract Templates</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your contract templates with smart fields
          </p>
        </div>
        <button
          onClick={handleNewTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Template
        </button>
      </div>

      {/* Templates List */}
      {templates.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No templates yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create your first contract template to get started
          </p>
          <button
            onClick={handleNewTemplate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Template
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {template.name}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        template.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {template.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      v{template.version}
                    </span>
                  </div>
                  {template.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {template.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      Created: {new Date(template.created_at).toLocaleDateString()}
                    </span>
                    <span>
                      Updated: {new Date(template.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleEditTemplate(template)}
                    className="p-2 text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicateTemplate(template)}
                    className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(template)}
                    className="p-2 text-gray-600 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-colors"
                    title={template.is_active ? 'Deactivate' : 'Activate'}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

