/**
 * Individual Invoice Detail Page
 * View and manage a specific invoice
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@/utils/supabase/client';
import { 
  ArrowLeft,
  Download,
  Mail,
  Printer,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  User,
  Calendar,
  MapPin,
  DollarSign,
  CreditCard,
  Plus,
  X,
  Eye,
  Send,
  TestTube
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/Toasts/use-toast';
import Link from 'next/link';
import PaymentPlanConfig from '@/components/admin/PaymentPlanConfig';
import { getPackageLineItemsFromQuote, calculateQuoteTotals } from '@/utils/quote-calculations';
import InvoiceEmailActions from '@/components/admin/InvoiceEmailActions';

interface InvoiceDetail {
  id: string;
  invoice_number: string;
  invoice_status: string;
  invoice_title: string;
  invoice_date: string;
  due_date: string;
  issue_date: string;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  subtotal: number;
  tax_amount: number;
  contact_id: string;
  first_name: string;
  last_name: string;
  email_address: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  event_type: string;
  event_date: string;
  venue_name: string;
  project_id: string;
  project_name: string;
  payment_count: number;
  last_payment_date: string;
  days_overdue: number;
  notes: string;
}

interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  item_type: string;
  notes: string;
}

interface Payment {
  id: string;
  payment_date: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  transaction_id: string;
  notes: string;
}

interface QuoteData {
  id: string;
  package_id: string;
  package_name: string;
  package_price: number;
  total_price: number;
  addons: any[];
  custom_line_items: any[];
  custom_addons: any[];
  discount_type: string | null;
  discount_value: number | null;
  discount_note: string | null;
  show_line_item_prices: boolean;
  payment_terms_type: string | null;
  number_of_payments: number | null;
  payment_schedule: any[];
  due_date_type: string | null;
  deposit_due_date: string | null;
  remaining_balance_due_date: string | null;
  speaker_rental?: any;
}

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email_address: string;
  event_type: string;
  event_date?: string | null;
  organization_id?: string | null;
}

interface Event {
  id: string;
  event_name: string;
  client_name: string;
  client_email?: string;
  event_date: string;
  contact_id?: string;
  submission_id?: string;
}

function CreateInvoiceForm({ router, supabase }: { router: any; supabase: any }) {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const [creatingContact, setCreatingContact] = useState(false);
  const [newContactForm, setNewContactForm] = useState({
    first_name: '',
    last_name: '',
    email_address: '',
    phone: '',
    event_type: 'wedding',
    event_date: '',
    venue_name: '',
    notes: ''
  });
  const isMountedRef = useRef(true);
  
  // Get contactId from router query params
  const contactIdFromQuery = router.query?.contactId as string | undefined;
  const [formData, setFormData] = useState({
    contactId: '',
    projectId: '',
    invoiceTitle: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: (() => {
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date.toISOString().split('T')[0];
    })(),
    subtotal: '',
    taxRate: '',
    taxAmount: '',
    discountType: 'percentage' as 'percentage' | 'flat' | '',
    discountValue: '',
    discountAmount: '',
    paymentTerms: 'Net 30',
    lateFeePercentage: '',
    depositAmount: '',
    notes: '',
    internalNotes: ''
  });
  const [paymentPlan, setPaymentPlan] = useState<any>(null);
  const [lineItems, setLineItems] = useState<Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    source?: 'package' | 'addon' | 'custom'; // Track where the item came from
    selectedItemId?: string; // Track which package/addon was selected
  }>>([{
    description: '',
    quantity: 1,
    rate: 0,
    amount: 0,
    source: 'custom'
  }]);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<Array<{
    id: string;
    name: string;
    price: number;
    description?: string;
    type: 'package' | 'addon';
    breakdown?: Array<{ item: string; description: string; price: number }>;
  }>>([]);
  const [showAutocomplete, setShowAutocomplete] = useState<number | null>(null); // Track which line item is showing autocomplete
  const [packages, setPackages] = useState<Array<{
    id: string;
    name: string;
    price: number;
    breakdown: Array<{ item: string; description: string; price: number }>;
  }>>([]);
  const [addons, setAddons] = useState<Array<{
    id: string;
    name: string;
    price: number;
    description: string;
  }>>([]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchData();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.autocomplete-container')) {
        setShowAutocomplete(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Set contactId when router query becomes available
  useEffect(() => {
    if (contactIdFromQuery && contactIdFromQuery !== formData.contactId) {
      console.log('[Invoice Form] Setting contactId from router query:', contactIdFromQuery);
      setFormData(prev => ({ ...prev, contactId: contactIdFromQuery }));
    }
  }, [contactIdFromQuery, formData.contactId]);

  // Refetch events when contact is selected to find their specific events
  useEffect(() => {
    if (formData.contactId && selectedContact) {
      fetchEventsForContact(formData.contactId, selectedContact);
    }
  }, [formData.contactId]);

  // Update due date when contact is selected (use contact's event_date if available)
  useEffect(() => {
    if (formData.contactId && !formData.projectId) {
      const contact = contacts.find(c => c.id === formData.contactId);
      // Only update if no event is selected and contact has event_date
      if (contact?.event_date) {
        setFormData(prev => ({ ...prev, dueDate: contact.event_date! }));
      }
    }
  }, [formData.contactId, formData.projectId, contacts]);

  // Update due date when event is selected (default to event date - takes precedence)
  useEffect(() => {
    if (formData.projectId && events.length > 0) {
      const selectedEvent = events.find(e => e.id === formData.projectId);
      if (selectedEvent?.event_date) {
        setFormData(prev => ({ ...prev, dueDate: selectedEvent.event_date }));
      }
    }
  }, [formData.projectId, events]);

  // Calculate subtotal, tax, discount, and total from line items
  useEffect(() => {
    const subtotal = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    const taxRate = parseFloat(formData.taxRate) || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const discountType = formData.discountType;
    const discountValue = parseFloat(formData.discountValue) || 0;
    let discountAmount = 0;
    
    if (discountType === 'percentage' && discountValue > 0) {
      discountAmount = subtotal * (discountValue / 100);
    } else if (discountType === 'flat' && discountValue > 0) {
      discountAmount = discountValue;
    }
    
    setFormData(prev => ({
      ...prev,
      subtotal: subtotal.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      discountAmount: discountAmount.toFixed(2)
    }));
  }, [lineItems, formData.taxRate, formData.discountType, formData.discountValue]);

  // Add line item
  const addLineItem = () => {
    setLineItems(prev => [...prev, {
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0,
      source: 'custom' as const
    }]);
  };

  // Handle package selection - expands package into multiple line items
  const handlePackageSelect = (packageId: string, index: number) => {
    const selectedPackage = packages.find(p => p.id === packageId);
    if (!selectedPackage) return;

    // If package has breakdown, add each item as a separate line item
    if (selectedPackage.breakdown && selectedPackage.breakdown.length > 0) {
      const newItems = selectedPackage.breakdown.map(item => ({
        description: `${item.item}${item.description ? ` - ${item.description}` : ''}`,
        quantity: 1,
        rate: item.price || 0,
        amount: item.price || 0,
        source: 'package' as const,
        selectedItemId: packageId
      }));

      // Replace current item and add the rest
      setLineItems(prev => {
        const updated = [...prev];
        updated[index] = newItems[0];
        // Insert remaining items after current index
        newItems.slice(1).forEach((item, i) => {
          updated.splice(index + i + 1, 0, item);
        });
        return updated;
      });
    } else {
      // No breakdown, just use package name and price
      setLineItems(prev => {
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          description: selectedPackage.name,
          rate: selectedPackage.price,
          amount: selectedPackage.price,
          source: 'package',
          selectedItemId: packageId
        };
        return updated;
      });
    }
  };

  // Handle addon selection - populates single line item
  const handleAddonSelect = (addonId: string, index: number) => {
    const selectedAddon = addons.find(a => a.id === addonId);
    if (!selectedAddon) return;

    setLineItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        description: selectedAddon.name, // Just the name, not the description
        rate: selectedAddon.price,
        amount: selectedAddon.price,
        source: 'addon',
        selectedItemId: addonId
      };
      return updated;
    });
    setShowAutocomplete(null); // Close autocomplete
  };

  // Search packages and addons for autocomplete
  const searchItems = (query: string): Array<{
    id: string;
    name: string;
    price: number;
    description?: string;
    type: 'package' | 'addon';
    breakdown?: Array<{ item: string; description: string; price: number }>;
  }> => {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const normalizedQuery = query.toLowerCase().trim();
    const results: Array<{
      id: string;
      name: string;
      price: number;
      description?: string;
      type: 'package' | 'addon';
      breakdown?: Array<{ item: string; description: string; price: number }>;
      score: number; // Add score for sorting
    }> = [];

    // Search packages
    packages.forEach(pkg => {
      const nameLower = pkg.name.toLowerCase();
      let score = 0;
      
      // Exact match gets highest score
      if (nameLower === normalizedQuery) {
        score = 100;
      } else if (nameLower.startsWith(normalizedQuery)) {
        score = 80;
      } else if (nameLower.includes(normalizedQuery)) {
        score = 60;
      }
      
      // Also check if query matches "package" + number pattern
      const packageNumMatch = nameLower.match(/package\s*(\d+)/);
      const queryNumMatch = normalizedQuery.match(/(\d+)/);
      if (packageNumMatch && queryNumMatch && packageNumMatch[1] === queryNumMatch[1]) {
        score = Math.max(score, 70);
      }

      if (score > 0) {
        results.push({
          id: pkg.id,
          name: pkg.name,
          price: pkg.price,
          type: 'package',
          breakdown: pkg.breakdown,
          score
        });
      }
    });

    // Search addons
    console.log('[Invoice Form] Searching addons:', {
      addonsCount: addons.length,
      query: normalizedQuery,
      addons: addons.map(a => ({ id: a.id, name: a.name }))
    });
    
    addons.forEach(addon => {
      if (!addon || !addon.name) {
        console.warn('[Invoice Form] Invalid addon:', addon);
        return;
      }
      
      const nameLower = addon.name.toLowerCase();
      const descLower = (addon.description || '').toLowerCase();
      let score = 0;
      
      // Exact match gets highest score
      if (nameLower === normalizedQuery) {
        score = 100;
      } else if (nameLower.startsWith(normalizedQuery)) {
        score = 80;
      } else if (nameLower.includes(normalizedQuery)) {
        score = 60;
      } else if (descLower.includes(normalizedQuery)) {
        score = 40;
      }

      if (score > 0) {
        console.log('[Invoice Form] Addon match found:', {
          name: addon.name,
          score,
          query: normalizedQuery
        });
        results.push({
          id: addon.id || `addon-${addon.name}`,
          name: addon.name,
          price: addon.price,
          description: addon.description,
          type: 'addon',
          score
        });
      }
    });

    // Sort by score (highest first), then alphabetically
    return results
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
      })
      .map(({ score, ...item }) => item); // Remove score from final result
  };

  // Handle description input change with autocomplete
  const handleDescriptionChange = (index: number, value: string) => {
    updateLineItem(index, 'description', value);
    
    // Show autocomplete if there are matches
    if (value.trim().length > 0) {
      const suggestions = searchItems(value);
      console.log('[Invoice Form] Search query:', value, 'Found suggestions:', suggestions.length, 'Packages:', packages.length, 'Addons:', addons.length);
      setAutocompleteSuggestions(suggestions);
      setShowAutocomplete(suggestions.length > 0 ? index : null);
    } else {
      setShowAutocomplete(null);
      setAutocompleteSuggestions([]);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: {
    id: string;
    name: string;
    price: number;
    description?: string;
    type: 'package' | 'addon';
    breakdown?: Array<{ item: string; description: string; price: number }>;
  }, index: number) => {
    if (suggestion.type === 'package') {
      handlePackageSelect(suggestion.id, index);
    } else {
      handleAddonSelect(suggestion.id, index);
    }
    setShowAutocomplete(null);
    setAutocompleteSuggestions([]);
  };

  // Remove line item
  const removeLineItem = (index: number) => {
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  // Update line item
  const updateLineItem = (index: number, field: string, value: string | number) => {
    setLineItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value } as any;
      // Recalculate amount if quantity or rate changed
      if (field === 'quantity' || field === 'rate') {
        updated[index].amount = (updated[index].quantity || 0) * (updated[index].rate || 0);
      }
      // If description is manually edited, mark as custom
      if (field === 'description' && updated[index].source !== 'custom') {
        updated[index].source = 'custom';
      }
      return updated;
    });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch contacts using API route to handle RLS properly
      let contactsData: Contact[] = [];
      try {
        const contactsResponse = await fetch('/api/get-contacts?limit=200');
        if (contactsResponse.ok) {
          const contactsResult = await contactsResponse.json();
          contactsData = contactsResult.contacts || [];
          console.log('[Invoice Form] Loaded contacts:', contactsData.length);
        } else {
          console.error('[Invoice Form] Failed to fetch contacts:', contactsResponse.status);
          // Fallback to direct query
          const { data, error } = await supabase
            .from('contacts')
            .select('id, first_name, last_name, email_address, event_type, event_date')
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(200);
          
          if (!error && data) {
            contactsData = data;
          } else if (error) {
            console.error('[Invoice Form] Direct contacts query error:', error);
          }
        }
      } catch (error) {
        console.error('[Invoice Form] Error fetching contacts:', error);
        // Fallback to direct query
        const { data, error: directError } = await supabase
          .from('contacts')
          .select('id, first_name, last_name, email_address, event_type, event_date')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(200);
        
        if (!directError && data) {
          contactsData = data;
        }
      }

      if (!isMountedRef.current) return;
      
      if (isMountedRef.current) {
        setContacts(contactsData);
      }

      // Fetch events with all linking fields
      // Order by created_at to catch recently created events from imports
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, event_name, client_name, client_email, event_date, contact_id, submission_id, created_at')
        .order('created_at', { ascending: false })
        .limit(200); // Increased limit to catch more events

      if (!isMountedRef.current) return;

      if (eventsError) {
        // Handle AbortError gracefully
        if (eventsError.name === 'AbortError' || eventsError.message?.includes('aborted')) {
          return;
        }
        throw eventsError;
      }
      
      if (isMountedRef.current) {
        setEvents(eventsData || []);
      }

      // Fetch pricing config for packages and addons
      // Use API route to bypass RLS restrictions
      let pricingConfig = null;
      try {
        const pricingResponse = await fetch('/api/admin/pricing');
        if (pricingResponse.ok) {
          pricingConfig = await pricingResponse.json();
          console.log('[Invoice Form] Loaded pricing config:', {
            hasPackages: !!(pricingConfig.package1_price || pricingConfig.package2_price || pricingConfig.package3_price),
            hasAddons: Array.isArray(pricingConfig.addons) && pricingConfig.addons.length > 0,
            package1Breakdown: pricingConfig.package1_breakdown?.length || 0,
            package2Breakdown: pricingConfig.package2_breakdown?.length || 0,
            package3Breakdown: pricingConfig.package3_breakdown?.length || 0,
            addonsCount: pricingConfig.addons?.length || 0
          });
        } else {
          console.warn('[Invoice Form] Failed to fetch pricing config:', pricingResponse.status);
        }
      } catch (error) {
        console.error('[Invoice Form] Error fetching pricing config:', error);
      }

      if (!isMountedRef.current) return;

      if (pricingConfig) {
        // Build packages array from pricing config
        const packagesList: Array<{
          id: string;
          name: string;
          price: number;
          breakdown: Array<{ item: string; description: string; price: number }>;
        }> = [];

        // Package 1
        if (pricingConfig.package1_price) {
          const breakdown = (pricingConfig.package1_breakdown as any) || [];
          packagesList.push({
            id: 'package1',
            name: 'Package 1',
            price: parseFloat(pricingConfig.package1_price),
            breakdown: Array.isArray(breakdown) ? breakdown : []
          });
        }

        // Package 2
        if (pricingConfig.package2_price) {
          const breakdown = (pricingConfig.package2_breakdown as any) || [];
          packagesList.push({
            id: 'package2',
            name: 'Package 2',
            price: parseFloat(pricingConfig.package2_price),
            breakdown: Array.isArray(breakdown) ? breakdown : []
          });
        }

        // Package 3
        if (pricingConfig.package3_price) {
          const breakdown = (pricingConfig.package3_breakdown as any) || [];
          packagesList.push({
            id: 'package3',
            name: 'Package 3',
            price: parseFloat(pricingConfig.package3_price),
            breakdown: Array.isArray(breakdown) ? breakdown : []
          });
        }

        if (isMountedRef.current) {
          setPackages(packagesList);
        }

        // Build addons array - ensure each addon has an id
        // Use default addons if database is empty
        const addonsList = (pricingConfig.addons as any) || [];
        const defaultAddons = [
          { id: 'dj_mc_4hours', name: 'Up to 4 Hours DJ/MC Services (A La Carte)', description: 'Professional DJ and MC services for up to 4 hours. Includes sound system, microphones, and music library. Perfect for receptions.', price: 1600 },
          { id: 'dj_mc_3hours', name: 'Up to 3 Hours DJ/MC Services (A La Carte)', description: 'Professional DJ and MC services for up to 3 hours. Includes sound system, microphones, and music library.', price: 1300 },
          { id: 'ceremony_audio', name: 'Ceremony Audio', description: 'Additional hour of DJ services + ceremony music programming. Perfect for couples who want professional audio for their ceremony.', price: 500 },
          { id: 'dance_floor_lighting', name: 'Dance Floor Lighting', description: 'Multi-color LED fixtures for lighting the dance floor, audience, and/or performer. Creates an energetic atmosphere.', price: 400 },
          { id: 'uplighting', name: 'Uplighting (16 fixtures)', description: 'Up to 16 multicolor LED fixtures to enhance your venue ambiance. Perfect for creating a romantic or energetic atmosphere.', price: 350 },
          { id: 'monogram', name: 'Monogram Projection', description: 'A custom graphic showing the names or initials of newlyweds. The font and look is fully customizable to fit clients needs. Monograms can be projected on any floor or wall.', price: 350 },
          { id: 'speaker_rental', name: 'Speaker Rental (Basic Setup)', description: 'Professional speaker system rental with built-in mixer. Perfect for cocktail hours, ceremonies, or separate areas. Includes microphone input.', price: 250 },
          { id: 'additional_speaker', name: 'Cocktail Hour Audio', description: 'Extra powered speaker with built-in mixer for microphone or auxiliary inputs. Perfect for cocktail hours that are separate from the reception.', price: 250 },
          { id: 'additional_hour', name: 'Additional Hour(s)', description: 'Additional DJ/MC services beyond the package hours. Perfect for extended receptions or events.', price: 400 },
          { id: 'dancing_on_clouds', name: 'Dancing on the Clouds', description: 'Sophisticated dry ice effect for first dance and special moments. Creates a magical, floor-hugging cloud effect.', price: 500 }
        ];
        
        // Use database addons if available, otherwise use defaults
        const finalAddonsList = (Array.isArray(addonsList) && addonsList.length > 0) ? addonsList : defaultAddons;
        
        if (isMountedRef.current) {
          // Ensure each addon has an id (use existing id or generate from name)
          const addonsWithIds = finalAddonsList.map((addon: any, index: number) => ({
            id: addon.id || `addon-${index}` || addon.name?.toLowerCase().replace(/\s+/g, '_') || `addon_${index}`,
            name: addon.name || '',
            price: typeof addon.price === 'number' ? addon.price : parseFloat(addon.price) || 0,
            description: addon.description || ''
          }));
          setAddons(addonsWithIds);
          console.log('[Invoice Form] Set addons:', addonsWithIds.length, addonsWithIds.length > 0 ? '(using ' + (Array.isArray(addonsList) && addonsList.length > 0 ? 'database' : 'default') + ' addons)' : '(empty)', addonsWithIds);
        }
      }

      // Set contactId from query params (use router.query for Next.js)
      if (isMountedRef.current && contactIdFromQuery) {
        console.log('[Invoice Form] Setting contactId from query:', contactIdFromQuery);
        setFormData(prev => ({ ...prev, contactId: contactIdFromQuery }));
      }
    } catch (error: any) {
      // Handle AbortError gracefully - don't log or show error
      if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
        return;
      }
      console.error('Error fetching data:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  // Fetch events specifically for a selected contact
  const fetchEventsForContact = async (contactId: string, contact: Contact) => {
    try {
      const allEvents: Event[] = [];
      
      // Query 1: By contact_id (most reliable)
      const { data: byContactId, error: contactIdError } = await supabase
        .from('events')
        .select('id, event_name, client_name, client_email, event_date, contact_id, submission_id, created_at')
        .eq('contact_id', contactId);
      
      if (!contactIdError && byContactId) {
        allEvents.push(...byContactId);
        console.log(`📅 Found ${byContactId.length} event(s) by contact_id for ${contact.first_name} ${contact.last_name}`);
      }
      
      // Query 2: By email (if contact has email)
      if (contact.email_address) {
        const { data: byEmail, error: emailError } = await supabase
          .from('events')
          .select('id, event_name, client_name, client_email, event_date, contact_id, submission_id, created_at')
          .eq('client_email', contact.email_address.toLowerCase().trim());
        
        if (!emailError && byEmail) {
          allEvents.push(...byEmail);
          console.log(`📧 Found ${byEmail.length} event(s) by email (${contact.email_address}) for ${contact.first_name} ${contact.last_name}`);
        }
      }
      
      // Query 3: By submission_id (legacy)
      const { data: bySubmissionId, error: submissionError } = await supabase
        .from('events')
        .select('id, event_name, client_name, client_email, event_date, contact_id, submission_id, created_at')
        .eq('submission_id', contactId);
      
      if (!submissionError && bySubmissionId) {
        allEvents.push(...bySubmissionId);
        console.log(`📝 Found ${bySubmissionId.length} event(s) by submission_id for ${contact.first_name} ${contact.last_name}`);
      }
      
      // Deduplicate by event ID
      const uniqueEvents = Array.from(
        new Map(allEvents.map(e => [e.id, e])).values()
      );
      
      if (isMountedRef.current) {
        // Merge with existing events, prioritizing the contact-specific ones
        setEvents(prev => {
          const existingIds = new Set(prev.map(e => e.id));
          const newEvents = uniqueEvents.filter(e => !existingIds.has(e.id));
          return [...uniqueEvents, ...prev.filter(e => !uniqueEvents.some(ue => ue.id === e.id))];
        });
        console.log(`✅ Total unique events for ${contact.first_name} ${contact.last_name}: ${uniqueEvents.length}`);
      }
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        console.error('Error fetching events for contact:', error);
      }
    }
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingContact(true);

    try {
      const response = await fetch('/api/contacts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newContactForm)
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.details 
          ? `${data.error}: ${data.details}` 
          : data.error || 'Failed to create contact';
        throw new Error(errorMessage);
      }

      // Add the new contact to the list
      const newContact: Contact = {
        id: data.contact.id,
        first_name: data.contact.first_name,
        last_name: data.contact.last_name,
        email_address: data.contact.email_address || '',
        event_type: data.contact.event_type || 'other',
        event_date: data.contact.event_date || null,
        organization_id: data.contact.organization_id || null
      };

      setContacts(prev => [newContact, ...prev]);
      
      // Select the new contact
      setFormData(prev => ({ ...prev, contactId: newContact.id, projectId: '' }));

      // Reset form and close modal
      setNewContactForm({
        first_name: '',
        last_name: '',
        email_address: '',
        phone: '',
        event_type: 'wedding',
        event_date: '',
        venue_name: '',
        notes: ''
      });
      setShowNewContactModal(false);
    } catch (error: any) {
      console.error('Error creating contact:', error);
      const errorMessage = error.message || 'Failed to create contact';
      alert(errorMessage);
    } finally {
      setCreatingContact(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const subtotal = parseFloat(formData.subtotal) || 0;
      const taxRate = parseFloat(formData.taxRate) || null;
      const taxAmount = parseFloat(formData.taxAmount) || 0;
      const discountType = formData.discountType || null;
      const discountValue = formData.discountType ? parseFloat(formData.discountValue) || 0 : null;
      const discountAmount = parseFloat(formData.discountAmount) || 0;
      const totalAmount = subtotal + taxAmount - discountAmount;

      const response = await fetch('/api/invoices/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: formData.contactId,
          projectId: formData.projectId || null,
          invoiceTitle: formData.invoiceTitle || null,
          invoiceDate: formData.invoiceDate,
          dueDate: formData.dueDate,
          subtotal: subtotal,
          taxRate: taxRate,
          taxAmount: taxAmount,
          discountType: discountType,
          discountValue: discountValue,
          discountAmount: discountAmount,
          totalAmount: totalAmount,
          paymentTerms: formData.paymentTerms || null,
          lateFeePercentage: formData.lateFeePercentage ? parseFloat(formData.lateFeePercentage) : null,
          depositAmount: formData.depositAmount ? parseFloat(formData.depositAmount) : null,
          paymentPlan: paymentPlan, // Include payment plan
          lineItems: lineItems.length > 0 ? lineItems
            .filter(item => item.description.trim() !== '')
            .map(({ source, selectedItemId, ...item }) => item) : [], // Remove internal fields
          notes: formData.notes || null,
          internalNotes: formData.internalNotes || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.details 
          ? `${data.error}: ${data.details}` 
          : data.error || 'Failed to create invoice';
        throw new Error(errorMessage);
      }

      // Redirect to the new invoice
      router.push(`/admin/invoices/${data.invoice.id}`);
    } catch (error: any) {
      // Handle AbortError gracefully
      if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
        return; // Don't show error for aborted requests
      }
      console.error('Error creating invoice:', error);
      
      // Show user-friendly error message
      const errorMessage = error.message || 'Failed to create invoice';
      alert(errorMessage);
      
      // Log full error details for debugging
      if (error.message?.includes('Organization ID is required')) {
        const selectedContact = contacts.find(c => c.id === formData.contactId);
        console.error('⚠️ Organization ID missing. Contact organization_id:', selectedContact?.organization_id || 'N/A', 'Contact ID:', formData.contactId);
      }
    } finally {
      if (isMountedRef.current) {
        setSubmitting(false);
      }
    }
  };

  const selectedContact = contacts.find(c => c.id === formData.contactId);
  
  // Filter events by contact - check multiple linking methods
  // Events are linked via client_email, contact_id, or submission_id
  const filteredEvents = formData.contactId && selectedContact
    ? events.filter(e => {
        // Primary: Match by contact_id (most reliable)
        if (e.contact_id === formData.contactId) {
          console.log('✅ Matched event by contact_id:', e.id, e.event_name);
          return true;
        }
        // Secondary: Match by email (if contact has email) - case insensitive
        if (selectedContact.email_address) {
          const contactEmailLower = selectedContact.email_address.toLowerCase().trim();
          const eventEmailLower = e.client_email?.toLowerCase().trim();
          if (eventEmailLower && eventEmailLower === contactEmailLower) {
            console.log('✅ Matched event by email:', e.id, e.event_name, eventEmailLower);
            return true;
          }
        }
        // Tertiary: Match by submission_id if it matches contact id (legacy)
        if (e.submission_id === formData.contactId) {
          console.log('✅ Matched event by submission_id:', e.id, e.event_name);
          return true;
        }
        // Fallback: match by name (less reliable) - check if name contains contact name
        const contactFullName = `${selectedContact.first_name || ''} ${selectedContact.last_name || ''}`.trim().toLowerCase();
        if (contactFullName && e.client_name) {
          const eventNameLower = e.client_name.toLowerCase();
          // Check if event name starts with contact name or contains it
          if (eventNameLower.includes(contactFullName) || eventNameLower.startsWith(contactFullName.split(' ')[0])) {
            console.log('✅ Matched event by name:', e.id, e.event_name, 'contains', contactFullName);
            return true;
          }
        }
        return false;
      })
    : events;
  
  // Debug logging
  useEffect(() => {
    if (formData.contactId && selectedContact) {
      console.log('🔍 Event filtering debug:', {
        contactId: formData.contactId,
        contactEmail: selectedContact.email_address,
        contactName: `${selectedContact.first_name} ${selectedContact.last_name}`,
        totalEvents: events.length,
        filteredEvents: filteredEvents.length,
        events: events.map(e => ({
          id: e.id,
          name: e.event_name,
          client_email: e.client_email,
          contact_id: e.contact_id,
          submission_id: e.submission_id,
          client_name: e.client_name
        }))
      });
    }
  }, [formData.contactId, selectedContact, events, filteredEvents]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Button
            variant="slim"
            onClick={() => router.push('/admin/invoices')}
            className="flex items-center gap-2 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Invoices
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Create New Invoice</h1>
          <p className="text-gray-600 mt-2">Select a contact and event to create an invoice</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          {/* Contact Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                Contact <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowNewContactModal(true)}
                className="flex items-center gap-1 text-sm text-[#fcba00] hover:text-[#e5a800] font-medium"
              >
                <Plus className="h-4 w-4" />
                Add New Contact
              </button>
            </div>
            <select
              required
              value={formData.contactId}
              onChange={(e) => setFormData(prev => ({ ...prev, contactId: e.target.value, projectId: '' }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
            >
              <option value="">Select a contact...</option>
              {contacts.map(contact => (
                <option key={contact.id} value={contact.id}>
                  {contact.first_name} {contact.last_name} {contact.email_address ? `(${contact.email_address})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Event/Project Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Event/Project (Optional)
            </label>
            <select
              value={formData.projectId}
              onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
              disabled={!formData.contactId}
            >
              <option value="">No event selected</option>
              {filteredEvents.map(event => (
                <option key={event.id} value={event.id}>
                  {event.event_name || 'Untitled Event'} - {new Date(event.event_date).toLocaleDateString()}
                </option>
              ))}
            </select>
            {!formData.contactId && (
              <p className="text-sm text-gray-500 mt-1">Select a contact first to see their events</p>
            )}
          </div>

          {/* Invoice Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Invoice Title (Optional)
            </label>
            <input
              type="text"
              value={formData.invoiceTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, invoiceTitle: e.target.value }))}
              placeholder="Auto-generated if left blank"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
            />
          </div>

          {/* Invoice Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Invoice Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.invoiceDate}
                onChange={(e) => setFormData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
              />
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
              />
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                Line Items
              </label>
              <button
                type="button"
                onClick={addLineItem}
                className="flex items-center gap-1 text-sm text-[#fcba00] hover:text-[#e5a800] font-medium"
              >
                <Plus className="h-4 w-4" />
                Add Line Item
              </button>
            </div>
            
            {lineItems.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500 text-sm">No line items added yet</p>
                <p className="text-gray-400 text-xs mt-1">Click "Add Line Item" to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lineItems.map((item, index) => (
                  <div key={index} className="relative autocomplete-container">
                    <div className="grid grid-cols-12 gap-2 items-end p-3 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="col-span-5">
                        <label className="block text-xs text-gray-600 mb-1">Item Name</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleDescriptionChange(index, e.target.value)}
                            onFocus={() => {
                              if (item.description.trim().length > 0) {
                                const suggestions = searchItems(item.description);
                                setAutocompleteSuggestions(suggestions);
                                setShowAutocomplete(suggestions.length > 0 ? index : null);
                              }
                            }}
                            onBlur={() => {
                              // Delay closing to allow click on suggestion
                              setTimeout(() => setShowAutocomplete(null), 200);
                            }}
                            placeholder="Type item name (e.g., Package 1, Uplighting...)"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                          />
                          {/* Autocomplete Suggestions */}
                          {showAutocomplete === index && autocompleteSuggestions.length > 0 && (
                            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {autocompleteSuggestions.map((suggestion) => (
                                <button
                                  key={`${suggestion.type}-${suggestion.id}`}
                                  type="button"
                                  onClick={() => handleSuggestionSelect(suggestion, index)}
                                  className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">{suggestion.name}</p>
                                      {suggestion.description && (
                                        <p className="text-xs text-gray-500">{suggestion.description}</p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-500">
                                        {suggestion.type === 'package' ? 'Package' : 'Add-on'}
                                      </span>
                                      <span className="text-sm font-semibold text-gray-900">
                                        ${suggestion.price.toFixed(2)}
                                      </span>
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Quantity</label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Rate</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.rate}
                        onChange={(e) => updateLineItem(index, 'rate', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.amount.toFixed(2)}
                        readOnly
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-gray-100"
                      />
                    </div>
                    <div className="col-span-1">
                      <button
                        type="button"
                        onClick={() => removeLineItem(index)}
                        className="w-full h-10 flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50 rounded border border-red-200"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Totals Display */}
            <div className="mt-4 flex justify-end">
              <div className="w-80 space-y-2">
                <div className="flex justify-between items-center py-2 border-t border-gray-300">
                  <span className="text-sm font-semibold text-gray-700">Subtotal:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    ${parseFloat(formData.subtotal || '0').toFixed(2)}
                  </span>
                </div>
                
                {/* Tax */}
                {(parseFloat(formData.taxRate) || 0) > 0 && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600">
                      Tax ({formData.taxRate}%):
                    </span>
                    <span className="text-sm text-gray-700">
                      ${parseFloat(formData.taxAmount || '0').toFixed(2)}
                    </span>
                  </div>
                )}
                
                {/* Discount */}
                {formData.discountType && parseFloat(formData.discountValue || '0') > 0 && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600">
                      Discount {formData.discountType === 'percentage' ? `(${formData.discountValue}%)` : '(Flat)'}:
                    </span>
                    <span className="text-sm text-red-600">
                      -${parseFloat(formData.discountAmount || '0').toFixed(2)}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center py-2 border-t-2 border-gray-400">
                  <span className="text-lg font-bold text-gray-900">Total:</span>
                  <span className="text-xl font-bold text-gray-900">
                    ${(parseFloat(formData.subtotal || '0') + parseFloat(formData.taxAmount || '0') - parseFloat(formData.discountAmount || '0')).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tax & Discount Section */}
          <div className="grid grid-cols-2 gap-4">
            {/* Tax Rate */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.taxRate}
                onChange={(e) => setFormData(prev => ({ ...prev, taxRate: e.target.value }))}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
              />
            </div>

            {/* Discount */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Discount
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value as 'percentage' | 'flat' | '', discountValue: '' }))}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                >
                  <option value="">None</option>
                  <option value="percentage">Percentage</option>
                  <option value="flat">Flat Amount</option>
                </select>
                {formData.discountType && (
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discountValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountValue: e.target.value }))}
                    placeholder={formData.discountType === 'percentage' ? '0.00%' : '$0.00'}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Payment Terms & Settings */}
          <div className="grid grid-cols-2 gap-4">
            {/* Payment Terms */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Payment Terms
              </label>
              <select
                value={formData.paymentTerms}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
              >
                <option value="Due on Receipt">Due on Receipt</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
                <option value="Net 60">Net 60</option>
                <option value="Custom">Custom</option>
              </select>
              {formData.paymentTerms === 'Custom' && (
                <input
                  type="text"
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                  placeholder="Enter custom payment terms"
                  className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                />
              )}
            </div>

            {/* Late Fee Percentage */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Late Fee Percentage (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.lateFeePercentage}
                onChange={(e) => setFormData(prev => ({ ...prev, lateFeePercentage: e.target.value }))}
                placeholder="0.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
              />
            </div>
          </div>

          {/* Payment Plan Configuration */}
          <div>
            <PaymentPlanConfig
              totalAmount={(parseFloat(formData.subtotal) || 0) + (parseFloat(formData.taxAmount) || 0) - (parseFloat(formData.discountAmount) || 0)}
              value={paymentPlan}
              onChange={setPaymentPlan}
              eventDate={events.find(e => e.id === formData.projectId)?.event_date || null}
              invoiceDueDate={formData.dueDate || null}
            />
            <p className="text-xs text-gray-500 mt-2">
              Configure payment installments that will be reflected in the contract. This overrides the default 50/50 split.
            </p>
          </div>

          {/* Deposit Amount (Legacy - kept for backward compatibility) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Deposit Amount (Optional - Legacy)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.depositAmount}
              onChange={(e) => setFormData(prev => ({ ...prev, depositAmount: e.target.value }))}
              placeholder="0.00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Optional: If payment plan is not configured, this will be used as the deposit amount</p>
          </div>

          {/* Notes Section */}
          <div className="grid grid-cols-1 gap-4">
            {/* Public Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Public Notes (Visible to Client)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                placeholder="Notes visible to the client on the invoice..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
              />
            </div>

            {/* Internal Notes */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Internal Notes (Private)
              </label>
              <textarea
                value={formData.internalNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, internalNotes: e.target.value }))}
                rows={3}
                placeholder="Private notes for internal use only..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="slim"
              onClick={() => router.push('/admin/invoices')}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || !formData.contactId}
              className="bg-[#fcba00] hover:bg-[#e5a800] text-black"
            >
              {submitting ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </div>

      {/* New Contact Modal */}
      {showNewContactModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#fcba00] to-[#d99f00] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="w-6 h-6 text-gray-900" />
                <h2 className="text-xl font-bold text-gray-900">Create New Contact</h2>
              </div>
              <button 
                onClick={() => setShowNewContactModal(false)} 
                className="text-gray-800 hover:text-black p-1 hover:bg-black/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateContact} className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newContactForm.first_name}
                    onChange={(e) => setNewContactForm({ ...newContactForm, first_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newContactForm.last_name}
                    onChange={(e) => setNewContactForm({ ...newContactForm, last_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newContactForm.email_address}
                  onChange={(e) => setNewContactForm({ ...newContactForm, email_address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={newContactForm.phone}
                  onChange={(e) => setNewContactForm({ ...newContactForm, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                  <select
                    value={newContactForm.event_type}
                    onChange={(e) => setNewContactForm({ ...newContactForm, event_type: e.target.value })}
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
                    value={newContactForm.event_date}
                    onChange={(e) => setNewContactForm({ ...newContactForm, event_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Venue Name</label>
                <input
                  type="text"
                  value={newContactForm.venue_name}
                  onChange={(e) => setNewContactForm({ ...newContactForm, venue_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={newContactForm.notes}
                  onChange={(e) => setNewContactForm({ ...newContactForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fcba00] focus:border-transparent"
                />
              </div>

              {/* Footer */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowNewContactModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingContact}
                  className="flex-1 px-4 py-2 bg-[#fcba00] text-black rounded-lg hover:bg-[#e5a800] font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {creatingContact ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
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
      )}
    </div>
  );
}

export default function InvoiceDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const supabase = createClient();
  const isMountedRef = useRef(true);
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [paymentData, setPaymentData] = useState<{ totalPaid: number; payments: any[] } | null>(null);
  const [hasPayment, setHasPayment] = useState(false);
  const [leadData, setLeadData] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchInvoiceDetails = useCallback(async () => {
        // Prevent fetching if id is invalid or "new"
        if (!id || id === 'new' || typeof id !== 'string') {
          return;
        }
        
        setLoading(true);
        try {
          console.log('🔍 Fetching invoice details for:', id);
          
          // Validate id is a valid UUID format
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (!uuidRegex.test(id)) {
            throw new Error('Invalid invoice ID format');
          }
          
          // Fetch invoice summary
          const { data: invoiceData, error: invoiceError } = await supabase
            .from('invoice_summary')
            .select('*')
            .eq('id', id)
            .single();
          
          if (!isMountedRef.current) return;

          if (invoiceError) {
            // Handle AbortError gracefully
            if (invoiceError.name === 'AbortError' || invoiceError.message?.includes('aborted')) {
              return;
            }
            console.error('Error fetching invoice:', invoiceError);
            throw invoiceError;
          }
          
          if (!invoiceData) {
            throw new Error('Invoice not found');
          }
          
          if (!isMountedRef.current) return;

          const invoice = invoiceData as any;
          console.log('📄 Invoice data loaded:', {
            id: invoice.id,
            invoice_number: invoice.invoice_number,
            contact_id: invoice.contact_id,
            total_amount: invoice.total_amount,
            invoice_status: invoice.invoice_status,
            has_line_items_field: !!invoice.line_items,
            line_items_type: typeof invoice.line_items,
            line_items_value: invoice.line_items
          });
          
          if (isMountedRef.current) {
            setInvoice(invoice);
          }
          
          // Fetch line items from invoice_line_items table
      const { data: lineItemsData, error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .select('*')
        .eq('invoice_id', id)
        .order('created_at', { ascending: true });
      
      console.log('📦 Line items from invoice_line_items table:', {
        count: lineItemsData?.length || 0,
        data: lineItemsData,
        error: lineItemsError
      });
      
      if (lineItemsError) {
        // 404 is OK - invoice might not have line items yet
        if (lineItemsError.code !== 'PGRST116') {
          console.warn('Error fetching invoice line items:', lineItemsError);
        }
      }
      
      // If no line items from table, fetch the invoice directly to get line_items JSONB field
      let finalLineItems: InvoiceLineItem[] = (lineItemsData || []) as InvoiceLineItem[];
      if (finalLineItems.length === 0) {
        // Fetch invoice directly to get line_items JSONB field (invoice_summary view might not include it)
        const { data: directInvoiceData, error: directInvoiceError } = await supabase
          .from('invoices')
          .select('line_items')
          .eq('id', id)
          .single();
        
        // Type assertion for the invoice data
        const invoiceData = directInvoiceData as { line_items?: any } | null;
        
        console.log('📦 Direct invoice fetch for line_items:', {
          has_data: !!invoiceData,
          line_items: invoiceData?.line_items,
          error: directInvoiceError
        });
        
        if (invoiceData?.line_items) {
          try {
            // Parse the JSONB line_items field
            const jsonLineItems = typeof invoiceData.line_items === 'string' 
              ? JSON.parse(invoiceData.line_items) 
              : invoiceData.line_items;
            
            console.log('📦 Parsed JSON line items:', {
              is_array: Array.isArray(jsonLineItems),
              length: Array.isArray(jsonLineItems) ? jsonLineItems.length : 0,
              items: jsonLineItems
            });
            
            if (Array.isArray(jsonLineItems) && jsonLineItems.length > 0) {
              // Convert JSONB format to invoice_line_items format for display
              finalLineItems = jsonLineItems.map((item: any, index: number) => {
                const unitPrice = item.rate || item.unit_price || 0;
                const quantity = item.quantity || 1;
                const amount = item.amount || (unitPrice * quantity);
                
                return {
                  id: `json-${index}`, // Generate a temporary ID
                  description: item.description || '',
                  quantity: quantity,
                  unit_price: unitPrice,
                  total_amount: amount,
                  item_type: item.type || 'custom',
                  notes: item.notes || null
                };
              });
              console.log('📦 Converted line items for display:', finalLineItems);
            }
          } catch (e) {
            console.error('Error parsing invoice.line_items JSONB:', e, invoiceData?.line_items);
          }
        }
      }
      
      if (isMountedRef.current) {
        setLineItems(finalLineItems);
      }
      console.log('📦 Invoice line items (final):', {
        count: finalLineItems?.length || 0,
        items: finalLineItems
      });

      // Fetch payments - use same API endpoint as quote page for consistency
      let paymentsData = [];
      let paymentData = null;
      let hasPayment = false;
      
      if (invoice && invoice.contact_id) {
        try {
          const timestamp = new Date().getTime();
          const paymentsResponse = await fetch(`/api/quote/${invoice.contact_id}/payments?_t=${timestamp}`, { 
            cache: 'no-store' 
          });
          
          if (paymentsResponse.ok) {
            const paymentsResult = await paymentsResponse.json();
            if (paymentsResult.payments && paymentsResult.payments.length > 0) {
              // Filter for paid payments (same as quote page)
              const paidPayments = paymentsResult.payments.filter((p: any) => p.payment_status === 'Paid');
              if (paidPayments.length > 0) {
                hasPayment = true;
                const totalPaid = paidPayments.reduce((sum: number, p: any) => sum + (parseFloat(p.total_amount) || 0), 0);
                paymentData = { totalPaid, payments: paidPayments };
                paymentsData = paidPayments;
              }
            }
          }
        } catch (error) {
          console.error('Error fetching payments from API:', error);
          // Fallback to direct query
          const { data: fallbackPayments, error: paymentsError } = await supabase
            .from('payments')
            .select('*')
            .eq('invoice_id', id)
            .order('payment_date', { ascending: false });
          
          if (paymentsError) {
            console.warn('Error fetching payments:', paymentsError);
          } else {
            paymentsData = fallbackPayments || [];
          }
        }
      }
      
      setPayments(paymentsData);
      setPaymentData(paymentData);
      setHasPayment(hasPayment);
      console.log('💳 Payments:', paymentsData?.length || 0, hasPayment ? '(has payment)' : '');

      // Fetch lead/contact data using the same API endpoint as the quote page
      // This ensures we get the accurate event date (same as quote page)
      if (invoice && invoice.contact_id) {
        try {
          const timestamp = new Date().getTime();
          const leadResponse = await fetch(`/api/leads/get-lead?id=${invoice.contact_id}&_t=${timestamp}`, { 
            cache: 'no-store' 
          });
          
          if (leadResponse.ok) {
            const lead = await leadResponse.json();
            console.log('✅ Loaded lead data:', {
              id: lead.id,
              eventDate: lead.eventDate || lead.event_date,
              eventType: lead.eventType || lead.event_type
            });
            setLeadData(lead);
          }
        } catch (error) {
          console.warn('Error fetching lead data:', error);
        }
      }

      // Fetch quote_selections data using the same API endpoint as the quote page
      // This ensures consistency and handles all the same parsing logic
      let quoteData = null;
      
      if (invoice && invoice.contact_id) {
        console.log('🔍 Fetching quote data for contact_id:', invoice.contact_id);
        try {
          const timestamp = new Date().getTime();
          const quoteResponse = await fetch(`/api/quote/${invoice.contact_id}?_t=${timestamp}`, { 
            cache: 'no-store' 
          });
          
          if (quoteResponse.ok) {
            const quote = await quoteResponse.json();
            console.log('✅ Loaded quote data from API:', {
              id: quote.id,
              package_id: quote.package_id,
              total_price: quote.total_price,
              discount_type: quote.discount_type,
              discount_value: quote.discount_value
            });
            
            // Parse speaker_rental if it's a JSON string (same as quote page)
            if (quote.speaker_rental && typeof quote.speaker_rental === 'string') {
              try {
                quote.speaker_rental = JSON.parse(quote.speaker_rental);
              } catch (e) {
                console.error('Error parsing speaker_rental:', e);
              }
            }
            
            quoteData = quote;
            
            // If quote doesn't have invoice_id set, update it
            if (!quote.invoice_id) {
              console.log('🔗 Linking quote to invoice...');
              await (supabase
                .from('quote_selections') as any)
                .update({ invoice_id: id })
                .eq('id', (quote as any).id);
            }
          } else {
            const errorData = await quoteResponse.json().catch(() => ({}));
            console.warn('⚠️ Failed to fetch quote from API:', quoteResponse.status, errorData);
          }
        } catch (error) {
          console.error('Error fetching quote from API:', error);
        }
      } else {
        console.warn('⚠️ Cannot fetch quote: invoice data or contact_id missing');
      }
      
      if (quoteData) {
        // Parse JSON fields if they're strings (API might return them as strings)
        const parseJsonField = (field: any) => {
          if (typeof field === 'string') {
            try {
              return JSON.parse(field);
            } catch (e) {
              // If parsing fails, return as-is (might already be an object)
              return field;
            }
          }
          return field;
        };
        
        const parsedQuoteData = {
          ...quoteData,
          custom_line_items: parseJsonField(quoteData.custom_line_items),
          custom_addons: parseJsonField(quoteData.custom_addons),
          addons: parseJsonField(quoteData.addons),
          payment_schedule: parseJsonField(quoteData.payment_schedule)
        };
        
        console.log('📋 Parsed quote data:', {
          package_id: parsedQuoteData.package_id,
          package_name: parsedQuoteData.package_name,
          total_price: parsedQuoteData.total_price,
          package_price: parsedQuoteData.package_price,
          custom_line_items_count: Array.isArray(parsedQuoteData.custom_line_items) ? parsedQuoteData.custom_line_items.length : 0,
          addons_count: Array.isArray(parsedQuoteData.addons) ? parsedQuoteData.addons.length : 0,
          custom_addons_count: Array.isArray(parsedQuoteData.custom_addons) ? parsedQuoteData.custom_addons.length : 0,
          discount_type: parsedQuoteData.discount_type,
          discount_value: parsedQuoteData.discount_value,
          speaker_rental: parsedQuoteData.speaker_rental ? 'present' : 'none'
        });
        
        setQuoteData(parsedQuoteData);
      } else {
        console.warn('⚠️ No quote data found for invoice:', id);
        setQuoteData(null);
      }

    } catch (error: any) {
      // Handle AbortError gracefully
      if (error?.name === 'AbortError' || error?.message?.includes('aborted')) {
        return;
      }
      console.error('Error fetching invoice details:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [id, supabase]);

  useEffect(() => {
    // Handle "new" route - show create invoice form
    if (id === 'new') {
      setLoading(false);
      return;
    }
    
    if (id && typeof id === 'string' && id !== 'new') {
      fetchInvoiceDetails();
    }
  }, [id, fetchInvoiceDetails, router]);

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'sent':
      case 'viewed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return <CheckCircle className="h-5 w-5" />;
      case 'overdue':
        return <AlertCircle className="h-5 w-5" />;
      case 'partial':
      case 'sent':
      case 'viewed':
        return <Clock className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!invoice || updatingStatus) return;

    setUpdatingStatus(true);
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/update-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_status: newStatus })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update invoice status');
      }

      // Update local state
      setInvoice({ ...invoice, invoice_status: newStatus });

      toast({
        title: 'Status Updated',
        description: `Invoice status changed to ${newStatus}`,
      });

      // Refresh invoice details to get latest data
      await fetchInvoiceDetails();
    } catch (error: any) {
      console.error('Error updating invoice status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update invoice status',
        variant: 'destructive'
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDownloadPDF = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!invoice || !invoice.id) {
      console.error('Invoice or invoice ID is missing');
      return;
    }

    setDownloading(true);
    try {
      // Use the invoice PDF generation endpoint
      const response = await fetch('/api/invoices/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId: invoice.id
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PDF generation failed:', response.status, errorText);
        throw new Error(`Failed to generate PDF: ${response.status}`);
      }

      // Check if response is actually a PDF
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        console.error('Response is not a PDF:', contentType);
        throw new Error('Server returned invalid PDF format');
      }

      // Create blob and download
      const blob = await response.blob();
      
      if (!blob || blob.size === 0) {
        throw new Error('PDF file is empty');
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Create a more descriptive filename (same logic as quote page)
      const firstName = invoice.first_name?.trim() || '';
      const lastName = invoice.last_name?.trim() || '';
      const eventDate = invoice.event_date ? 
        new Date(invoice.event_date).toISOString().split('T')[0] : '';
      const eventType = invoice.event_type?.toLowerCase()?.replace(/_/g, '-') || '';
      const invoiceNumber = invoice.invoice_number;
      
      let filename = 'Invoice';
      
      // Build filename with available data
      if (firstName && lastName) {
        filename = `Invoice-${firstName}-${lastName}`;
      } else if (firstName) {
        filename = `Invoice-${firstName}`;
      } else if (lastName) {
        filename = `Invoice-${lastName}`;
      } else if (invoiceNumber) {
        filename = `Invoice-${invoiceNumber}`;
      } else if (invoice.id) {
        filename = `Invoice-${invoice.id.substring(0, 8).toUpperCase()}`;
      }
      
      // Add event type if available
      if (eventType) {
        filename += `-${eventType}`;
      }
      
      // Add event date if available
      if (eventDate) {
        filename += `-${eventDate}`;
      }
      
      a.download = `${filename}.pdf`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert(`Failed to download PDF: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <img
            src="/assets/m10 dj company logo white.gif"
            alt="M10 DJ Company Loading"
            className="w-24 h-24 object-contain mx-auto mb-4"
          />
          <p className="text-white">Loading invoice...</p>
        </div>
      </div>
    );
  }

  // Show invoice creation form if id is 'new'
  if (id === 'new') {
    return <CreateInvoiceForm router={router} supabase={supabase} />;
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h2>
          <p className="text-gray-600 mb-6">The invoice you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push('/admin/invoices')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="slim"
            onClick={() => router.push('/admin/invoices')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Invoices
          </Button>
          <div className="flex items-center gap-3">
            <Button variant="slim" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button 
              variant="slim" 
              onClick={handleDownloadPDF}
              disabled={downloading}
            >
              <Download className={`h-4 w-4 mr-2 ${downloading ? 'animate-spin' : ''}`} />
              {downloading ? 'Generating...' : 'Download PDF'}
            </Button>
            {invoice && invoice.id && (
              <InvoiceEmailActions
                invoiceId={invoice.id}
                invoiceNumber={invoice.invoice_number}
                disabled={false}
                hasEmail={!!invoice.email_address}
                contactId={invoice.contact_id}
              />
            )}
            {invoice.contact_id && (
              <Link href={`/quote/${invoice.contact_id}/invoice`}>
                <Button variant="slim">
                  <FileText className="h-4 w-4 mr-2" />
                  View Quote Page
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Invoice Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{invoice.invoice_number}</h1>
              <p className="text-lg text-gray-600">{invoice.invoice_title}</p>
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={invoice.invoice_status}
                onValueChange={handleStatusChange}
                disabled={updatingStatus}
              >
                <SelectTrigger className={`w-[180px] ${getStatusColor(invoice.invoice_status)} border`}>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(invoice.invoice_status)}
                    <SelectValue placeholder="Select status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>Draft</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Sent">
                    <div className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      <span>Sent</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Viewed">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <span>Viewed</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Paid">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Paid</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Partial">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Partial</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Overdue">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      <span>Overdue</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Cancelled">
                    <div className="flex items-center gap-2">
                      <X className="h-4 w-4" />
                      <span>Cancelled</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Client Info */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Bill To</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <User className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <Link 
                      href={`/admin/contacts/${invoice.contact_id}`}
                      className="font-semibold text-gray-900 hover:text-blue-600 transition-colors inline-block"
                    >
                      {invoice.first_name} {invoice.last_name}
                    </Link>
                    <p className="text-sm text-gray-600">{invoice.email_address}</p>
                    {invoice.phone && <p className="text-sm text-gray-600">{invoice.phone}</p>}
                  </div>
                </div>
                {invoice.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="text-sm text-gray-600">
                      <p>{invoice.address}</p>
                      {invoice.city && invoice.state && (
                        <p>{invoice.city}, {invoice.state}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Invoice Details */}
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Invoice Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Issue Date:</span>
                  <span className="font-medium text-gray-900">{formatDate(invoice.invoice_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Due Date:</span>
                  <span className="font-medium text-gray-900">{formatDate(invoice.due_date)}</span>
                </div>
                {(leadData?.eventDate || leadData?.event_date || invoice.event_date) && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Event Date:</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(leadData?.eventDate || leadData?.event_date || invoice.event_date)}
                    </span>
                  </div>
                )}
                {invoice.venue_name && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Venue:</span>
                    <span className="font-medium text-gray-900">{invoice.venue_name}</span>
                  </div>
                )}
                {invoice.project_name && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Project:</span>
                    <Link 
                      href={`/admin/contacts/${invoice.contact_id}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {invoice.project_name}
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {invoice.days_overdue > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold text-red-900">This invoice is overdue</p>
                <p className="text-sm text-red-700">Payment was due {invoice.days_overdue} days ago on {formatDate(invoice.due_date)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Line Items</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-6 text-xs font-semibold text-gray-700 uppercase">Description</th>
                  <th className="text-center py-3 px-6 text-xs font-semibold text-gray-700 uppercase">Qty</th>
                  <th className="text-right py-3 px-6 text-xs font-semibold text-gray-700 uppercase">Unit Price</th>
                  <th className="text-right py-3 px-6 text-xs font-semibold text-gray-700 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(() => {
                  // Use quote data as source of truth (same as quote page)
                  const packageLineItems = quoteData ? getPackageLineItemsFromQuote(quoteData) : [];
                  const showPrices = quoteData?.show_line_item_prices !== false;
                  
                  // Parse speaker_rental if present
                  let speakerRental: any = null;
                  if (quoteData?.speaker_rental) {
                    speakerRental = typeof quoteData.speaker_rental === 'string' 
                      ? JSON.parse(quoteData.speaker_rental) 
                      : quoteData.speaker_rental;
                  }
                  
                  // Show speaker rental first if present
                  const hasQuoteItems = packageLineItems.length > 0 || speakerRental;
                  
                  // Prioritize invoice line items (from JSONB or invoice_line_items table)
                  // These are the actual line items added when creating the invoice
                  if (lineItems.length > 0) {
                    return (
                      <>
                        {lineItems.map((item) => (
                          <tr key={item.id || `line-item-${item.description}`}>
                            <td className="py-4 px-6">
                              <p className="font-medium text-gray-900">{item.description || 'Line Item'}</p>
                              {item.notes && <p className="text-sm text-gray-600 mt-1">{item.notes}</p>}
                            </td>
                            <td className="py-4 px-6 text-center text-gray-700">{item.quantity || 1}</td>
                            <td className="py-4 px-6 text-right text-gray-700">{formatCurrency(item.unit_price || 0)}</td>
                            <td className="py-4 px-6 text-right font-semibold text-gray-900">{formatCurrency(item.total_amount || 0)}</td>
                          </tr>
                        ))}
                        {/* Also show quote/package items if they exist (for reference) */}
                        {hasQuoteItems && (
                          <>
                            {speakerRental && speakerRental.price && (
                              <tr>
                                <td className="py-4 px-6">
                                  <p className="font-medium text-gray-900">Speaker Rental</p>
                                  {speakerRental.description && (
                                    <p className="text-sm text-gray-600 mt-1">{speakerRental.description}</p>
                                  )}
                                </td>
                                <td className="py-4 px-6 text-center text-gray-700">1</td>
                                <td className="py-4 px-6 text-right text-gray-700">
                                  {showPrices ? formatCurrency(speakerRental.price) : '—'}
                                </td>
                                <td className="py-4 px-6 text-right font-semibold text-gray-900">
                                  {showPrices ? formatCurrency(speakerRental.price) : '—'}
                                </td>
                              </tr>
                            )}
                            {packageLineItems.map((item, index) => (
                              <tr key={`quote-item-${index}`}>
                                <td className="py-4 px-6">
                                  <p className="font-medium text-gray-900">{item.item || item.description || 'Line Item'}</p>
                                  {item.description && item.description !== item.item && (
                                    <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                  )}
                                </td>
                                <td className="py-4 px-6 text-center text-gray-700">1</td>
                                <td className="py-4 px-6 text-right text-gray-700">
                                  {showPrices && item.price ? formatCurrency(item.price) : '—'}
                                </td>
                                <td className="py-4 px-6 text-right font-semibold text-gray-900">
                                  {showPrices && item.price ? formatCurrency(item.price) : '—'}
                                </td>
                              </tr>
                            ))}
                          </>
                        )}
                      </>
                    );
                  }
                  
                  // Fallback: show quote items if no invoice line items
                  if (hasQuoteItems) {
                    return (
                      <>
                        {/* Speaker Rental (if present) */}
                        {speakerRental && speakerRental.price && (
                          <tr>
                            <td className="py-4 px-6">
                              <p className="font-medium text-gray-900">Speaker Rental</p>
                              {speakerRental.description && (
                                <p className="text-sm text-gray-600 mt-1">{speakerRental.description}</p>
                              )}
                            </td>
                            <td className="py-4 px-6 text-center text-gray-700">1</td>
                            <td className="py-4 px-6 text-right text-gray-700">
                              {showPrices ? formatCurrency(speakerRental.price) : '—'}
                            </td>
                            <td className="py-4 px-6 text-right font-semibold text-gray-900">
                              {showPrices ? formatCurrency(speakerRental.price) : '—'}
                            </td>
                          </tr>
                        )}
                        
                        {/* Package Line Items */}
                        {packageLineItems.map((item, index) => (
                          <tr key={`quote-item-${index}`}>
                            <td className="py-4 px-6">
                              <p className="font-medium text-gray-900">{item.item || item.description || 'Line Item'}</p>
                              {item.description && item.description !== item.item && (
                                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                              )}
                            </td>
                            <td className="py-4 px-6 text-center text-gray-700">1</td>
                            <td className="py-4 px-6 text-right text-gray-700">
                              {showPrices && item.price ? formatCurrency(item.price) : '—'}
                            </td>
                            <td className="py-4 px-6 text-right font-semibold text-gray-900">
                              {showPrices && item.price ? formatCurrency(item.price) : '—'}
                            </td>
                          </tr>
                        ))}
                      </>
                    );
                  }
                  
                  // Final fallback: no items at all
                  return (
                    <tr>
                      <td colSpan={4} className="py-8 px-6 text-center text-gray-500">
                        No line items found
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 p-6 border-t border-gray-200">
            <div className="max-w-sm ml-auto space-y-2">
              {(() => {
                // Calculate totals from quote data (same as quote page)
                // Always use quote totals if quoteData exists, as it's the source of truth
                const quoteTotals = calculateQuoteTotals(quoteData);
                const useQuoteTotals = !!quoteData; // Use quote totals if quote data exists
                
                // Use quote totals if available, otherwise use invoice totals
                // Match quote page calculation exactly: total = subtotal - discountAmount (no tax added)
                const subtotal = useQuoteTotals ? quoteTotals.subtotal : (invoice.subtotal || 0);
                const discountAmount = useQuoteTotals ? quoteTotals.discountAmount : 0;
                // For total, use calculated total from quoteTotals (subtotal - discount)
                // Quote page: total = subtotal - discountAmount (line 918)
                // Only use quoteData.total_price if it's explicitly set AND matches the calculated total
                // Otherwise always use calculated total to ensure discount is applied
                const calculatedTotal = useQuoteTotals 
                  ? quoteTotals.total  // Always use calculated total (subtotal - discount)
                  : (invoice.total_amount || 0);
                const taxAmount = invoice.tax_amount || 0;
                // Match quote page: total = subtotal - discountAmount (tax is shown separately if > 0)
                const total = calculatedTotal; // Don't add tax - match quote page exactly
                // Use paymentData.totalPaid if available (from quote API), otherwise use invoice.amount_paid
                const amountPaid = paymentData?.totalPaid || invoice.amount_paid || 0;
                const balanceDue = total - amountPaid;
                const isFullyPaid = amountPaid >= total;
                const isPartiallyPaid = amountPaid > 0 && amountPaid < total;
                
                console.log('💰 Totals calculation:', {
                  useQuoteTotals,
                  quoteSubtotal: quoteTotals.subtotal,
                  quoteDiscount: quoteTotals.discountAmount,
                  quoteTotal: quoteTotals.total,
                  quoteTotalPrice: quoteData?.total_price,
                  calculatedTotal,
                  taxAmount,
                  total,
                  amountPaid,
                  balanceDue
                });
                
                return (
                  <>
                    <div className="flex justify-between text-gray-700">
                      <span>Subtotal:</span>
                      <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between text-gray-700">
                        <span>Discount:</span>
                        <span className="font-medium text-green-600">-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    {taxAmount > 0 && (
                      <div className="flex justify-between text-gray-700">
                        <span>Tax:</span>
                        <span className="font-medium">{formatCurrency(taxAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-300">
                      <span>Total:</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                    {hasPayment && (
                      <>
                        <div className="flex justify-between text-green-600 font-semibold pt-2 border-t border-gray-300">
                          <span>Amount Paid:</span>
                          <span>{formatCurrency(amountPaid)}</span>
                        </div>
                        
                        {/* Payment History - Show individual payments (same as quote page) */}
                        {paymentData?.payments && paymentData.payments.length > 0 && (
                          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="font-semibold text-sm text-blue-900 mb-2">
                              Payment History
                            </h4>
                            <div className="space-y-2">
                              {paymentData.payments.map((payment: any, idx: number) => {
                                const paymentDate = payment.transaction_date 
                                  ? new Date(payment.transaction_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                                  : payment.created_at 
                                    ? new Date(payment.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                                    : 'Date not available';
                                
                                // Determine if this is a retainer/deposit payment
                                const isRetainer = payment.payment_type === 'Deposit' || 
                                                  payment.payment_type === 'Retainer' ||
                                                  payment.description?.toLowerCase().includes('deposit') ||
                                                  payment.description?.toLowerCase().includes('retainer') ||
                                                  (idx === 0 && paymentData.payments.length > 1);
                                
                                return (
                                  <div key={payment.id || idx} className="flex items-center justify-between py-2 border-b border-blue-200 last:border-b-0">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                        <span className="text-sm font-medium text-blue-900">
                                          {isRetainer ? '✓ Retainer Paid' : '✓ Payment Received'}
                                        </span>
                                      </div>
                                      <p className="text-xs text-blue-700 mt-0.5">
                                        {paymentDate}
                                        {payment.description && ` • ${payment.description}`}
                                      </p>
                                    </div>
                                    <span className="text-sm font-semibold text-blue-900">
                                      {formatCurrency(parseFloat(payment.total_amount) || 0)}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        
                        {isFullyPaid && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center gap-2 text-green-800">
                              <CheckCircle className="w-5 h-5 flex-shrink-0" />
                              <span className="font-semibold text-sm">Invoice Paid in Full</span>
                            </div>
                          </div>
                        )}
                        {isPartiallyPaid && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center gap-2 text-yellow-800 mb-1">
                              <span className="font-semibold text-sm">Partially Paid</span>
                            </div>
                            <p className="text-xs text-yellow-700">
                              {formatCurrency(balanceDue)} remaining
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    <div className="flex justify-between text-lg font-bold text-orange-600 pt-2 border-t border-gray-300">
                      <span>Balance Due:</span>
                      <span>{formatCurrency(balanceDue)}</span>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Quote Details Section */}
        {quoteData && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Quote Details</h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Package Information */}
              {quoteData.package_id && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Package</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-semibold text-gray-900">{quoteData.package_name || quoteData.package_id}</p>
                    {quoteData.package_price && (
                      <p className="text-sm text-gray-600 mt-1">Package Price: {formatCurrency(quoteData.package_price)}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Custom Line Items from Quote */}
              {quoteData.custom_line_items && Array.isArray(quoteData.custom_line_items) && quoteData.custom_line_items.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Package Line Items</h3>
                  <div className="space-y-2">
                    {quoteData.custom_line_items.map((item: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.item || item.description || 'Line Item'}</p>
                            {item.description && item.description !== item.item && (
                              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            )}
                          </div>
                          {quoteData.show_line_item_prices !== false && item.price && (
                            <span className="font-semibold text-gray-900 ml-4">{formatCurrency(item.price)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Speaker Rental */}
              {quoteData.speaker_rental && (() => {
                const speakerRental = typeof quoteData.speaker_rental === 'string' 
                  ? JSON.parse(quoteData.speaker_rental) 
                  : quoteData.speaker_rental;
                if (speakerRental && speakerRental.price) {
                  return (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Speaker Rental</h3>
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{speakerRental.name || 'Speaker Rental'}</p>
                            {speakerRental.description && (
                              <p className="text-sm text-gray-600 mt-1">{speakerRental.description}</p>
                            )}
                          </div>
                          <span className="font-semibold text-gray-900 ml-4">{formatCurrency(speakerRental.price)}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Add-ons */}
              {(quoteData.addons || quoteData.custom_addons) && 
               ((Array.isArray(quoteData.addons) && quoteData.addons.length > 0) || 
                (Array.isArray(quoteData.custom_addons) && quoteData.custom_addons.length > 0)) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Add-ons</h3>
                  <div className="space-y-2">
                    {(quoteData.custom_addons || quoteData.addons || []).map((addon: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{addon.name || addon.item || 'Add-on'}</p>
                            {addon.description && (
                              <p className="text-sm text-gray-600 mt-1">{addon.description}</p>
                            )}
                          </div>
                          {addon.price && (
                            <span className="font-semibold text-gray-900 ml-4">{formatCurrency(addon.price)}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Discount */}
              {quoteData.discount_type && quoteData.discount_value && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Discount</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">
                          {quoteData.discount_type === 'percentage' 
                            ? `${quoteData.discount_value}% Discount`
                            : `${formatCurrency(quoteData.discount_value)} Discount`}
                        </p>
                        {quoteData.discount_note && (
                          <p className="text-sm text-gray-600 mt-1">{quoteData.discount_note}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Terms */}
              {quoteData.payment_terms_type && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Payment Terms</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    {quoteData.payment_terms_type === 'set_number' && quoteData.number_of_payments && (
                      <div className="space-y-2">
                        <p className="font-medium text-gray-900">
                          {quoteData.number_of_payments} Payment{quoteData.number_of_payments > 1 ? 's' : ''}
                        </p>
                        {quoteData.payment_schedule && Array.isArray(quoteData.payment_schedule) && quoteData.payment_schedule.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {quoteData.payment_schedule.map((payment: any, index: number) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                  Payment {index + 1} {payment.dueDate ? `(${formatDate(payment.dueDate)})` : ''}
                                </span>
                                <span className="font-medium text-gray-900">{formatCurrency(payment.amount || 0)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {quoteData.payment_terms_type === 'client_selects' && (
                      <p className="font-medium text-gray-900">Client selects payment schedule</p>
                    )}
                    {quoteData.deposit_due_date && (
                      <p className="text-sm text-gray-600 mt-2">Deposit Due: {formatDate(quoteData.deposit_due_date)}</p>
                    )}
                    {quoteData.remaining_balance_due_date && (
                      <p className="text-sm text-gray-600 mt-1">Balance Due: {formatDate(quoteData.remaining_balance_due_date)}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Due Date Type */}
              {quoteData.due_date_type && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase mb-3">Due Date</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="font-medium text-gray-900">
                      {quoteData.due_date_type === 'upon_receipt' && 'Due Upon Receipt'}
                      {quoteData.due_date_type === 'day_of_event' && 'Due on Event Date'}
                      {quoteData.due_date_type === '7_days_before' && 'Due 7 Days Before Event'}
                      {!['upon_receipt', 'day_of_event', '7_days_before'].includes(quoteData.due_date_type) && quoteData.due_date_type}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment History */}
        {payments.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="bg-green-100 p-3 rounded-full">
                        <CreditCard className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
                        <p className="text-sm text-gray-600">
                          {formatDate(payment.payment_date)} • {payment.payment_method}
                        </p>
                        {payment.transaction_id && (
                          <p className="text-xs text-gray-500 mt-1">Transaction: {payment.transaction_id}</p>
                        )}
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {payment.payment_status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {invoice.notes && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Notes</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

