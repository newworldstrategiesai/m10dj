import React, { useState, useEffect, useRef } from 'react';
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
  Check,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link as LinkIcon,
  Settings,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Star,
  PenTool
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  description: string;
  template_content: string;
  is_active: boolean;
  is_default?: boolean;
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
  const [selectedSmartField, setSelectedSmartField] = useState<SmartField | null>(null);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  
  // Editor refs
  const editorRef = useRef<HTMLDivElement>(null);
  const [isEditingHTML, setIsEditingHTML] = useState(false);

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
    
    // Signature Fields
    { id: '{{signature_area}}', label: 'Signature Area', placeholder: '[Signature Area - Client signs here]', source: 'signature_component', category: 'Signature' },
    { id: '{{signature_date}}', label: 'Signature Date', placeholder: 'Jan 28, 2025', source: 'contracts.signed_at', category: 'Signature' },
    { id: '{{signature_client_name}}', label: 'Client Signature Name', placeholder: 'John Smith', source: 'signature_name', category: 'Signature' },
    { id: '{{signature_company_name}}', label: 'Company Rep Signature Name', placeholder: 'Ben Murray', source: 'config', category: 'Signature' },
    { id: '{{signature_title}}', label: 'Signature Title/Role', placeholder: 'Owner, M10 DJ Company', source: 'config', category: 'Signature' },
    
    // Editable Signature Fields (for form inputs)
    { id: '{{editable_signer_name}}', label: 'Editable Signer Name (Input Field)', placeholder: 'John Smith', source: 'signature_name (editable)', category: 'Signature' },
    { id: '{{editable_signer_email}}', label: 'Editable Signer Email (Input Field)', placeholder: 'john@example.com', source: 'signature_email (editable)', category: 'Signature' },
    { id: '{{editable_company_name}}', label: 'Editable Company Name (Input Field)', placeholder: 'Ben Murray', source: 'config (editable)', category: 'Signature' },
    { id: '{{editable_company_email}}', label: 'Editable Company Email (Input Field)', placeholder: 'm10djcompany@gmail.com', source: 'config (editable)', category: 'Signature' },
    
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
    setShowConfigPanel(false);
    setSelectedSmartField(null);
    setIsEditingHTML(false);
    // Initialize empty editor
    setTimeout(() => {
      if (editorRef.current && !isEditingHTML) {
        editorRef.current.innerHTML = '';
      }
    }, 100);
  };

  const handleEditTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setTemplateName(template.name);
    setTemplateDescription(template.description);
    setTemplateContent(template.template_content);
    setIsEditing(true);
    setShowPreview(false);
    setShowConfigPanel(false);
    setSelectedSmartField(null);
    // Initialize editor with content after a brief delay to ensure DOM is ready
    setTimeout(() => {
      if (editorRef.current && !isEditingHTML) {
        editorRef.current.innerHTML = highlightSmartFields(template.template_content);
      }
    }, 100);
  };

  const handleSaveTemplate = async () => {
    // Ensure we have the latest content from editor
    let contentToSave = templateContent;
    if (editorRef.current && !isEditingHTML) {
      contentToSave = editorRef.current.innerHTML;
    }

    // Debug logging
    console.log('Save attempted:', {
      templateName: templateName.trim(),
      contentLength: contentToSave.trim().length,
      isEditingHTML,
      templateContent: templateContent.substring(0, 100)
    });

    if (!templateName.trim()) {
      toast({
        title: 'Template Name Required',
        description: 'Please enter a template name before saving',
        variant: 'destructive',
      });
      // Focus the template name input
      const nameInput = document.querySelector('input[placeholder*="Standard DJ Services Contract"]') as HTMLInputElement;
      if (nameInput) {
        nameInput.focus();
      }
      return;
    }

    if (!contentToSave.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Template content is required - please add some content to your template',
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
            template_content: contentToSave,
            version: selectedTemplate.version + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedTemplate.id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }

        toast({
          title: 'Template Updated',
          description: 'Contract template has been updated successfully',
        });
      } else {
        // Create new template
        const { data: { user } } = await supabase.auth.getUser();
        
        const { error } = await supabase
          .from('contract_templates')
          .insert({
            name: templateName,
            description: templateDescription,
            template_type: 'service_agreement',
            template_content: contentToSave,
            is_active: true,
            is_default: false,
            version: 1,
          });

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }

        toast({
          title: 'Template Created',
          description: 'New contract template has been created',
        });
      }

      // Clear form state
      setSelectedTemplate(null);
      setTemplateName('');
      setTemplateDescription('');
      setTemplateContent('');
      setIsEditing(false);
      setShowConfigPanel(false);
      setSelectedSmartField(null);
      
      // Refresh templates list
      await fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save template',
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

  const handleSetDefault = async (template: Template) => {
    try {
      // First, unset all other default templates
      const { error: unsetError } = await supabase
        .from('contract_templates')
        .update({ is_default: false })
        .neq('id', template.id);

      if (unsetError) throw unsetError;

      // Then set this one as default
      const { error } = await supabase
        .from('contract_templates')
        .update({ 
          is_default: true,
          is_active: true // Also activate if setting as default
        })
        .eq('id', template.id);

      if (error) throw error;

      toast({
        title: 'Default Template Set',
        description: `${template.name} is now the default template`,
      });

      fetchTemplates();
    } catch (error) {
      console.error('Error setting default template:', error);
      toast({
        title: 'Error',
        description: 'Failed to set default template',
        variant: 'destructive',
      });
    }
  };

  // Rich text formatting functions
  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      updateContentFromEditor();
    }
  };

  const updateContentFromEditor = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setTemplateContent(html);
    }
  };

  // Handle smart field click in editor
  const handleEditorClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('smart-field')) {
      const fieldId = target.getAttribute('data-field-id');
      if (fieldId) {
        const field = smartFields.find(f => f.id === fieldId);
        if (field) {
          setSelectedSmartField(field);
          setShowConfigPanel(true);
        }
      }
    }
  };

  // Highlight smart fields in content (only if not already highlighted)
  const highlightSmartFields = (content: string): string => {
    // If content already has smart-field spans, extract plain text first
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    
    let highlighted = plainText;
    smartFields.forEach(field => {
      const regex = new RegExp(field.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      // Special styling for different field types
      let bgColor = 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300';
      let borderStyle = '';
      
      if (field.id === '{{signature_area}}') {
        bgColor = 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300';
        borderStyle = 'border-2 border-blue-300 dark:border-blue-700';
      } else if (field.id.includes('editable_')) {
        bgColor = 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300';
        borderStyle = 'border-2 border-green-300 dark:border-green-700';
      }
      
      highlighted = highlighted.replace(
        regex,
        `<span class="smart-field ${bgColor} ${borderStyle} px-2 py-1 rounded cursor-pointer hover:opacity-80 font-medium" data-field-id="${field.id}" contenteditable="false">${field.id}</span>`
      );
    });
    return highlighted;
  };

  const insertSmartField = (field: SmartField) => {
    if (editorRef.current) {
      const selection = window.getSelection();
      
      // Check if there's a valid selection with a range
      if (!selection || selection.rangeCount === 0) {
        // No selection, append to end of content
        editorRef.current.focus();
        const smartFieldElement = document.createElement('span');
        smartFieldElement.className = 'smart-field bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-1 rounded cursor-pointer hover:bg-purple-200 dark:hover:bg-purple-800';
        smartFieldElement.setAttribute('data-field-id', field.id);
        smartFieldElement.textContent = field.id;
        smartFieldElement.contentEditable = 'false';
        
        // Append to editor
        editorRef.current.appendChild(smartFieldElement);
        
        // Add a space after for text to continue
        const space = document.createTextNode(' ');
        editorRef.current.appendChild(space);
        
        // Move cursor after the field
        const newRange = document.createRange();
        newRange.setStartAfter(space);
        newRange.collapse(true);
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
        
        updateContentFromEditor();
      } else {
        // There's a valid selection, insert at cursor position
        const range = selection.getRangeAt(0);
        
        const smartFieldElement = document.createElement('span');
        smartFieldElement.className = 'smart-field bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-1 rounded cursor-pointer hover:bg-purple-200 dark:hover:bg-purple-800';
        smartFieldElement.setAttribute('data-field-id', field.id);
        smartFieldElement.textContent = field.id;
        smartFieldElement.contentEditable = 'false';
        
        range.deleteContents();
        range.insertNode(smartFieldElement);
        
        // Move cursor after the smart field
        range.setStartAfter(smartFieldElement);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        
        updateContentFromEditor();
      }
      
      editorRef.current.focus();
    } else {
      // Fallback to textarea method if editor not available
      const textarea = document.getElementById('template-content') as HTMLTextAreaElement;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = templateContent;
      const before = text.substring(0, start);
      const after = text.substring(end);

      const newContent = before + field.id + after;
      setTemplateContent(newContent);

      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + field.id.length, start + field.id.length);
      }, 0);
    }

    setShowSmartFields(false);
  };

  const generatePreview = () => {
    // Extract text from HTML and replace smart fields with example data
    let preview = templateContent;
    
    smartFields.forEach(field => {
      const regex = new RegExp(field.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (field.id === '{{signature_area}}') {
        // Special visual placeholder for signature area
        preview = preview.replace(
          regex,
          `<div style="border: 2px dashed #3b82f6; padding: 20px; margin: 20px 0; text-align: center; background-color: #eff6ff; border-radius: 8px;">
            <div style="color: #1e40af; font-weight: 600; margin-bottom: 10px;">📝 Signature Area</div>
            <div style="color: #64748b; font-size: 14px;">Client will sign here</div>
            <div style="margin-top: 20px; height: 80px; border-top: 1px solid #94a3b8; padding-top: 15px; color: #64748b; font-size: 12px;">Signature line</div>
          </div>`
        );
      } else {
        preview = preview.replace(regex, field.placeholder);
      }
    });
    
    return preview;
  };

  // Handle editor content change
  const handleEditorInput = () => {
    updateContentFromEditor();
  };

  // Convert HTML content to plain text for storage
  const getPlainContent = (html: string): string => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  // Convert plain text back to HTML with smart field highlighting
  const getHtmlContent = (text: string): string => {
    // Preserve any existing HTML formatting, but highlight smart fields
    return highlightSmartFields(text);
  };

  // Sync editor content when templateContent changes externally (only when not actively editing)
  useEffect(() => {
    if (editorRef.current && !isEditingHTML && !document.activeElement?.isSameNode(editorRef.current)) {
      const currentContent = editorRef.current.innerHTML;
      const newContent = highlightSmartFields(templateContent);
      if (currentContent !== newContent && !editorRef.current.matches(':focus')) {
        editorRef.current.innerHTML = newContent;
      }
    }
  }, [templateContent, isEditingHTML]);

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
            <div className="flex items-center gap-2 flex-wrap">
              {/* Formatting Buttons */}
              <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-2 mr-2">
                <button
                  type="button"
                  onClick={() => formatText('bold')}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Bold"
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => formatText('italic')}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Italic"
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => formatText('underline')}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Underline"
                >
                  <Underline className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-2 mr-2">
                <button
                  type="button"
                  onClick={() => formatText('insertUnorderedList')}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Bullet List"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => formatText('insertOrderedList')}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Numbered List"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1 border-r border-gray-300 dark:border-gray-600 pr-2 mr-2">
                <button
                  type="button"
                  onClick={() => formatText('justifyLeft')}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Align Left"
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => formatText('justifyCenter')}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Align Center"
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => formatText('justifyRight')}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title="Align Right"
                >
                  <AlignRight className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => {
                  // Insert signature area directly
                  const signatureField = smartFields.find(f => f.id === '{{signature_area}}');
                  if (signatureField) {
                    insertSmartField(signatureField);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="Insert Signature Area"
              >
                <PenTool className="w-4 h-4" />
                Add Signature Area
              </button>

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

              <button
                onClick={() => {
                  const newMode = !isEditingHTML;
                  if (newMode) {
                    // Switching to HTML mode - get plain text
                    if (editorRef.current) {
                      const tempDiv = document.createElement('div');
                      tempDiv.innerHTML = editorRef.current.innerHTML;
                      const plainText = tempDiv.textContent || tempDiv.innerText || '';
                      setTemplateContent(plainText);
                    }
                  } else {
                    // Switching to Rich mode - convert plain text to HTML with highlights
                    if (editorRef.current) {
                      editorRef.current.innerHTML = highlightSmartFields(templateContent);
                    }
                  }
                  setIsEditingHTML(newMode);
                }}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                title="Toggle Rich Text/HTML mode"
              >
                <Type className="w-4 h-4" />
                {isEditingHTML ? 'Rich' : 'HTML'}
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setShowPreview(false);
                  setShowConfigPanel(false);
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

          {/* Content Area - Split View */}
          <div className="flex gap-4 p-6">
            {/* Editor */}
            <div className={`flex-1 ${showConfigPanel ? 'w-2/3' : 'w-full'}`}>
              {showPreview ? (
                <div 
                  className="prose prose-sm max-w-none dark:prose-invert min-h-[600px] p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                  dangerouslySetInnerHTML={{ __html: generatePreview() }}
                />
              ) : isEditingHTML ? (
                <textarea
                  id="template-content"
                  value={templateContent}
                  onChange={(e) => setTemplateContent(e.target.value)}
                  onKeyDown={(e) => {
                    // Prevent tab from losing focus
                    if (e.key === 'Tab') {
                      e.preventDefault();
                      const textarea = e.target as HTMLTextAreaElement;
                      const start = textarea.selectionStart;
                      const end = textarea.selectionEnd;
                      const newContent = templateContent.substring(0, start) + '  ' + templateContent.substring(end);
                      setTemplateContent(newContent);
                      setTimeout(() => {
                        textarea.setSelectionRange(start + 2, start + 2);
                      }, 0);
                    }
                  }}
                  className="w-full h-[600px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Start typing your contract template. Use Insert Smart Field to add dynamic data..."
                />
              ) : (
                <div
                  ref={editorRef}
                  contentEditable
                  onInput={handleEditorInput}
                  onClick={handleEditorClick}
                  onKeyDown={(e) => {
                    // Prevent smart fields from being edited
                    const selection = window.getSelection();
                    if (selection && selection.rangeCount > 0) {
                      const range = selection.getRangeAt(0);
                      const parent = range.commonAncestorContainer.parentElement;
                      if (parent?.classList.contains('smart-field')) {
                        if (e.key !== 'Delete' && e.key !== 'Backspace') {
                          e.preventDefault();
                          // Move cursor after smart field
                          range.setStartAfter(parent);
                          range.collapse(true);
                          selection.removeAllRanges();
                          selection.addRange(range);
                        }
                      }
                    }
                  }}
                  className="w-full h-[600px] px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 overflow-y-auto prose prose-sm max-w-none dark:prose-invert"
                  style={{ whiteSpace: 'pre-wrap', minHeight: '600px' }}
                  dangerouslySetInnerHTML={{ __html: highlightSmartFields(templateContent || '') }}
                  suppressContentEditableWarning
                />
              )}
            </div>

            {/* Smart Field Configuration Panel */}
            {showConfigPanel && selectedSmartField && (
              <div className="w-1/3 border-l border-gray-200 dark:border-gray-700 pl-6">
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sticky top-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Settings className="w-5 h-5 text-purple-600" />
                      Smart Field Config
                    </h3>
                    <button
                      onClick={() => {
                        setShowConfigPanel(false);
                        setSelectedSmartField(null);
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Field Info */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Field Name
                      </label>
                      <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-2 font-mono text-sm text-purple-600 dark:text-purple-400">
                        {selectedSmartField.id}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Label
                      </label>
                      <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-2 text-sm">
                        {selectedSmartField.label}
                      </div>
                    </div>

                    {/* Data Source Mapping */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Data Source
                      </label>
                      <select
                        value={selectedSmartField.source}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                        disabled
                      >
                        <option>{selectedSmartField.source}</option>
                      </select>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Automatically mapped to: {selectedSmartField.source}
                      </p>
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Category
                      </label>
                      <div className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded p-2 text-sm">
                        {selectedSmartField.category}
                      </div>
                    </div>

                    {/* Preview */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Preview Value
                      </label>
                      {selectedSmartField.id === '{{signature_area}}' ? (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded p-4 text-center">
                          <div className="text-blue-700 dark:text-blue-300 font-semibold mb-1">📝 Signature Area</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">Client will sign here</div>
                          <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
                            Signature line
                          </div>
                        </div>
                      ) : (
                        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded p-3 text-sm">
                          <span className="text-purple-700 dark:text-purple-300 font-medium">
                            {selectedSmartField.placeholder}
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {selectedSmartField.id === '{{signature_area}}' 
                          ? 'This will be replaced with the signature component when the contract is signed'
                          : 'This is how it will appear in preview mode'}
                      </p>
                    </div>

                    {/* Special Instructions for Signature Area */}
                    {selectedSmartField.id === '{{signature_area}}' && (
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3">
                        <p className="text-xs text-green-800 dark:text-green-200 font-semibold mb-1">
                          💡 How Signature Areas Work:
                        </p>
                        <ul className="text-xs text-green-700 dark:text-green-300 space-y-1 list-disc list-inside">
                          <li>Replaced with SignatureCapture component when signing</li>
                          <li>Client can draw or type their signature</li>
                          <li>Saved as image data when contract is signed</li>
                          <li>Multiple signature areas can be added if needed</li>
                        </ul>
                      </div>
                    )}

                    {/* Instructions */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3">
                      <p className="text-xs text-blue-800 dark:text-blue-200">
                        <strong>Tip:</strong> Click anywhere in the editor to edit this field, or click on another smart field to configure it.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-2">How to use the Contract Template Editor:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-semibold mb-1 text-blue-900 dark:text-blue-100">Rich Text Formatting:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300 text-xs">
                    <li>Use formatting buttons for <strong>Bold</strong>, <em>Italic</em>, Underline</li>
                    <li>Create lists and align text</li>
                    <li>Toggle between Rich Text and HTML modes</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-1 text-blue-900 dark:text-blue-100">Smart Fields & Signatures:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300 text-xs">
                    <li>Click "Insert Smart Field" to add dynamic data</li>
                    <li>Click "Add Signature Area" to insert a signature field</li>
                    <li>Click any highlighted smart field to configure it</li>
                    <li>Smart fields appear highlighted (purple) for easy identification</li>
                    <li>Signature areas appear highlighted in blue</li>
                    <li>Use Preview to see how the contract will look</li>
                  </ul>
                </div>
              </div>
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
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      {template.name}
                      {template.is_default && (
                        <span title="Default Template">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        </span>
                      )}
                    </h3>
                    {template.is_default && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        Default
                      </span>
                    )}
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
                  {!template.is_default && (
                    <button
                      onClick={() => handleSetDefault(template)}
                      className="p-2 text-gray-600 hover:text-yellow-600 dark:text-gray-400 dark:hover:text-yellow-400 transition-colors"
                      title="Set as Default"
                    >
                      <Star className="w-4 h-4" />
                    </button>
                  )}
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


