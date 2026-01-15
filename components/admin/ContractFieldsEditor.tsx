import React, { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { isAdminEmail } from '@/utils/auth-helpers/admin-roles';
import { 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  X,
  Calendar,
  DollarSign,
  MapPin,
  User,
  FileText,
  Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ContractFields {
  event_name: string;
  event_date: string;
  event_type: string;
  event_time: string;
  end_time: string;
  venue_name: string;
  venue_address: string;
  guest_count: number | null;
  total_amount: number | null;
  deposit_amount: number | null;
  contract_number: string;
}

interface ContractFieldsEditorProps {
  contractId: string;
  contractData: ContractFields;
  onUpdate: (updatedFields: Partial<ContractFields>) => Promise<void>;
  focusedField?: string;
  onFieldClick?: (fieldKey: string) => void;
}

export default function ContractFieldsEditor({ 
  contractId, 
  contractData, 
  onUpdate,
  focusedField,
  onFieldClick
}: ContractFieldsEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fields, setFields] = useState<ContractFields>(contractData);
  const [hasChanges, setHasChanges] = useState(false);
  const focusedFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    setFields(contractData);
    setHasChanges(false);
  }, [contractData]);

  useEffect(() => {
    if (focusedField) {
      // Open sidebar if closed
      if (!isOpen) {
        setIsOpen(true);
      }
      // Expand sidebar if minimized
      if (isMinimized) {
        setIsMinimized(false);
      }
      // Focus the field after a short delay to ensure DOM is ready
      setTimeout(() => {
        if (focusedFieldRef.current) {
          focusedFieldRef.current.focus();
          focusedFieldRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [focusedField, isOpen, isMinimized]);

  const checkAdminStatus = async () => {
    try {
      const supabase = createClientComponentClient();
      const { data: { user } } = await supabase.auth.getUser();
      const admin = await isAdminEmail(user?.email);
      setIsAdmin(admin);
      setLoading(false);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      setLoading(false);
    }
  };

  const handleFieldChange = (key: keyof ContractFields, value: string | number | null) => {
    setFields(prev => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!hasChanges) return;
    
    setSaving(true);
    try {
      await onUpdate(fields);
      setHasChanges(false);
    } catch (error) {
      console.error('Error saving fields:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFields(contractData);
    setHasChanges(false);
  };

  if (loading) return null;
  if (!isAdmin) return null;

  type FieldDefinition = {
    key: keyof ContractFields;
    label: string;
    type: string;
    readOnly?: boolean;
    prefix?: string;
  };

  const fieldGroups: Array<{
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    fields: FieldDefinition[];
  }> = [
    {
      title: 'Event Details',
      icon: Calendar,
      fields: [
        { key: 'event_name' as const, label: 'Event Name', type: 'text' },
        { key: 'event_date' as const, label: 'Event Date', type: 'date' },
        { key: 'event_type' as const, label: 'Event Type', type: 'text' },
        { key: 'event_time' as const, label: 'Start Time', type: 'time' },
        { key: 'end_time' as const, label: 'End Time', type: 'time' },
        { key: 'venue_name' as const, label: 'Venue Name', type: 'text' },
        { key: 'venue_address' as const, label: 'Venue Address', type: 'text' },
        { key: 'guest_count' as const, label: 'Guest Count', type: 'number' },
      ]
    },
    {
      title: 'Payment Details',
      icon: DollarSign,
      fields: [
        { key: 'total_amount' as const, label: 'Total Amount', type: 'number', prefix: '$' },
        { key: 'deposit_amount' as const, label: 'Deposit Amount', type: 'number', prefix: '$' },
      ]
    },
    {
      title: 'Contract Info',
      icon: FileText,
      fields: [
        { key: 'contract_number' as const, label: 'Contract Number', type: 'text', readOnly: true },
      ]
    }
  ];

  return (
    <>
      {/* Toggle Button - Always visible when minimized or closed - Mobile Optimized */}
      {(!isOpen || isMinimized) && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="fixed bottom-28 right-4 sm:top-4 sm:bottom-auto z-40 w-12 h-12 sm:w-auto sm:h-auto sm:p-2 bg-black text-white rounded-full sm:rounded-lg shadow-lg hover:bg-gray-800 active:bg-gray-900 transition-colors flex items-center justify-center touch-manipulation"
          title="Open Contract Fields Editor"
        >
          <Settings className="w-5 h-5 sm:w-5 sm:h-5" />
        </button>
      )}

      {/* Sidebar - Mobile Optimized */}
      {isOpen && (
        <div
          className={`fixed right-0 top-0 h-full bg-white border-l border-gray-300 shadow-xl z-50 transition-all duration-300 ${
            isMinimized ? 'w-16' : 'w-full sm:w-96'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-gray-50">
            {!isMinimized && (
              <>
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-black" />
                  <h2 className="text-lg font-semibold text-black">Contract Fields</h2>
                </div>
                <div className="flex items-center gap-2">
                  {hasChanges && (
                    <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                      Unsaved
                    </span>
                  )}
                  <button
                    onClick={() => setIsMinimized(true)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="Minimize"
                  >
                    <ChevronRight className="w-4 h-4 text-black" />
                  </button>
                  <button
                    onClick={() => {
                      if (hasChanges && !confirm('You have unsaved changes. Close anyway?')) {
                        return;
                      }
                      setIsOpen(false);
                      handleCancel();
                    }}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="Close"
                  >
                    <X className="w-4 h-4 text-black" />
                  </button>
                </div>
              </>
            )}
            {isMinimized && (
              <div className="flex flex-col items-center gap-2 w-full">
                <button
                  onClick={() => setIsMinimized(false)}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Expand"
                >
                  <ChevronLeft className="w-4 h-4 text-black" />
                </button>
                <button
                  onClick={() => {
                    if (hasChanges && !confirm('You have unsaved changes. Close anyway?')) {
                      return;
                    }
                    setIsOpen(false);
                    handleCancel();
                  }}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4 text-black" />
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          {!isMinimized && (
            <div className="h-[calc(100vh-80px)] overflow-y-auto p-4 space-y-6">
              {fieldGroups.map((group) => (
                <div key={group.title} className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                    <group.icon className="w-4 h-4 text-black" />
                    <h3 className="text-sm font-semibold text-black">{group.title}</h3>
                  </div>
                  <div className="space-y-3">
                    {group.fields.map((field) => (
                      <div key={field.key} className="space-y-1">
                        <Label htmlFor={field.key} className="text-xs text-gray-700">
                          {field.label}
                        </Label>
                        <Input
                          ref={focusedField === field.key ? focusedFieldRef : undefined}
                          id={field.key}
                          type={field.type}
                          value={fields[field.key] ?? ''}
                          onChange={(e) => {
                            const value = field.type === 'number' 
                              ? (e.target.value === '' ? null : parseFloat(e.target.value))
                              : e.target.value;
                            handleFieldChange(field.key, value);
                          }}
                          readOnly={field.readOnly ?? false}
                          disabled={field.readOnly ?? false}
                          className={`text-sm ${field.readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                          placeholder={field.label}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Action Buttons */}
              {hasChanges && (
                <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-4 pb-2 flex gap-2">
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    className="flex-1"
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="flex-1 bg-black hover:bg-gray-800"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Minimized Icons */}
          {isMinimized && (
            <div className="h-[calc(100vh-80px)] overflow-y-auto p-2 space-y-2">
              {fieldGroups.map((group) => (
                <button
                  key={group.title}
                  onClick={() => setIsMinimized(false)}
                  className="w-full p-2 hover:bg-gray-100 rounded transition-colors"
                  title={group.title}
                >
                  <group.icon className="w-5 h-5 text-black mx-auto" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

// Simple loader component
const Loader = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);
