import { useRouter } from 'next/router';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import QuoteBottomNav from '../../../components/quote/QuoteBottomNav';
import Header from '../../../components/company/Header';
import { CheckCircle, Sparkles, Music, Calendar, MapPin, Users, Heart, Star, ArrowLeft, Loader2, ChevronDown, ChevronUp, FileText, Menu, X, Tag, XCircle, Settings, Trash2, Clock } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Helper function to format date without timezone conversion issues
// Parses YYYY-MM-DD strings as local dates to prevent day shifting
const formatEventDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    // If it's a date string in YYYY-MM-DD format, parse it as local date
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const datePart = dateStr.split('T')[0]; // Remove time if present
      const [year, month, day] = datePart.split('-');
      // Create date in local timezone, not UTC (prevents day from shifting)
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }
    // Fallback for other date formats
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch (e) {
    return '';
  }
};

export default function PersonalizedQuote() {
  const router = useRouter();
  const { id } = router.query;
  const [leadData, setLeadData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedSpeakerRental, setSelectedSpeakerRental] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [saving, setSaving] = useState(false);
  const [expandedBreakdown, setExpandedBreakdown] = useState(null);
  const [expandedPackages, setExpandedPackages] = useState(new Set()); // Track which packages are expanded
  const [existingSelection, setExistingSelection] = useState(null);
  const [contractSigned, setContractSigned] = useState(false);
  const [showEditMode, setShowEditMode] = useState(false);
  const [hasPayment, setHasPayment] = useState(false);
  const [outstandingBalance, setOutstandingBalance] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [discountData, setDiscountData] = useState(null);
  const [discountError, setDiscountError] = useState('');
  const [validatingDiscount, setValidatingDiscount] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [customizedPackage, setCustomizedPackage] = useState(null); // Admin-customized package with removed features
  const [customizedFeatures, setCustomizedFeatures] = useState([]); // Features that remain after customization
  const [isExpired, setIsExpired] = useState(false); // Track if event date has passed
  const [showSpeakerTimeModal, setShowSpeakerTimeModal] = useState(false);
  const [speakerStartTime, setSpeakerStartTime] = useState('');
  const [speakerEndTime, setSpeakerEndTime] = useState('');
  const [pendingSpeakerAddon, setPendingSpeakerAddon] = useState(null);
  const [showSpeakerUpsell, setShowSpeakerUpsell] = useState(false);
  const [calculatedHours, setCalculatedHours] = useState(0);
  const [additionalHoursSelected, setAdditionalHoursSelected] = useState(0);
  const [pageViewTimeline, setPageViewTimeline] = useState([]);
  const [pageViewTimelineLoading, setPageViewTimelineLoading] = useState(false);

  const fetchLeadData = useCallback(async () => {
    // Validate ID before making request
    if (!id || id === 'null' || id === 'undefined' || id.trim() === '') {
      console.error('Invalid quote ID:', id);
      // Try to get form data from sessionStorage as fallback
      const savedFormData = sessionStorage.getItem('quote_form_data');
      if (savedFormData) {
        try {
          const formData = JSON.parse(savedFormData);
          console.log('✅ Using saved form data as fallback');
          setLeadData({
            id: 'fallback',
            name: formData.name || 'Valued Customer',
            email: formData.email,
            phone: formData.phone,
            eventType: formData.eventType,
            eventDate: formData.eventDate,
            location: formData.location
          });
          setError(null);
          setLoading(false);
          return;
        } catch (e) {
          console.error('Failed to parse saved form data:', e);
        }
      }
      setError('Invalid quote link. Please contact us to get your personalized quote.');
      setLoading(false);
      return;
    }

    try {
      // Add cache-busting timestamp to ensure fresh data
      const timestamp = new Date().getTime();
      const [leadResponse, quoteResponse] = await Promise.all([
        fetch(`/api/leads/get-lead?id=${id}&_t=${timestamp}`, { cache: 'no-store' }),
        fetch(`/api/quote/${id}?_t=${timestamp}`, { cache: 'no-store' }).catch(() => null) // Quote might not exist yet
      ]);

      if (leadResponse.ok) {
        const data = await leadResponse.json();
        if (data && data.id) {
          setLeadData(data);
          setError(null);
          
          // Check if contract is signed or deposit is paid
          if (data.contractSignedDate || data.depositPaid) {
            setContractSigned(true);
          }
          
          // Check if event date has passed (expiration check)
          if (data.eventDate || data.event_date) {
            // Parse date string as local date to avoid timezone issues
            const eventDateStr = data.eventDate || data.event_date;
            let eventDate;
            if (typeof eventDateStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(eventDateStr)) {
              const datePart = eventDateStr.split('T')[0];
              const [year, month, day] = datePart.split('-');
              eventDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            } else {
              eventDate = new Date(eventDateStr);
            }
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
            eventDate.setHours(0, 0, 0, 0);
            
            if (eventDate < today) {
              setIsExpired(true);
            }
          }
          
          // Notify admin that quote page was opened
          fetch('/api/admin/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventType: 'quote_page_open',
              data: {
                leadId: id,
                leadName: data.name,
                eventType: data.eventType || data.event_type,
                eventDate: data.eventDate || data.event_date
              }
            })
          }).catch(err => console.error('Failed to notify admin:', err));
        } else {
          console.error('Invalid data returned from API:', data);
          // Try fallback with saved form data
          const savedFormData = sessionStorage.getItem('quote_form_data');
          if (savedFormData) {
            try {
              const formData = JSON.parse(savedFormData);
              console.log('✅ Using saved form data as fallback');
              setLeadData({
                id: 'fallback',
                name: formData.name || 'Valued Customer',
                email: formData.email,
                phone: formData.phone,
                eventType: formData.eventType,
                eventDate: formData.eventDate,
                location: formData.location
              });
              setError(null);
              setLoading(false);
              return;
            } catch (e) {
              console.error('Failed to parse saved form data:', e);
            }
          }
          setError('Quote data is invalid. Please contact us for assistance.');
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('API error:', response.status, errorData);
        
        // Try fallback with saved form data
        const savedFormData = sessionStorage.getItem('quote_form_data');
        if (savedFormData) {
          try {
            const formData = JSON.parse(savedFormData);
            console.log('✅ Using saved form data as fallback after API error');
            setLeadData({
              id: 'fallback',
              name: formData.name || 'Valued Customer',
              email: formData.email,
              phone: formData.phone,
              eventType: formData.eventType,
              eventDate: formData.eventDate,
              location: formData.location
            });
            setError(null);
            setLoading(false);
            return;
          } catch (e) {
            console.error('Failed to parse saved form data:', e);
          }
        }
        
        setError(errorData.error || 'Quote not found. Please contact us to get your personalized quote.');
      }

      // Check for existing quote selection
      if (quoteResponse && quoteResponse.ok) {
        const quoteData = await quoteResponse.json();
        if (quoteData) {
          setExistingSelection(quoteData);
          
          // Pre-populate selections if they exist
          // Skip if package_id is 'speaker_rental' (that's handled separately)
          if (quoteData.package_id && quoteData.package_id !== 'speaker_rental') {
            // Find the actual package object from the packages array
            // We need to determine which package array to search based on event type
            const eventTypeLower = (leadData?.eventType || leadData?.event_type || '').toLowerCase();
            const isHolidayLocal = eventTypeLower.includes('holiday');
            const isSchoolLocal = eventTypeLower.includes('school');
            const isCorporateLocal = eventTypeLower.includes('corporate') || eventTypeLower.includes('business');
            const isWeddingLocal = eventTypeLower.includes('wedding');
            const isPrivatePartyLocal = (eventTypeLower.includes('private') || eventTypeLower.includes('party') || eventTypeLower.includes('birthday') || eventTypeLower === 'private_party') && !isHolidayLocal && !isSchoolLocal && !isWeddingLocal;
            
            let packagesToSearch = weddingPackages; // default to wedding
            if (isHolidayLocal) {
              packagesToSearch = holidayPackages;
            } else if (isSchoolLocal) {
              packagesToSearch = schoolPackages;
            } else if (isCorporateLocal || isPrivatePartyLocal) {
              packagesToSearch = corporatePackages;
            } else if (isWeddingLocal) {
              packagesToSearch = weddingPackages;
            }
            
            const foundPackage = packagesToSearch.find(pkg => pkg.id === quoteData.package_id);
            if (foundPackage) {
              setSelectedPackage(foundPackage);
              console.log('✅ Loaded existing package:', foundPackage);
            } else {
              console.warn('⚠️ Package not found:', quoteData.package_id, 'in packages array');
              // Fallback: create a minimal package object from quoteData
              setSelectedPackage({
                id: quoteData.package_id,
                name: quoteData.package_name || 'Selected Package',
                price: quoteData.package_price || 0
              });
            }
          }
          
          // Handle speaker rental if present
          // Check if package_id is 'speaker_rental' or if speaker_rental field exists
          if (quoteData.package_id === 'speaker_rental' || quoteData.speaker_rental) {
            try {
              let speakerRental = null;
              
              // First try to get from speaker_rental field
              if (quoteData.speaker_rental) {
                speakerRental = typeof quoteData.speaker_rental === 'string' 
                  ? JSON.parse(quoteData.speaker_rental) 
                  : quoteData.speaker_rental;
              } else {
                // If package_id is 'speaker_rental', check addons for speaker rental details
                const addons = quoteData.addons || [];
                const speakerRentalAddon = addons.find(a => 
                  a.id === 'speaker_rental' || 
                  a.id === 'holiday_speaker_rental' ||
                  (a.name && a.name.toLowerCase().includes('speaker rental'))
                );
                
                if (speakerRentalAddon) {
                  speakerRental = {
                    id: speakerRentalAddon.id,
                    name: speakerRentalAddon.name || quoteData.package_name,
                    price: speakerRentalAddon.price || quoteData.package_price,
                    startTime: speakerRentalAddon.startTime,
                    endTime: speakerRentalAddon.endTime,
                    totalHours: speakerRentalAddon.totalHours
                  };
                } else {
                  // Fallback: create from package_name and package_price
                  speakerRental = {
                    id: 'speaker_rental',
                    name: quoteData.package_name || 'Speaker Setup Rental',
                    price: quoteData.package_price || 0,
                    totalHours: 4
                  };
                }
              }
              
              if (speakerRental) {
                setSelectedSpeakerRental(speakerRental);
                console.log('✅ Loaded existing speaker rental:', speakerRental);
              }
            } catch (e) {
              console.error('Error parsing speaker rental:', e);
            }
          }
          
          if (quoteData.addons && Array.isArray(quoteData.addons)) {
            setSelectedAddons(quoteData.addons);
          }

          // Check if contract exists and is signed
          if (quoteData.contract_id) {
            try {
              const contractResponse = await fetch(`/api/contracts/${quoteData.contract_id}`);
              if (contractResponse.ok) {
                const contractData = await contractResponse.json();
                if (contractData.status === 'signed' || contractData.signed_at) {
                  setContractSigned(true);
                }
              }
            } catch (e) {
              console.log('Could not fetch contract details:', e);
            }
          }
          
          // Calculate outstanding balance (works whether contract is signed or not)
          // Use same calculation logic as invoice to include discounts
          const packagePrice = Number(quoteData.package_price) || 0;
          const addons = quoteData.addons || [];
          const addonsTotal = addons.reduce((sum, addon) => {
            const price = typeof addon === 'object' ? (Number(addon.price) || 0) : 0;
            return sum + price;
          }, 0);
          const subtotal = packagePrice + addonsTotal;
          
          // Apply discount if present
          let discountAmount = 0;
          if (quoteData.discount_type && quoteData.discount_value && quoteData.discount_value > 0) {
            if (quoteData.discount_type === 'percentage') {
              discountAmount = subtotal * (Number(quoteData.discount_value) / 100);
            } else {
              discountAmount = Number(quoteData.discount_value);
            }
          }
          
          const calculatedTotal = Math.max(0, subtotal - discountAmount);
          const totalOwed = calculatedTotal > 0 ? calculatedTotal : (quoteData.total_price || 0);
          
          if (totalOwed > 0) {
            try {
              // Try to get contact_id from contract first
              let contactId = null;
              if (quoteData.contract_id) {
                try {
                  const contractResponse = await fetch(`/api/contracts/${quoteData.contract_id}`);
                  if (contractResponse.ok) {
                    const contractData = await contractResponse.json();
                    contactId = contractData.contact_id;
                  }
                } catch (e) {
                  // Contract might not exist yet, that's okay
                }
              }
              
              // If no contact_id from contract, use lead_id from quote data (which is the contact/submission id)
              if (!contactId && quoteData.lead_id) {
                contactId = quoteData.lead_id;
              }
              
              // If we have a contact_id, check for payments
              if (contactId) {
                const paymentsResponse = await fetch(`/api/payments?contact_id=${contactId}`);
                if (paymentsResponse.ok) {
                  const paymentsData = await paymentsResponse.json();
                  const payments = paymentsData.payments || paymentsData || [];
                  
                  // Calculate total paid (including retainer/deposit)
                  const totalPaid = payments
                    .filter(p => 
                      p.payment_status === 'Paid' || 
                      p.payment_status === 'paid' || 
                      p.status === 'succeeded' || 
                      p.payment_status === 'completed'
                    )
                    .reduce((sum, p) => sum + (parseFloat(p.total_amount) || 0), 0);
                  
                  // Calculate outstanding balance
                  const balance = totalOwed - totalPaid;
                  
                  // Set hasPayment to true if any payment was made (including retainer/deposit)
                  setHasPayment(totalPaid > 0);
                  setOutstandingBalance(Math.max(0, balance)); // Ensure non-negative
                } else {
                  // If payment fetch fails, assume full amount is outstanding
                  setOutstandingBalance(totalOwed);
                  setHasPayment(false);
                }
              } else {
                // No contact yet, so no payments - full amount is outstanding
                setOutstandingBalance(totalOwed);
                setHasPayment(false);
              }
            } catch (e) {
              console.log('Could not fetch payment details:', e);
              // If we can't fetch payments, assume full amount is outstanding
              setOutstandingBalance(totalOwed);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching lead data:', error);
      
      // Try fallback with saved form data
      const savedFormData = sessionStorage.getItem('quote_form_data');
      if (savedFormData) {
        try {
          const formData = JSON.parse(savedFormData);
          console.log('✅ Using saved form data as fallback after network error');
          setLeadData({
            id: 'fallback',
            name: formData.name || 'Valued Customer',
            email: formData.email,
            phone: formData.phone,
            eventType: formData.eventType,
            eventDate: formData.eventDate,
            location: formData.location
          });
          setError(null);
          setLoading(false);
          return;
        } catch (e) {
          console.error('Failed to parse saved form data:', e);
        }
      }
      
      setError('Failed to load quote. Please check your connection and try again, or contact us directly.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchLeadData();
    }
  }, [id, fetchLeadData]);

  // Refetch data when the page becomes visible (e.g., navigating from invoice/contract pages)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && id) {
        fetchLeadData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id, fetchLeadData]);

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user?.email) {
          const adminEmails = [
            'admin@m10djcompany.com',
            'manager@m10djcompany.com',
            'djbenmurray@gmail.com'
          ];
          setIsAdmin(adminEmails.includes(user.email));
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
      }
    };
    
    checkAdmin();
  }, []);

  // Admin: fetch page view timeline for this quote
  useEffect(() => {
    if (!isAdmin || !id) return;
    let cancelled = false;
    setPageViewTimelineLoading(true);
    setPageViewTimeline([]);
    fetch(`/api/admin/quote-page-views?contactId=${encodeURIComponent(id)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load'))))
      .then((data) => {
        if (!cancelled && Array.isArray(data?.views)) {
          setPageViewTimeline(data.views);
        }
      })
      .catch(() => {
        if (!cancelled) setPageViewTimeline([]);
      })
      .finally(() => {
        if (!cancelled) setPageViewTimelineLoading(false);
      });
    return () => { cancelled = true; };
  }, [isAdmin, id]);

  // Track page view and time on page
  useEffect(() => {
    if (!id || !leadData || loading) return;

    const quoteId = id;
    const startTime = Date.now();
    let timeTrackingInterval = null;
    let hasTrackedView = false;

    // Track initial page view (with delay to ensure existingSelection is checked)
    const trackPageView = async () => {
      if (hasTrackedView) return;
      hasTrackedView = true;

      // Wait a bit to ensure existingSelection state is set
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        // Track page view for analytics
        await fetch('/api/analytics/quote-page-view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            quote_id: quoteId,
            event_type: 'page_view',
            metadata: {
              event_type: leadData.eventType || leadData.event_type,
              event_date: leadData.eventDate || leadData.event_date,
              location: leadData.location,
              name: leadData.name,
              has_selection: !!existingSelection
            }
          })
        });

        // Track for follow-up system if no existing selection
        // Check again in case selection was loaded after initial render
        const hasSelection = existingSelection || false;
        if (!hasSelection && leadData.id) {
          await fetch('/api/followups/track-view', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contactId: leadData.id,
              quoteId: quoteId,
              metadata: {
                event_type: leadData.eventType || leadData.event_type,
                event_date: leadData.eventDate || leadData.event_date,
                location: leadData.location
              }
            })
          }).catch(err => console.log('Follow-up tracking failed:', err));
        }
      } catch (error) {
        console.error('Error tracking page view:', error);
      }
    };

    // Track time on page at intervals
    const trackTimeOnPage = async (seconds) => {
      try {
        await fetch('/api/analytics/quote-page-view', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            quote_id: quoteId,
            event_type: 'time_on_page',
            time_spent: seconds,
            metadata: {
              selected_package: selectedPackage?.id || null,
              selected_addons_count: selectedAddons.length,
              event_type: leadData.eventType || leadData.event_type
            }
          })
        });
      } catch (error) {
        console.error('Error tracking time on page:', error);
      }
    };

    // Track page view immediately
    trackPageView();

    // Track time milestones: 10s, 30s, 60s, 2min, 5min
    const milestones = [10, 30, 60, 120, 300];
    let milestoneIndex = 0;

    timeTrackingInterval = setInterval(() => {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      
      // Track milestone if reached
      if (milestoneIndex < milestones.length && timeSpent >= milestones[milestoneIndex]) {
        trackTimeOnPage(milestones[milestoneIndex]);
        milestoneIndex++;
      }
    }, 5000); // Check every 5 seconds

    // Track final time when user leaves page
    const handleBeforeUnload = () => {
      const finalTime = Math.floor((Date.now() - startTime) / 1000);
      if (finalTime > 0) {
        // Use sendBeacon for reliable tracking on page unload
        const data = JSON.stringify({
          quote_id: quoteId,
          event_type: 'page_exit',
          time_spent: finalTime,
          metadata: {
            selected_package: selectedPackage?.id || null,
            selected_addons_count: selectedAddons.length
          }
        });
        
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/analytics/quote-page-view', data);
        } else {
          // Fallback for browsers without sendBeacon
          fetch('/api/analytics/quote-page-view', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: data,
            keepalive: true
          }).catch(() => {}); // Ignore errors on unload
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      if (timeTrackingInterval) {
        clearInterval(timeTrackingInterval);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
      
      // Track final time on cleanup
      const finalTime = Math.floor((Date.now() - startTime) / 1000);
      if (finalTime > 0) {
        fetch('/api/analytics/quote-page-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quote_id: quoteId,
            event_type: 'page_exit',
            time_spent: finalTime,
            metadata: {
              selected_package: selectedPackage?.id || null,
              selected_addons_count: selectedAddons.length
            }
          }),
          keepalive: true
        }).catch(() => {}); // Ignore errors on cleanup
      }
    };
  }, [id, leadData, loading, selectedPackage, selectedAddons, existingSelection]);

  // Auto-scroll to add-ons section when a package is selected
  useEffect(() => {
    if (selectedPackage) {
      // Use setTimeout to ensure the DOM has updated
      setTimeout(() => {
        const addonsSection = document.getElementById('addons-section');
        if (addonsSection) {
          addonsSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 100);
    }
  }, [selectedPackage]);

  // Auto-scroll to save button when a selection is made (package or speaker rental)
  useEffect(() => {
    if ((selectedPackage || selectedSpeakerRental) && !existingSelection) {
      // Use setTimeout to ensure the DOM has updated
      setTimeout(() => {
        const saveButton = document.getElementById('save-selections-button');
        if (saveButton) {
          saveButton.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 300);
    }
  }, [selectedPackage, selectedSpeakerRental, existingSelection]);

  // Determine event type from lead data (before early returns to ensure hooks can use it)
  const eventType = leadData?.eventType || leadData?.event_type || 'wedding';
  const eventTypeLower = eventType?.toLowerCase() || '';
  const isCorporate = eventTypeLower.includes('corporate') || eventTypeLower.includes('business');
  const isSchool = eventTypeLower.includes('school') || eventTypeLower.includes('dance') || eventTypeLower.includes('prom') || eventTypeLower.includes('homecoming');
  const isHoliday = eventTypeLower.includes('holiday') || eventTypeLower.includes('christmas') || eventTypeLower.includes('new year') || eventTypeLower.includes('thanksgiving') || eventTypeLower.includes('halloween');
  // Only consider it a wedding if it explicitly contains 'wedding' - no default fallback
  const isWedding = eventTypeLower.includes('wedding');
  // Private party includes birthday parties, private parties, and other party types (but not holidays, school events, or weddings)
  const isPrivateParty = (eventTypeLower.includes('private') || eventTypeLower.includes('party') || eventTypeLower.includes('birthday') || eventTypeLower === 'private_party') && !isHoliday && !isSchool && !isWedding;

  // Determine holiday theme based on event date
  const getHolidayTheme = useCallback(() => {
    if (!isHoliday || !leadData?.eventDate && !leadData?.event_date) {
      return null; // Default theme
    }

    const eventDateStr = leadData.eventDate || leadData.event_date;
    if (!eventDateStr) return null;

    try {
      // Parse date string as local date to avoid timezone issues
      let eventDate;
      if (typeof eventDateStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(eventDateStr)) {
        const datePart = eventDateStr.split('T')[0];
        const [year, month, day] = datePart.split('-');
        eventDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      } else {
        eventDate = new Date(eventDateStr);
      }
      const month = eventDate.getMonth() + 1; // 1-12
      const day = eventDate.getDate(); // 1-31

      // Halloween: October 1 - November 1
      if (month === 10 || (month === 11 && day <= 1)) {
        return {
          name: 'halloween',
          primary: '#f97316', // Orange
          secondary: '#1f2937', // Dark gray/black
          accent: '#fbbf24', // Amber
          gradient: 'from-orange-500 to-amber-600',
          bgGradient: 'from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',
          textColor: 'text-orange-600 dark:text-orange-400',
          bgColor: 'bg-orange-500',
          hoverColor: 'hover:bg-orange-600',
          borderColor: 'border-orange-300 dark:border-orange-700'
        };
      }

      // Thanksgiving: November (especially around Thanksgiving Day - 4th Thursday)
      if (month === 11) {
        return {
          name: 'thanksgiving',
          primary: '#d97706', // Amber
          secondary: '#92400e', // Brown
          accent: '#f59e0b', // Golden
          gradient: 'from-amber-600 to-orange-700',
          bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
          textColor: 'text-amber-700 dark:text-amber-400',
          bgColor: 'bg-amber-600',
          hoverColor: 'hover:bg-amber-700',
          borderColor: 'border-amber-300 dark:border-amber-700'
        };
      }

      // Christmas: December 1 - January 6 (Epiphany)
      if (month === 12 || (month === 1 && day <= 6)) {
        return {
          name: 'christmas',
          primary: '#dc2626', // Red
          secondary: '#16a34a', // Green
          accent: '#fbbf24', // Gold
          gradient: 'from-red-600 to-green-600',
          bgGradient: 'from-red-50 to-green-50 dark:from-red-900/20 dark:to-green-900/20',
          textColor: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-600',
          hoverColor: 'hover:bg-red-700',
          borderColor: 'border-red-300 dark:border-red-700'
        };
      }

      // New Year: Late December - Early January
      if ((month === 12 && day >= 20) || (month === 1 && day <= 10)) {
        return {
          name: 'newyear',
          primary: '#1e40af', // Blue
          secondary: '#fbbf24', // Gold
          accent: '#60a5fa', // Light blue
          gradient: 'from-blue-600 to-indigo-700',
          bgGradient: 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
          textColor: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-600',
          hoverColor: 'hover:bg-blue-700',
          borderColor: 'border-blue-300 dark:border-blue-700'
        };
      }

      // Valentine's Day: February
      if (month === 2) {
        return {
          name: 'valentines',
          primary: '#e11d48', // Pink/Red
          secondary: '#f43f5e', // Rose
          accent: '#fda4af', // Light pink
          gradient: 'from-pink-500 to-rose-600',
          bgGradient: 'from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20',
          textColor: 'text-pink-600 dark:text-pink-400',
          bgColor: 'bg-pink-500',
          hoverColor: 'hover:bg-pink-600',
          borderColor: 'border-pink-300 dark:border-pink-700'
        };
      }

      // St. Patrick's Day: March
      if (month === 3) {
        return {
          name: 'stpatricks',
          primary: '#16a34a', // Green
          secondary: '#15803d', // Dark green
          accent: '#86efac', // Light green
          gradient: 'from-green-500 to-emerald-600',
          bgGradient: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
          textColor: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-500',
          hoverColor: 'hover:bg-green-600',
          borderColor: 'border-green-300 dark:border-green-700'
        };
      }

      // Fourth of July: July
      if (month === 7) {
        return {
          name: 'july4th',
          primary: '#dc2626', // Red
          secondary: '#1e40af', // Blue
          accent: '#fbbf24', // Gold
          gradient: 'from-red-600 to-blue-600',
          bgGradient: 'from-red-50 to-blue-50 dark:from-red-900/20 dark:to-blue-900/20',
          textColor: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-600',
          hoverColor: 'hover:bg-red-700',
          borderColor: 'border-red-300 dark:border-red-700'
        };
      }

      // Default holiday theme (fallback)
      return {
        name: 'holiday',
        primary: '#f59e0b', // Amber
        secondary: '#d97706', // Orange
        accent: '#fbbf24', // Gold
        gradient: 'from-amber-500 to-orange-600',
        bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20',
        textColor: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-500',
        hoverColor: 'hover:bg-amber-600',
        borderColor: 'border-amber-300 dark:border-amber-700'
      };
    } catch (error) {
      console.error('Error parsing event date for holiday theme:', error);
      return null;
    }
  }, [isHoliday, leadData?.eventDate, leadData?.event_date]);

  const holidayTheme = getHolidayTheme();

  // Helper functions to get themed colors (fallback to brand colors if no theme)
  const getThemeBg = () => holidayTheme ? holidayTheme.bgColor : 'bg-brand';
  const getThemeText = () => holidayTheme ? holidayTheme.textColor : 'text-brand';
  const getThemeHover = () => holidayTheme ? holidayTheme.hoverColor : 'hover:bg-brand-dark';
  const getThemeBorder = () => holidayTheme ? holidayTheme.borderColor : 'border-brand';
  const getThemeGradient = () => holidayTheme ? `bg-gradient-to-br ${holidayTheme.gradient}` : 'bg-gradient-to-br from-brand to-brand-dark';
  const getThemeBgGradient = () => holidayTheme ? `bg-gradient-to-br ${holidayTheme.bgGradient}` : 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900';

  // Pricing configuration state
  const [pricingConfig, setPricingConfig] = useState(null);
  const [pricingLoading, setPricingLoading] = useState(true);

  // Fetch pricing configuration from database
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await fetch('/api/admin/pricing');
        if (response.ok) {
          const data = await response.json();
          setPricingConfig(data);
        }
      } catch (error) {
        console.error('Error fetching pricing config:', error);
        // Fall back to default pricing if API fails
      } finally {
        setPricingLoading(false);
      }
    };
    fetchPricing();
  }, []);

  // Default pricing (fallback if API fails or while loading)
  const defaultPricing = {
    package1_price: 2000,
    package1_a_la_carte_price: 2600,
    package2_price: 2500,
    package2_a_la_carte_price: 3400,
    package3_price: 3000,
    package3_a_la_carte_price: 3900,
    package1_breakdown: [],
    package2_breakdown: [],
    package3_breakdown: [],
    addons: []
  };

  const activePricing = pricingConfig || defaultPricing;

  // Wedding Packages
  const weddingPackages = [
    {
      id: 'package1',
      name: 'Package 1',
      price: activePricing.package1_price,
      aLaCartePrice: activePricing.package1_a_la_carte_price,
      description: 'Reception Only',
      features: [
        'Up to 4 hours of DJ/MC services at reception',
        'Speakers & microphones included',
        'Dance Floor Lighting',
        'Multi-color LED fixtures for dance floor',
        'Uplighting (16 multicolor LED fixtures)',
        'Additional Speaker',
        'Perfect for cocktail hours separate from reception'
      ],
      popular: false
    },
    {
      id: 'package2',
      name: 'Package 2',
      price: activePricing.package2_price,
      aLaCartePrice: activePricing.package2_a_la_carte_price,
      description: 'Complete Wedding - Most Popular',
      features: [
        'Up to 6 hours of DJ/MC services (ceremony + cocktail hour + reception)',
        'Speakers & microphones included',
        'Ceremony Audio (ceremony music + microphones)',
        'Cocktail Hour music & DJ services',
        'Dance Floor Lighting',
        'Multi-color LED fixtures for dance floor',
        'Uplighting (16 multicolor LED fixtures)',
        'Additional Speaker (perfect for cocktail hour or ceremony/reception separation)'
      ],
      popular: true
    },
    {
      id: 'package3',
      name: 'Package 3',
      price: activePricing.package3_price,
      aLaCartePrice: activePricing.package3_a_la_carte_price,
      description: 'Complete Wedding + Special Effects - Premium Experience',
      features: [
        'Everything in Package 2, plus:',
        'Dancing on the Clouds',
        'Sophisticated dry ice effect for first dance',
        'Up to 6 hours of DJ/MC services (ceremony + cocktail hour + reception)',
        'All lighting, speakers, and equipment from Package 2'
      ],
      popular: false
    }
  ];

  // Corporate Packages
  const corporatePackages = [
    {
      id: 'corporate-basics',
      name: 'Just the Basics',
      price: 850,
      aLaCartePrice: 850,
      description: 'Essential Corporate Services',
      features: [
        'Up to 3 hours of DJ/MC services',
        'Speakers & microphone included',
        'Professional setup & coordination',
        'Background music during networking',
        'Professional business attire'
      ],
      popular: false
    },
    {
      id: 'corporate-package1',
      name: 'Package #1',
      price: 1095,
      aLaCartePrice: 1195,
      description: 'Complete Corporate Entertainment - Most Popular',
      features: [
        'Up to 4 hours of DJ/MC services',
        'Speakers & microphones included',
        'Dance Floor Lighting',
        'Multi-color LED fixtures for lighting the audience, dance floor, and/or performer',
        'Professional setup & coordination',
        'A/V support for presentations',
        'Professional business attire'
      ],
      popular: true
    },
    {
      id: 'corporate-package2',
      name: 'Package #2',
      price: 1345,
      aLaCartePrice: 1495,
      description: 'Premium Corporate Experience',
      features: [
        'Up to 4 hours of DJ/MC services',
        'Speakers & microphones included',
        'Dance Floor Lighting',
        'Multi-color LED fixtures for lighting the audience, dance floor, and/or performer',
        'Uplighting (up to 16 multicolor LED fixtures)',
        'Enhanced venue ambiance',
        'Professional setup & coordination',
        'A/V support for presentations'
      ],
      popular: false
    }
  ];

  // School Packages (same pricing as corporate)
  const schoolPackages = [
    {
      id: 'school-basics',
      name: 'Just the Basics',
      price: 850,
      aLaCartePrice: 850,
      description: 'Essential School Event Services',
      features: [
        'Up to 3 hours of DJ/MC services',
        'Speakers & microphone included',
        'Age-appropriate music library',
        'Dance floor lighting',
        'Professional setup & coordination',
        'School administrator approved content'
      ],
      popular: false
    },
    {
      id: 'school-package1',
      name: 'Package #1',
      price: 1095,
      aLaCartePrice: 1195,
      description: 'Complete School Dance Entertainment - Most Popular',
      features: [
        'Up to 4 hours of DJ/MC services',
        'Speakers & microphones included',
        'Dance Floor Lighting',
        'Multi-color LED fixtures for lighting the audience, dance floor, and/or performer',
        'School-appropriate music library',
        'Special announcements (court, awards, etc.)',
        'Professional setup & coordination',
        'Backup equipment included'
      ],
      popular: true
    },
    {
      id: 'school-package2',
      name: 'Package #2',
      price: 1345,
      aLaCartePrice: 1495,
      description: 'Premium School Dance Experience',
      features: [
        'Up to 4 hours of DJ/MC services',
        'Speakers & microphones included',
        'Dance Floor Lighting',
        'Multi-color LED fixtures for lighting the audience, dance floor, and/or performer',
        'Uplighting (up to 16 multicolor LED fixtures)',
        'Enhanced venue ambiance',
        'School-appropriate music library',
        'Photo-ready atmosphere',
        'Professional setup & coordination'
      ],
      popular: false
    }
  ];

  // Holiday Party Packages
  const holidayPackages = [
    {
      id: 'holiday-basics',
      name: 'Holiday Essentials',
      price: 500,
      aLaCartePrice: 500,
      description: 'Perfect for Small Holiday Gatherings',
      features: [
        'Up to 2 hours of DJ/MC services',
        'DJ equipment & turntables included',
        'Holiday music library',
        'Professional DJ services',
        'Background music & announcements',
        'Note: Speakers and lighting must be provided separately or added as add-ons',
        'Perfect for office parties, family gatherings, and intimate celebrations'
      ],
      popular: false
    },
    {
      id: 'holiday-package1',
      name: 'Holiday Celebration',
      price: 900,
      aLaCartePrice: 1000,
      description: 'Complete Holiday Party Entertainment - Most Popular',
      features: [
        'Up to 4 hours of DJ/MC services',
        'Speakers & microphones included',
        'Holiday Dance Floor Lighting',
        'Multi-color LED fixtures with festive colors',
        'Holiday music library (all genres)',
        'Professional setup & coordination',
        'Perfect for medium-sized holiday parties'
      ],
      popular: true
    },
    {
      id: 'holiday-package2',
      name: 'Holiday Premium',
      price: 1400,
      aLaCartePrice: 1600,
      description: 'Premium Holiday Experience with Special Effects',
      features: [
        'Up to 4 hours of DJ/MC services',
        'Speakers & microphones included',
        'Holiday Dance Floor Lighting',
        'Festive Uplighting (up to 16 multicolor LED fixtures)',
        'Holiday-themed venue ambiance',
        'Holiday music library (all genres)',
        'Professional setup & coordination',
        'Photo-ready atmosphere for holiday memories'
      ],
      popular: false
    }
  ];

  // Memoize packages to prevent unnecessary re-renders
  // Holiday parties have their own specialized packages
  const packages = useMemo(() => {
    if (isSchool) {
      return schoolPackages;
    } else if (isHoliday) {
      return holidayPackages;
    } else if (isCorporate || isPrivateParty) {
      return corporatePackages;
    } else {
      return weddingPackages;
    }
  }, [isCorporate, isSchool, isHoliday, isPrivateParty]);

  // Wedding Addons
  const weddingAddons = [
    {
      id: 'dj_mc_4hours',
      name: '4 Hours DJ/MC Services (A La Carte)',
      description: 'Professional DJ and MC services for up to 4 hours. Includes sound system, microphones, and music library. Perfect for receptions.',
      price: 1600
    },
    {
      id: 'dj_mc_3hours',
      name: 'Up to 3 Hours DJ/MC Services (A La Carte)',
      description: 'Professional DJ and MC services for up to 3 hours. Includes sound system, microphones, and music library.',
      price: 1300
    },
    {
      id: 'ceremony_audio',
      name: 'Ceremony Audio',
      description: 'Additional hour of DJ services + ceremony music programming. Perfect for couples who want professional audio for their ceremony.',
      price: 500
    },
    {
      id: 'dance_floor_lighting',
      name: 'Dance Floor Lighting',
      description: 'Multi-color LED fixtures for lighting the dance floor, audience, and/or performer. Creates an energetic atmosphere.',
      price: 400
    },
    {
      id: 'uplighting',
      name: 'Uplighting (16 fixtures)',
      description: 'Up to 16 multicolor LED fixtures to enhance your venue ambiance. Perfect for creating a romantic or energetic atmosphere.',
      price: 350
    },
    {
      id: 'monogram',
      name: 'Monogram Projection',
      description: 'A custom graphic showing the names or initials of newlyweds. The font and look is fully customizable to fit clients needs. Monograms can be projected on any floor or wall.',
      price: 350
    },
    {
      id: 'speaker_rental',
      name: 'Speaker Rental (Basic Setup)',
      description: 'Professional speaker system rental with built-in mixer. Perfect for cocktail hours, ceremonies, or separate areas. Includes microphone input.',
      price: 250
    },
    {
      id: 'additional_speaker',
      name: 'Cocktail Hour Audio',
      description: 'Extra powered speaker with built-in mixer for microphone or auxiliary inputs. Perfect for cocktail hours that are separate from the reception.',
      price: 250
    },
    {
      id: 'additional_hour',
      name: 'Additional Hour(s)',
      description: 'Additional DJ/MC services beyond the 4-hour package. Perfect if your event runs longer than expected.',
      price: 300,
      per: 'hour'
    },
    {
      id: 'uplighting_addon',
      name: 'Uplighting Add-on',
      description: 'Additional uplighting fixtures beyond package inclusion (up to 16 fixtures included in base uplighting).',
      price: 300
    },
    {
      id: 'dancing_clouds',
      name: 'Dancing on the Clouds',
      description: 'Sophisticated dry ice effect for first dance and special moments. Creates a magical, floor-hugging cloud effect.',
      price: 500
    },
    {
      id: 'cold_spark',
      name: 'Cold Spark Fountain Effect',
      description: 'Dramatic indoor-safe spark effects for grand entrances or special moments. Safe for indoor use, creates stunning visual effects.',
      price: 600
    }
  ];

  // Holiday Party Addons (adapted from wedding offerings, themed for holidays)
  const holidayAddons = [
    {
      id: 'holiday_additional_2hours',
      name: '2 Additional Hours',
      description: 'Extend your event by 2 hours. Professional DJ and MC services with sound system, microphones, and comprehensive holiday music library. Perfect for longer celebrations.',
      price: 400
    },
    {
      id: 'holiday_additional_hour',
      name: '1 Additional Hour',
      description: 'Extend your event by 1 hour. Professional DJ and MC services with sound system, microphones, and holiday music library.',
      price: 200,
      per: 'hour'
    },
    {
      id: 'holiday_speaker_additional_hours',
      name: 'Additional Speaker Rental Hours',
      description: 'Additional hours for speaker rental beyond the included 4 hours. Perfect for longer events. $100 per hour.',
      price: 100,
      per: 'hour'
    },
    {
      id: 'holiday_dance_floor_lighting',
      name: 'Holiday Dance Floor Lighting',
      description: 'Multi-color LED fixtures with festive holiday colors for lighting the dance floor, audience, and/or performer. Creates an energetic holiday atmosphere.',
      price: 350
    },
    {
      id: 'holiday_uplighting',
      name: 'Holiday Uplighting (16 fixtures)',
      description: 'Up to 16 multicolor LED fixtures with festive holiday colors to enhance your venue ambiance. Perfect for creating a warm, celebratory holiday atmosphere.',
      price: 300
    },
    {
      id: 'holiday_logo_projection',
      name: 'Holiday Logo/Name Projection',
      description: 'A custom graphic showing your company name, event theme, or holiday message. Fully customizable fonts and designs. Perfect for projecting on floors or walls at holiday parties.',
      price: 300
    },
    {
      id: 'holiday_speaker_rental',
      name: 'Speaker Setup Rental (Up to 4 Hours)',
      description: 'Professional speaker system rental with built-in mixer for up to 4 hours. Perfect for separate areas, outdoor spaces, or multiple rooms at your holiday event. Includes microphone input and all necessary cables.',
      price: 400
    },
    {
      id: 'holiday_uplighting_addon',
      name: 'Additional Holiday Uplighting',
      description: 'Additional uplighting fixtures beyond package inclusion (up to 16 fixtures included in base uplighting). Perfect for larger venues.',
      price: 250
    },
    {
      id: 'holiday_winter_wonderland',
      name: 'Winter Wonderland Effect',
      description: 'Sophisticated dry ice effect for special holiday moments. Creates a magical, floor-hugging cloud effect perfect for holiday entrances or special announcements.',
      price: 400
    },
    {
      id: 'holiday_cold_spark',
      name: 'Holiday Spark Fountain Effect',
      description: 'Dramatic indoor-safe spark effects for grand holiday entrances or special moments. Safe for indoor use, creates stunning visual effects that add excitement to your celebration.',
      price: 450
    },
    {
      id: 'holiday_photo_booth_lighting',
      name: 'Photo Booth Lighting Package',
      description: 'Professional lighting setup specifically designed for photo areas. Ensures perfect lighting for holiday party photos and memories.',
      price: 250
    },
    {
      id: 'holiday_flat_screen',
      name: 'Flat Screen TV w/ Stand',
      description: 'Includes a 65" TV mounted on a free-standing column. Great for displaying holiday slideshows, announcements, or visualizers at your event.',
      price: 300
    }
  ];

  // Corporate Addons
  const corporateAddons = [
    {
      id: 'dj_mc_4hours',
      name: '4 Hours DJ/MC Services (A La Carte)',
      description: 'Professional DJ and MC services for up to 4 hours. Includes sound system, microphones, and music library. Perfect for corporate events.',
      price: 945
    },
    {
      id: 'dj_mc_3hours',
      name: 'Up to 3 Hours DJ/MC Services (A La Carte)',
      description: 'Professional DJ and MC services for up to 3 hours. Includes sound system, microphones, and music library.',
      price: 850
    },
    {
      id: 'dance_floor_lighting',
      name: 'Dance Floor Lighting',
      description: 'Multi-color LED fixtures for lighting the audience, dance floor, and/or performer. Creates an energetic atmosphere.',
      price: 250
    },
    {
      id: 'uplighting',
      name: 'Uplighting (16 fixtures)',
      description: 'Up to 16 multicolor LED fixtures to enhance your venue ambiance. Perfect for creating a professional atmosphere.',
      price: 300
    },
    {
      id: 'monogram',
      name: 'Monogram/Graphic Projection',
      description: 'A custom graphic displaying the names, initials or artwork of your choosing. The look is fully customizable to fit clients needs. Monograms and graphics can be projected on any floor or wall.',
      price: 300
    },
    {
      id: 'speaker_rental',
      name: 'Speaker Rental (Basic Setup)',
      description: 'Professional speaker system rental with built-in mixer. Perfect for presentations, cocktail hours, or separate areas. Includes microphone input.',
      price: 150
    },
    {
      id: 'additional_speaker',
      name: 'Cocktail Hour Audio',
      description: 'Extra powered speaker with built-in mixer for microphone or auxiliary inputs. Perfect for separate areas or presentations.',
      price: 150
    },
    {
      id: 'flat_screen_tv',
      name: 'Flat Screen TV w/ Stand',
      description: 'Includes a 65" TV mounted on a free-standing column. Many clients add our mounted TV to their event for displaying slideshows, presentations, and visualizers.',
      price: 300
    },
    {
      id: 'additional_hour',
      name: 'Additional hour(s)',
      description: 'If you anticipate that your event will run longer than the time included with your package, you can choose this ahead of time; or if we happen to run over on the day, we can invoice you for the extra time after the fact.',
      price: 150,
      per: 'hour'
    },
    {
      id: 'uplighting_addon',
      name: 'Uplighting Add-on',
      description: 'Additional uplighting fixtures beyond package inclusion (up to 16 fixtures included in base uplighting).',
      price: 300
    },
    {
      id: 'dancing_clouds',
      name: 'Dancing on the Clouds',
      description: 'Capture the magic with our "Dancing on the Clouds" effect. A sophisticated dry ice system creates a dense, floor-hugging cloud, perfect for special moments.',
      price: 500
    },
    {
      id: 'cold_spark',
      name: 'Cold Spark Fountain Effect',
      description: 'Elevate your event with the awe-inspiring spectacle of Cold Spark Machines. Safe for indoors, these machines produce a stunning spark effect, adding a dramatic flair to entrances or special moments.',
      price: 500
    }
  ];

  // School Addons (similar to corporate but with school-appropriate descriptions)
  const schoolAddons = [
    {
      id: 'dj_mc_4hours',
      name: '4 Hours DJ/MC Services (A La Carte)',
      description: 'Professional DJ and MC services for up to 4 hours. Includes sound system, microphones, and age-appropriate music library. Perfect for school dances and events.',
      price: 945
    },
    {
      id: 'dj_mc_3hours',
      name: 'Up to 3 Hours DJ/MC Services (A La Carte)',
      description: 'Professional DJ and MC services for up to 3 hours. Includes sound system, microphones, and age-appropriate music library. Perfect for shorter school events.',
      price: 850
    },
    {
      id: 'dance_floor_lighting',
      name: 'Dance Floor Lighting',
      description: 'Multi-color LED fixtures for lighting the audience, dance floor, and/or performer. Creates an energetic atmosphere perfect for school dances.',
      price: 250
    },
    {
      id: 'uplighting',
      name: 'Uplighting (16 fixtures)',
      description: 'Up to 16 multicolor LED fixtures to enhance your venue ambiance. Perfect for prom and formal dances.',
      price: 300
    },
    {
      id: 'school_logo_projection',
      name: 'School Logo/Graphic Projection',
      description: 'Project your school logo, mascot, or custom graphics on walls or floors. Perfect for school spirit and themed events.',
      price: 300
    },
    {
      id: 'speaker_rental',
      name: 'Speaker Rental (Basic Setup)',
      description: 'Professional speaker system rental with built-in mixer. Perfect for announcements, presentations, or separate areas. Includes microphone input.',
      price: 150
    },
    {
      id: 'additional_speaker',
      name: 'Cocktail Hour Audio',
      description: 'Extra powered speaker with built-in mixer for microphone or auxiliary inputs. Perfect for separate areas or outdoor school events.',
      price: 150
    },
    {
      id: 'flat_screen_tv',
      name: 'Flat Screen TV w/ Stand',
      description: 'Includes a 65" TV mounted on a free-standing column. Great for displaying slideshows, announcements, or visualizers at school events.',
      price: 300
    },
    {
      id: 'additional_hour',
      name: 'Additional hour(s)',
      description: 'If you anticipate that your event will run longer than the time included with your package, you can choose this ahead of time; or if we happen to run over on the day, we can invoice you for the extra time after the fact.',
      price: 150,
      per: 'hour'
    },
    {
      id: 'uplighting_addon',
      name: 'Uplighting Add-on',
      description: 'Additional uplighting fixtures beyond package inclusion (up to 16 fixtures included in base uplighting).',
      price: 300
    },
    {
      id: 'dancing_clouds',
      name: 'Dancing on the Clouds',
      description: 'Create a magical atmosphere with our "Dancing on the Clouds" effect. A sophisticated dry ice system creates a dense, floor-hugging cloud, perfect for special moments and photo opportunities.',
      price: 500
    },
    {
      id: 'cold_spark',
      name: 'Cold Spark Fountain Effect',
      description: 'Elevate your school event with the awe-inspiring spectacle of Cold Spark Machines. Safe for indoors, these machines produce a stunning spark effect, adding dramatic flair to entrances or special moments.',
      price: 500
    }
  ];

  // Memoize addons to prevent unnecessary re-renders
  const addons = useMemo(() => {
    // Holiday parties have their own specialized addons
    let defaultAddons = isSchool ? schoolAddons : (isHoliday ? holidayAddons : (isCorporate || isPrivateParty ? corporateAddons : weddingAddons));
    
    // Remove speaker rental from addons list for holiday parties (it's now a standalone selection)
    if (isHoliday) {
      defaultAddons = defaultAddons.filter(a => a.id !== 'holiday_speaker_rental');
    }
    
    // If we have addons from pricing config, merge them with defaults
    if (activePricing && activePricing.addons && activePricing.addons.length > 0) {
      // Override with pricing config addons, or add new ones
      const mergedAddons = [...defaultAddons];
      activePricing.addons.forEach(configAddon => {
        const existingIndex = mergedAddons.findIndex(a => a.id === configAddon.id);
        if (existingIndex >= 0) {
          // Update existing addon with new price
          mergedAddons[existingIndex] = {
            ...mergedAddons[existingIndex],
            price: configAddon.price,
            name: configAddon.name || mergedAddons[existingIndex].name,
            description: configAddon.description || mergedAddons[existingIndex].description
          };
        } else {
          // Add new addon from config
          mergedAddons.push({
            id: configAddon.id,
            name: configAddon.name,
            price: configAddon.price,
            description: configAddon.description || ''
          });
        }
      });
      
      return mergedAddons;
    }
    
    return defaultAddons;
  }, [isCorporate, isSchool, isHoliday, isPrivateParty, activePricing, weddingAddons, corporateAddons, schoolAddons, holidayAddons]);

  // Smart recommendation function based on special requests and guest count
  const getSmartRecommendations = useMemo(() => {
    if (!leadData) return null;
    
    const specialRequests = (leadData.specialRequests || leadData.special_requests || '').toLowerCase();
    const guestCount = leadData.guestCount || leadData.guest_count || '';
    const guestCountNum = parseInt(guestCount) || 0;
    
    if (!specialRequests && !guestCount) return null;
    
    const recommendations = {
      packages: [],
      addons: [],
      message: '',
      keywords: []
    };
    
    // Analyze keywords in special requests (normalize text first)
    const normalizedRequest = specialRequests
      .replace(/🔥|💡|🎵|🎶|🎤|🎧|🔊|📢/g, '') // Remove emojis
      .toLowerCase()
      .trim();
    
    const keywords = {
      sound: ['sound', 'speaker', 'audio', 'sound equipment', 'sound system', 'pa system', 'microphone', 'mic', 'speakers', 'equipment'],
      lighting: ['light', 'lighting', 'uplight', 'dance floor', 'ambiance', 'lights'],
      outdoor: ['bonfire', 'outdoor', 'outside', 'patio', 'backyard', 'garden', 'beach', 'yard'],
      dj: ['dj', 'music', 'mc', 'emcee', 'entertainment'],
      large: ['large', 'big', 'many', 'crowd', 'group'],
      small: ['small', 'intimate', 'few']
    };
    
    // Detect keywords
    const detectedKeywords = [];
    Object.entries(keywords).forEach(([category, terms]) => {
      if (terms.some(term => normalizedRequest.includes(term))) {
        detectedKeywords.push(category);
      }
    });
    
    // Build recommendation message
    let recommendationText = '';
    if (specialRequests) {
      // Use normalized request for cleaner display (remove emojis, truncate if needed)
      const displayRequest = normalizedRequest.length > 80 
        ? normalizedRequest.substring(0, 80) + '...' 
        : normalizedRequest;
      recommendationText = `Based on your note "${displayRequest}"`;
      if (guestCount) {
        recommendationText += ` and ${guestCount} guests`;
      }
      recommendationText += ', we thought this selection might work for you.';
    } else if (guestCount) {
      recommendationText = `Based on your event size (${guestCount} guests), we thought this selection might work for you.`;
    }
    
    // Recommend packages and addons based on detected keywords
    if (detectedKeywords.includes('sound')) {
      // Sound equipment needed - recommend speaker rentals or packages with speakers
      if (isHoliday) {
        recommendations.addons.push('holiday_speaker_rental');
        // For outdoor events, recommend packages that include speakers
        if (detectedKeywords.includes('outdoor')) {
          recommendations.packages.push('holiday-package1'); // Includes speakers
        }
      } else if (isCorporate || isSchool) {
        recommendations.addons.push('speaker_rental');
        recommendations.addons.push('additional_speaker');
        // For outdoor events, recommend packages that include speakers
        if (detectedKeywords.includes('outdoor')) {
          recommendations.packages.push('corporate-package1');
          recommendations.packages.push('school-package1');
        }
      } else {
        // Wedding/private party - recommend speaker rentals
        recommendations.addons.push('speaker_rental');
        recommendations.addons.push('additional_speaker');
        // For outdoor events, recommend packages that include speakers
        if (detectedKeywords.includes('outdoor')) {
          recommendations.packages.push('package1');
          recommendations.packages.push('package2');
        }
      }
    }
    
    // Outdoor events (even without explicit sound keyword) may need speakers
    if (detectedKeywords.includes('outdoor') && !detectedKeywords.includes('sound')) {
      if (isHoliday) {
        recommendations.addons.push('holiday_speaker_rental');
      } else {
        recommendations.addons.push('speaker_rental');
        recommendations.addons.push('additional_speaker');
      }
    }
    
    // Guest count recommendations
    if (guestCountNum > 0) {
      if (guestCountNum >= 100) {
        // Large events need more equipment
        if (isHoliday) {
          recommendations.packages.push('holiday-package2');
        } else if (isCorporate || isSchool) {
          recommendations.packages.push('corporate-package2');
          recommendations.packages.push('school-package2');
        } else {
          recommendations.packages.push('package2');
          recommendations.packages.push('package3');
        }
      } else if (guestCountNum >= 50) {
        // Medium events
        if (isHoliday) {
          recommendations.packages.push('holiday-package1');
        } else if (isCorporate || isSchool) {
          recommendations.packages.push('corporate-package1');
          recommendations.packages.push('school-package1');
        } else {
          recommendations.packages.push('package1');
          recommendations.packages.push('package2');
        }
      } else {
        // Smaller events
        if (isHoliday) {
          recommendations.packages.push('holiday-basics');
        } else if (isCorporate || isSchool) {
          recommendations.packages.push('corporate-basics');
          recommendations.packages.push('school-basics');
        }
      }
    }
    
    // Only return recommendations if we have something to recommend
    if (recommendations.packages.length > 0 || recommendations.addons.length > 0) {
      recommendations.message = recommendationText;
      recommendations.keywords = detectedKeywords;
      return recommendations;
    }
    
    return null;
  }, [leadData, isHoliday, isCorporate, isSchool]);
  
  const smartRecommendations = getSmartRecommendations;

  // Auto-select recommended package from URL parameter
  useEffect(() => {
    if (router.isReady && router.query.recommended && packages && packages.length > 0 && !selectedPackage && !existingSelection && leadData) {
      const recommendedPackageId = router.query.recommended;
      const recommendedPackage = packages.find(pkg => pkg.id === recommendedPackageId);
      
      if (recommendedPackage) {
        console.log('Auto-selecting recommended package:', recommendedPackageId);
        setSelectedPackage(recommendedPackage);
        
        // Also handle recommended addons if provided
        if (router.query.addons && addons && addons.length > 0) {
          const addonIds = router.query.addons.split(',');
          const recommendedAddons = addons.filter(addon => 
            addonIds.some(id => {
              const normalizedId = id.toLowerCase().replace(/_/g, '');
              const normalizedAddonId = addon.id.toLowerCase().replace(/_/g, '');
              return normalizedAddonId.includes(normalizedId) || normalizedId.includes(normalizedAddonId);
            })
          );
          if (recommendedAddons.length > 0) {
            setSelectedAddons(recommendedAddons);
          }
        }
        
        // Scroll to packages section after a brief delay
        setTimeout(() => {
          const packagesSection = document.getElementById('packages-section') || document.querySelector('[data-packages]');
          if (packagesSection) {
            packagesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 500);
      }
    }
  }, [router.isReady, router.query.recommended, router.query.addons, packages, addons, selectedPackage, existingSelection, leadData]);

  const getPackageBreakdown = (packageId) => {
    const breakdowns = {
      // Wedding Package Breakdowns
      'package1': [
        { item: 'Up to 4 Hours DJ/MC Services', description: 'Professional DJ and MC services for up to 4 hours. Includes sound system, microphones, and music library.', price: 1600 },
        { item: 'Dance Floor Lighting', description: 'Multi-color LED fixtures for lighting the dance floor, audience, and/or performer.', price: 400 },
        { item: 'Uplighting (16 fixtures)', description: 'Up to 16 multicolor LED fixtures to enhance your venue ambiance.', price: 350 },
        { item: 'Additional Speaker', description: 'Extra powered speaker with built-in mixer for microphone or auxiliary inputs.', price: 250 }
      ],
      'package2': [
        { item: 'Complete Wedding Day Coverage (Up to 6 hours)', description: 'Full-day DJ/MC services covering ceremony, cocktail hour, and reception. Includes seamless transitions, setup time, and coordination between all events. Ensures smooth flow and protects against rushing or overtime fees.', price: 2400 },
        { item: 'Dance Floor Lighting', description: 'Multi-color LED fixtures for lighting the dance floor, audience, and/or performer.', price: 400 },
        { item: 'Uplighting (16 fixtures)', description: 'Up to 16 multicolor LED fixtures to enhance your venue ambiance.', price: 350 },
        { item: 'Additional Speaker', description: 'Extra powered speaker with built-in mixer for microphone or auxiliary inputs. Perfect for cocktail hours that are separate from the reception.', price: 250 }
      ],
      'package3': [
        { item: 'Complete Wedding Day Coverage (Up to 6 hours)', description: 'Full-day DJ/MC services covering ceremony, cocktail hour, and reception. Includes seamless transitions, setup time, and coordination between all events. Ensures smooth flow and protects against rushing or overtime fees.', price: 2400 },
        { item: 'Dance Floor Lighting', description: 'Multi-color LED fixtures for lighting the dance floor, audience, and/or performer.', price: 400 },
        { item: 'Uplighting (16 fixtures)', description: 'Up to 16 multicolor LED fixtures to enhance your venue ambiance.', price: 350 },
        { item: 'Additional Speaker', description: 'Extra powered speaker with built-in mixer for microphone or auxiliary inputs. Perfect for cocktail hours that are separate from the reception.', price: 250 },
        { item: 'Dancing on the Clouds', description: 'Sophisticated dry ice effect for first dance and special moments. Creates a magical, floor-hugging cloud effect.', price: 500 }
      ],
      // Corporate Package Breakdowns
      'corporate-basics': [
        { item: 'Up to 3 Hours DJ/MC Services', description: 'Professional DJ and MC services for up to 3 hours. Includes sound system, microphones, and music library.', price: 850 }
      ],
      'corporate-package1': [
        { item: '4 Hours DJ/MC Services', description: 'Professional DJ and MC services for up to 4 hours. Includes sound system, microphones, and music library.', price: 945 },
        { item: 'Dance Floor Lighting', description: 'Multi-color LED fixtures for lighting the audience, dance floor, and/or performer.', price: 250 }
      ],
      'corporate-package2': [
        { item: '4 Hours DJ/MC Services', description: 'Professional DJ and MC services for up to 4 hours. Includes sound system, microphones, and music library.', price: 945 },
        { item: 'Dance Floor Lighting', description: 'Multi-color LED fixtures for lighting the audience, dance floor, and/or performer.', price: 250 },
        { item: 'Uplighting (16 fixtures)', description: 'Up to 16 multicolor LED fixtures to enhance your venue ambiance.', price: 300 }
      ],
      // School Package Breakdowns (same as corporate)
      'school-basics': [
        { item: '3 Hours DJ/MC Services', description: 'Professional DJ and MC services for up to 3 hours. Includes sound system, microphones, and age-appropriate music library.', price: 850 }
      ],
      'school-package1': [
        { item: '4 Hours DJ/MC Services', description: 'Professional DJ and MC services for up to 4 hours. Includes sound system, microphones, and age-appropriate music library.', price: 945 },
        { item: 'Dance Floor Lighting', description: 'Multi-color LED fixtures for lighting the audience, dance floor, and/or performer.', price: 250 }
      ],
      'school-package2': [
        { item: '4 Hours DJ/MC Services', description: 'Professional DJ and MC services for up to 4 hours. Includes sound system, microphones, and age-appropriate music library.', price: 945 },
        { item: 'Dance Floor Lighting', description: 'Multi-color LED fixtures for lighting the audience, dance floor, and/or performer.', price: 250 },
        { item: 'Uplighting (16 fixtures)', description: 'Up to 16 multicolor LED fixtures to enhance your venue ambiance.', price: 300 }
      ],
      // Holiday Package Breakdowns
      'holiday-basics': [
        { item: 'Up to 2 Hours DJ/MC Services', description: 'Professional DJ and MC services for up to 2 hours. Includes DJ equipment and turntables. Note: Speakers and lighting must be provided separately or added as add-ons.', price: 500 }
      ],
      'holiday-package1': [
        { item: '4 Hours DJ/MC Services', description: 'Professional DJ and MC services for up to 4 hours. Includes sound system, microphones, and comprehensive holiday music library.', price: 700 },
        { item: 'Holiday Dance Floor Lighting', description: 'Multi-color LED fixtures with festive holiday colors for lighting the dance floor, audience, and/or performer.', price: 200 }
      ],
      'holiday-package2': [
        { item: '4 Hours DJ/MC Services', description: 'Professional DJ and MC services for up to 4 hours. Includes sound system, microphones, and comprehensive holiday music library.', price: 700 },
        { item: 'Holiday Dance Floor Lighting', description: 'Multi-color LED fixtures with festive holiday colors for lighting the dance floor, audience, and/or performer.', price: 200 },
        { item: 'Holiday Uplighting (16 fixtures)', description: 'Up to 16 multicolor LED fixtures with festive holiday colors to enhance your venue ambiance.', price: 500 }
      ]
    };
    return breakdowns[packageId] || [];
  };

  // Admin: Handle package customization
  const handleAdminSelectPackage = (pkg) => {
    if (!pkg || !pkg.id) {
      console.error('Invalid package provided to handleAdminSelectPackage');
      return;
    }
    
    if (!adminMode) {
      setSelectedPackage(pkg);
      return;
    }
    
    // In admin mode, initialize customization
    const breakdown = getPackageBreakdown(pkg.id);
    if (!breakdown || breakdown.length === 0) {
      console.warn('No breakdown found for package:', pkg.id);
      setSelectedPackage(pkg);
      return;
    }
    
    setSelectedPackage(pkg);
    setCustomizedPackage({
      ...pkg,
      originalPrice: pkg.price || 0,
      originalALaCartePrice: pkg.aLaCartePrice || 0
    });
    setCustomizedFeatures(breakdown.map(item => ({ ...item, removed: false })));
  };

  // Admin: Toggle feature removal
  const handleToggleFeature = (featureIndex) => {
    if (!adminMode || !customizedFeatures.length || featureIndex < 0 || featureIndex >= customizedFeatures.length) {
      return;
    }
    
    const updated = [...customizedFeatures];
    updated[featureIndex].removed = !updated[featureIndex].removed;
    setCustomizedFeatures(updated);
    
    // Recalculate package price
    const removedTotal = updated
      .filter(f => f && f.removed)
      .reduce((sum, f) => sum + (Number(f.price) || 0), 0);
    
    const basePrice = customizedPackage?.originalPrice || selectedPackage?.price || 0;
    const baseALaCartePrice = customizedPackage?.originalALaCartePrice || selectedPackage?.aLaCartePrice || 0;
    
    const newPrice = Math.max(0, Number(basePrice) - removedTotal);
    const newALaCartePrice = Math.max(0, Number(baseALaCartePrice) - removedTotal);
    
    if (customizedPackage) {
      setCustomizedPackage({
        ...customizedPackage,
        price: newPrice,
        aLaCartePrice: newALaCartePrice
      });
    }
    
    // Update selected package with new price
    if (selectedPackage) {
      setSelectedPackage({
        ...selectedPackage,
        price: newPrice,
        aLaCartePrice: newALaCartePrice
      });
    }
  };

  // Get the effective package (customized or original)
  const getEffectivePackage = () => {
    if (adminMode && customizedPackage) {
      return customizedPackage;
    }
    return selectedPackage;
  };

  const calculateTotal = () => {
    let total = 0;
    const effectivePackage = getEffectivePackage();
    if (effectivePackage && effectivePackage.price != null) {
      total += Number(effectivePackage.price) || 0;
    }
    // Add speaker rental if selected
    if (selectedSpeakerRental && selectedSpeakerRental.price != null) {
      total += Number(selectedSpeakerRental.price) || 0;
    }
    selectedAddons.forEach(addon => {
      if (addon && addon.price != null) {
        total += Number(addon.price) || 0;
      }
    });
    
    // Apply discount if available
    if (discountData && discountData.discountAmount) {
      total -= discountData.discountAmount;
    }
    
    return Math.max(0, total);
  };

  const calculateSubtotal = () => {
    let total = 0;
    if (selectedPackage && selectedPackage.price != null) {
      total += Number(selectedPackage.price) || 0;
    }
    selectedAddons.forEach(addon => {
      if (addon && addon.price != null) {
        total += Number(addon.price) || 0;
      }
    });
    return total;
  };

  const handleValidateDiscount = async () => {
    if (!discountCode.trim()) {
      setDiscountError('Please enter a discount code');
      return;
    }

    if (!selectedPackage) {
      setDiscountError('Please select a package first');
      return;
    }

    setValidatingDiscount(true);
    setDiscountError('');

    try {
      const subtotal = calculateSubtotal();
      const response = await fetch('/api/discount/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: discountCode,
          amount: subtotal,
          packageId: selectedPackage.id
        })
      });

      const data = await response.json();

      if (data.valid && data.discountCode) {
        setDiscountData(data.discountCode);
        setDiscountError('');
      } else {
        setDiscountData(null);
        setDiscountError(data.error || 'Invalid discount code');
      }
    } catch (error) {
      console.error('Error validating discount:', error);
      setDiscountData(null);
      setDiscountError('Failed to validate discount code. Please try again.');
    } finally {
      setValidatingDiscount(false);
    }
  };

  const handleRemoveDiscount = () => {
    setDiscountCode('');
    setDiscountData(null);
    setDiscountError('');
  };

  // Calculate what it would cost if purchased a la carte (addons only, no package)
  const calculateALaCarteTotal = () => {
    let total = 0;
    selectedAddons.forEach(addon => {
      if (addon && addon.price != null) {
        total += Number(addon.price) || 0;
      }
    });
    return total;
  };

  // Find which package would include the selected addons and show savings
  const findBestPackageMatch = () => {
    if (selectedAddons.length === 0 || selectedPackage) return null;
    
    // Map addon IDs to keywords that might appear in package breakdowns
    const addonKeywords = {
      'monogram': ['monogram', 'projection'],
      'dancing_clouds': ['dancing', 'clouds', 'dry ice'],
      'additional_hour': ['hour', 'additional'],
      'additional_speaker': ['speaker', 'additional'],
      'cold_spark': ['cold spark', 'spark', 'fountain'],
      'uplighting_addon': ['uplighting']
    };
    
    // Check which package includes the most selected addons
    const packageMatches = packages.map(pkg => {
      if (!pkg || !pkg.id) return null;
      
      const packageBreakdown = getPackageBreakdown(pkg.id);
      if (!packageBreakdown || !Array.isArray(packageBreakdown)) return null;
      
      const packageItems = packageBreakdown
        .filter(item => item && item.item)
        .map(item => item.item.toLowerCase());
      const packageDescriptions = packageBreakdown
        .filter(item => item && item.description)
        .map(item => item.description.toLowerCase());
      const allPackageText = [...packageItems, ...packageDescriptions].join(' ');
      
      // Count how many selected addons are included in this package
      const includedAddons = selectedAddons.filter(addon => {
        if (!addon || !addon.id || !addon.name) return false;
        
        const addonName = addon.name.toLowerCase();
        const keywords = addonKeywords[addon.id] || [addonName];
        
        // Check if any package item or description matches the addon
        return keywords.some(keyword => 
          allPackageText.includes(keyword) ||
          packageItems.some(item => item.includes(keyword)) ||
          packageDescriptions.some(desc => desc.includes(keyword))
        );
      });
      
      const aLaCartePrice = pkg.aLaCartePrice || 0;
      const packagePrice = pkg.price || 0;
      
      return {
        package: pkg,
        includedCount: includedAddons.length,
        includedAddons,
        aLaCarteTotal: aLaCartePrice,
        packagePrice: packagePrice,
        savings: aLaCartePrice - packagePrice
      };
    }).filter(match => match !== null);
    
    // Return the package with the most matches (only if at least 1 match)
    if (packageMatches.length === 0) return null;
    
    const bestMatch = packageMatches.sort((a, b) => {
      if (!a || !b) return 0;
      return b.includedCount - a.includedCount;
    })[0];
    
    return bestMatch && bestMatch.includedCount > 0 ? bestMatch : null;
  };

  const bestPackageMatch = findBestPackageMatch();

  const toggleAddon = (addon) => {
    setSelectedAddons(prev => {
      const exists = prev.find(a => a.id === addon.id);
      if (exists) {
        return prev.filter(a => a.id !== addon.id);
      } else {
        return [...prev, addon];
      }
    });
  };

  // Handle speaker rental selection (similar to package selection)
  const handleSelectSpeakerRental = () => {
    if (selectedSpeakerRental) {
      // Deselecting - also remove additional hours
      setSelectedSpeakerRental(null);
      setSelectedAddons(prev => prev.filter(a => a.id !== 'holiday_speaker_additional_hours'));
    } else {
      // Selecting - show time modal
      setShowSpeakerTimeModal(true);
      setShowSpeakerUpsell(false);
      setAdditionalHoursSelected(0);
      // Pre-fill with existing event times if available
      if (leadData?.eventTime || leadData?.event_time) {
        setSpeakerStartTime(leadData.eventTime || leadData.event_time);
      }
      if (leadData?.endTime || leadData?.end_time) {
        setSpeakerEndTime(leadData.endTime || leadData.end_time);
      }
    }
  };

  // Calculate hours from start and end time
  const calculateHours = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    
    try {
      // Parse times - HTML time inputs return "HH:MM" format (24-hour)
      const parseTime = (timeStr) => {
        if (!timeStr) return 0;
        const time = timeStr.trim();
        
        // Handle 24-hour format (HH:MM) - this is what HTML time inputs return
        if (time.includes(':')) {
          const parts = time.split(':');
          const hours = parseInt(parts[0], 10) || 0;
          const minutes = parseInt(parts[1], 10) || 0;
          
          // Return decimal hours (e.g., 14:30 = 14.5)
          return hours + (minutes / 60);
        }
        
        // Fallback: try to parse as 12-hour format if it contains AM/PM
        const lowerTime = time.toLowerCase();
        if (lowerTime.includes('am') || lowerTime.includes('pm')) {
          const timeWithoutAmPm = time.replace(/[ap]m/i, '').trim();
          if (timeWithoutAmPm.includes(':')) {
            const [hoursStr, minutesStr] = timeWithoutAmPm.split(':');
            let hours = parseInt(hoursStr, 10) || 0;
            const minutes = parseInt(minutesStr, 10) || 0;
            
            // Convert 12-hour to 24-hour
            if (lowerTime.includes('pm') && hours < 12) {
              hours += 12;
            } else if (lowerTime.includes('am') && hours === 12) {
              hours = 0;
            }
            
            return hours + (minutes / 60);
          }
        }
        
        return 0;
      };
      
      const start = parseTime(startTime);
      const end = parseTime(endTime);
      
      if (start === 0 && end === 0) return 0;
      
      // Handle overnight events (end time is next day)
      let hours = end - start;
      if (hours < 0) {
        hours += 24; // Overnight event
      }
      
      return Math.max(0, hours);
    } catch (error) {
      console.error('Error calculating hours:', error);
      console.error('Start time:', startTime, 'End time:', endTime);
      return 0;
    }
  };

  // Handle speaker rental time modal submission
  const handleSpeakerTimeSubmit = () => {
    if (!speakerStartTime || !speakerEndTime) {
      alert('Please enter both start and end times');
      return;
    }

    const hours = calculateHours(speakerStartTime, speakerEndTime);
    
    if (hours <= 0) {
      alert('End time must be after start time');
      return;
    }

    setCalculatedHours(hours);

    // If more than 4 hours, show upsell in modal
    if (hours > 4) {
      const additionalHours = Math.ceil(hours - 4);
      setAdditionalHoursSelected(additionalHours);
      setShowSpeakerUpsell(true);
    } else {
      // 4 hours or less, save directly
      handleSaveSpeakerRental(0);
    }
  };

  // Handle adding additional hours
  const handleAddSpeakerHours = (hours) => {
    setAdditionalHoursSelected(hours);
  };

  // Save speaker rental selection
  const handleSaveSpeakerRental = (additionalHours = null) => {
    const hoursToAdd = additionalHours !== null ? additionalHours : additionalHoursSelected;
    
    // Recalculate hours to ensure accuracy
    const hours = calculateHours(speakerStartTime, speakerEndTime);
    
    // Set the speaker rental as selected
    setSelectedSpeakerRental({
      id: 'holiday_speaker_rental',
      name: 'Speaker Setup Rental (Up to 4 Hours)',
      price: 400,
      startTime: speakerStartTime,
      endTime: speakerEndTime,
      totalHours: hours > 0 ? hours : calculatedHours
    });

    // Add additional hours addon if needed
    if (hoursToAdd > 0) {
      const additionalHoursAddon = addons.find(a => a.id === 'holiday_speaker_additional_hours');
      if (additionalHoursAddon) {
        // Remove existing additional hours if any, then add new one with quantity
        setSelectedAddons(prev => {
          const filtered = prev.filter(a => a.id !== 'holiday_speaker_additional_hours');
          return [...filtered, { 
            ...additionalHoursAddon, 
            quantity: hoursToAdd, 
            price: additionalHoursAddon.price * hoursToAdd,
            displayPrice: `$${additionalHoursAddon.price} × ${hoursToAdd} hours = $${additionalHoursAddon.price * hoursToAdd}`
          }];
        });
      }
    }

    // Close modal and reset
    setShowSpeakerTimeModal(false);
    setShowSpeakerUpsell(false);
    setSpeakerStartTime('');
    setSpeakerEndTime('');
    setCalculatedHours(0);
    setAdditionalHoursSelected(0);
  };

  const handleSaveQuote = async () => {
    if (!selectedPackage && !selectedSpeakerRental) {
      alert('Please select a package or speaker rental first');
      return;
    }

    setSaving(true);
    try {
      // If using fallback data (id === 'fallback'), we can't save to database
      // But we can still show success and store locally
      if (id === 'fallback' || !id || id === 'null' || id === 'undefined') {
        // Store selections in localStorage as backup
        const quoteData = {
          packageId: selectedPackage?.id || (selectedSpeakerRental ? 'speaker_rental' : null),
          packageName: selectedPackage?.name || null,
          speakerRental: selectedSpeakerRental ? {
            id: selectedSpeakerRental.id,
            name: selectedSpeakerRental.name,
            price: selectedSpeakerRental.price,
            startTime: selectedSpeakerRental.startTime,
            endTime: selectedSpeakerRental.endTime,
            totalHours: selectedSpeakerRental.totalHours
          } : null,
          addons: selectedAddons.map(a => ({ id: a.id, name: a.name, price: a.price })),
          total: calculateTotal(),
          leadData: leadData,
          timestamp: new Date().toISOString()
        };
        
        try {
          localStorage.setItem('pending_quote', JSON.stringify(quoteData));
          console.log('✅ Saved quote selections to localStorage');
        } catch (e) {
          console.warn('Could not save to localStorage:', e);
        }
        
        // Show success message and redirect to contact page
        alert('Your selections have been saved! We\'ll contact you within 24 hours to finalize your quote. Thank you!');
        router.push('/#contact');
        return;
      }

      // Ensure we have valid price values
      const packagePrice = selectedPackage?.price ?? 0;
      const calculatedTotal = calculateTotal();
      
      console.log('💾 Saving quote:', {
        leadId: id,
        packageId: selectedPackage?.id,
        packageName: selectedPackage?.name,
        packagePrice: packagePrice,
        speakerRental: selectedSpeakerRental ? {
          name: selectedSpeakerRental.name,
          price: selectedSpeakerRental.price
        } : null,
        selectedAddons: selectedAddons.length,
        calculatedTotal: calculatedTotal,
        calculateTotalBreakdown: {
          package: selectedPackage?.price || 0,
          speakerRental: selectedSpeakerRental?.price || 0,
          addons: selectedAddons.reduce((sum, a) => sum + (a.price || 0), 0)
        }
      });
      
      // Use calculatedTotal as the final total price
      const finalTotalPrice = calculatedTotal;

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      // Prepare package data - include customization info if admin mode
      const effectivePackage = getEffectivePackage();
      const packageData = {
        leadId: id,
        // Use 'speaker_rental' as package_id when speaker rental is selected (database requires NOT NULL)
        packageId: effectivePackage?.id || (selectedSpeakerRental ? 'speaker_rental' : null),
        packageName: effectivePackage?.name || (selectedSpeakerRental ? selectedSpeakerRental.name : null),
        packagePrice: effectivePackage?.price || (selectedSpeakerRental ? selectedSpeakerRental.price : 0),
        speakerRental: selectedSpeakerRental ? {
          id: selectedSpeakerRental.id,
          name: selectedSpeakerRental.name,
          price: selectedSpeakerRental.price,
          startTime: selectedSpeakerRental.startTime,
          endTime: selectedSpeakerRental.endTime,
          totalHours: selectedSpeakerRental.totalHours
        } : null,
        addons: selectedAddons.map(a => ({ id: a.id, name: a.name, price: a.price })),
        totalPrice: finalTotalPrice
      };
      
      console.log('💾 Final package data with corrected total:', {
        ...packageData,
        totalPrice: finalTotalPrice
      });
      
      console.log('💾 Package data being saved:', {
        ...packageData,
        speakerRental: packageData.speakerRental ? 'present' : 'null',
        totalPrice: packageData.totalPrice
      });

      // Include customization details if admin customized the package
      if (adminMode && customizedPackage && customizedPackage.price !== customizedPackage.originalPrice) {
        const removedFeatures = customizedFeatures
          .filter(f => f.removed)
          .map(f => ({ item: f.item, price: f.price }));
        
        packageData.customized = true;
        packageData.originalPrice = customizedPackage.originalPrice;
        packageData.removedFeatures = removedFeatures;
        packageData.customizationNote = `Admin customized: Removed ${removedFeatures.length} feature(s) worth $${removedFeatures.reduce((sum, f) => sum + f.price, 0).toLocaleString()}`;
      }

      try {
        const response = await fetch('/api/quote/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(packageData),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log('📡 Save response status:', response.status, response.statusText);
        
        let result;
        try {
          result = await response.json();
          console.log('📦 Save response data:', result);
        } catch (jsonError) {
          console.error('❌ Failed to parse response JSON:', jsonError);
          const text = await response.text();
          console.error('Response text:', text);
          // Still redirect even if JSON parsing fails
          router.push(`/quote/${id}/confirmation`);
          return;
        }

        // The API always returns 200, so check for success in the response
        if (response.ok && (result.success || result.message)) {
          console.log('✅ Quote saved successfully');
          
          // If the response has data, the save was successful
          // If it only has logged: true, the database save might have failed
          if (result.data) {
            console.log('✅ Quote data saved to database:', {
              id: result.data.id,
              lead_id: result.data.lead_id,
              total_price: result.data.total_price,
              package_name: result.data.package_name
            });
          } else if (result.logged) {
            console.warn('⚠️ Quote was logged but may not have been saved to database');
            console.warn('⚠️ Error:', result.error);
            // If there was an error, wait longer and try to verify the quote was saved
            console.log('⏳ Waiting 2 seconds and verifying quote was saved...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Try to fetch the quote to verify it was saved
            try {
              const verifyResponse = await fetch(`/api/quote/${id}?_t=${Date.now()}`);
              if (verifyResponse.ok) {
                const verifyQuote = await verifyResponse.json();
                console.log('✅ Quote verified in database:', {
                  total_price: verifyQuote.total_price,
                  package_name: verifyQuote.package_name
                });
              } else {
                console.error('❌ Quote not found after save - database save may have failed');
                alert('There was an issue saving your quote. Please try again or contact support.');
                setSaving(false);
                return;
              }
            } catch (verifyError) {
              console.error('❌ Error verifying quote:', verifyError);
            }
          } else {
            // Add a small delay to ensure database commit before redirecting
            console.log('⏳ Waiting 500ms before redirecting to ensure database commit...');
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
          console.log('🔄 Redirecting to confirmation...');
        } else {
          console.log('⚠️ API response indicates potential issue, but redirecting anyway');
        }
        
        // Always redirect to confirmation page
        router.push(`/quote/${id}/confirmation`);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error('❌ Request timed out after 10 seconds');
        } else {
          console.error('❌ Fetch error:', fetchError);
        }
        // Even on timeout/error, redirect to confirmation
        console.log('⚠️ Redirecting to confirmation despite error');
        router.push(`/quote/${id}/confirmation`);
      }
    } catch (error) {
      console.error('Error saving quote:', error);
      // Even if save fails, redirect to confirmation page
      // The API always returns success, so this should rarely happen
      // But if it does, we still want to show the confirmation page
      console.log('⚠️ Error occurred, but redirecting to confirmation anyway');
      router.push(`/quote/${id}/confirmation`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading Your Quote | M10 DJ Company</title>
          <meta name="description" content="Loading your personalized DJ services quote" />
          <meta name="robots" content="noindex, nofollow" />
          
          {/* Open Graph / Facebook */}
          <meta property="og:type" content="website" />
          <meta property="og:url" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/quote/${id}`} />
          <meta property="og:title" content="Your Personalized Quote | M10 DJ Company" />
          <meta property="og:description" content="Select your perfect DJ package and customize your event" />
          <meta property="og:image" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/assets/quote-booking-og.png`} />
          <meta property="og:image:secure_url" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/assets/quote-booking-og.png`} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content="Get Your Personalized Quote - Free & Fast" />
          <meta property="og:image:type" content="image/png" />
          <meta property="og:site_name" content="M10 DJ Company" />
          
          {/* Twitter Card */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:url" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/quote/${id}`} />
          <meta name="twitter:title" content="Your Personalized Quote | M10 DJ Company" />
          <meta name="twitter:description" content="Select your perfect DJ package and customize your event" />
          <meta name="twitter:image" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/assets/service-selection-og-image.png`} />
        </Head>
        <main className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-brand mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading your personalized quote...</p>
          </div>
        </main>
      </>
    );
  }

  if (error || !leadData) {
    return (
      <>
        <Head>
          <title>Quote Not Found | M10 DJ Company</title>
          <meta name="description" content="Quote not found. Please contact us to get your personalized quote." />
          <meta name="robots" content="noindex, nofollow" />
          
          {/* Open Graph / Facebook */}
          <meta property="og:type" content="website" />
          <meta property="og:url" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/quote/${id}`} />
          <meta property="og:title" content="Quote Not Found | M10 DJ Company" />
          <meta property="og:description" content="Quote not found. Please contact us to get your personalized quote." />
          <meta property="og:image" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/assets/quote-booking-og.png`} />
          <meta property="og:image:secure_url" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/assets/quote-booking-og.png`} />
          <meta property="og:image:width" content="1200" />
          <meta property="og:image:height" content="630" />
          <meta property="og:image:alt" content="Get Your Personalized Quote - Free & Fast" />
          <meta property="og:image:type" content="image/png" />
          <meta property="og:site_name" content="M10 DJ Company" />
          
          {/* Twitter Card */}
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:url" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/quote/${id}`} />
          <meta name="twitter:title" content="Quote Not Found | M10 DJ Company" />
          <meta name="twitter:description" content="Quote not found. Please contact us to get your personalized quote." />
          <meta name="twitter:image" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/assets/service-selection-og-image.png`} />
        </Head>
        <main className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Quote Not Found</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'Quote not found'}</p>
            <div className="flex gap-4 justify-center">
              <Link href="/#contact" className="btn-primary inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Get a New Quote
              </Link>
              <Link href="/" className="btn-secondary">
                Go to Homepage
              </Link>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-6">
              Need help? Call us at <a href="tel:+19014102020" className="text-brand hover:underline">(901) 410-2020</a>
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Your Personalized Quote | M10 DJ Company</title>
        <meta name="description" content={`Personalized ${isHoliday ? 'holiday party' : isCorporate ? 'corporate event' : isSchool ? 'school event' : 'wedding'} DJ quote for ${leadData.name}`} />
        <meta name="robots" content="noindex, nofollow" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/quote/${id}`} />
        <meta property="og:title" content={`Your Personalized ${isHoliday ? 'Holiday Party' : isSchool ? 'School Event' : isCorporate ? 'Corporate Event' : 'Wedding'} Quote`} />
        <meta property="og:description" content={`Custom DJ services quote for ${leadData.name}'s ${isHoliday ? 'holiday party' : isCorporate ? 'corporate event' : isSchool ? 'school event' : 'wedding'}${leadData.eventDate ? ` on ${formatEventDate(leadData.eventDate)}` : ''}`} />
        <meta property="og:image" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/assets/service-selection-og-image.png`} />
        <meta property="og:image:secure_url" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/assets/service-selection-og-image.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={`Service Selection - M10 DJ Company`} />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:site_name" content="M10 DJ Company" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/quote/${id}`} />
        <meta name="twitter:title" content={`Your Personalized ${isHoliday ? 'Holiday Party' : isSchool ? 'School Event' : isCorporate ? 'Corporate Event' : 'Wedding'} Quote`} />
        <meta name="twitter:description" content={`Custom DJ services quote for ${leadData.name}'s ${isHoliday ? 'holiday party' : isCorporate ? 'corporate event' : isSchool ? 'school event' : 'wedding'}`} />
        <meta name="twitter:image" content={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://m10djcompany.com'}/assets/service-selection-og-image.png`} />
      </Head>
      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Header />
      <main className="min-h-screen bg-white dark:bg-gray-900 pb-32 md:pb-32">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          {/* Header Section */}
          <div className="text-center mb-12">
            <Link href="/" className={`inline-flex items-center gap-2 ${getThemeText()} ${holidayTheme ? holidayTheme.hoverColor.replace('bg-', 'hover:text-') : 'hover:text-brand-dark'} mb-6 transition-colors`}>
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Your Personalized {isHoliday ? 'Holiday Party' : isSchool ? 'School Event' : isCorporate ? 'Corporate Event' : 'Wedding'} Quote
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-4 text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>{leadData.name}</span>
              </div>
              {leadData.eventDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>{formatEventDate(leadData.eventDate)}</span>
                </div>
              )}
              {leadData.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span>{leadData.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Admin: Page view timeline */}
          {isAdmin && (
            <div className="mb-8 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10 p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                Page view timeline
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Each time this quote page was viewed (by client or admin).
              </p>
              {pageViewTimelineLoading ? (
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading…
                </div>
              ) : pageViewTimeline.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No page views recorded yet.</p>
              ) : (
                <ul className="space-y-3">
                  {pageViewTimeline.map((view) => (
                    <li
                      key={view.id}
                      className="flex items-start gap-3 text-sm border-l-2 border-amber-300 dark:border-amber-700 pl-4 py-1"
                    >
                      <span className="text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">
                        {view.createdAt ? new Date(view.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                      </span>
                      {view.timeSpent != null && view.timeSpent > 0 && (
                        <span className="text-gray-500 dark:text-gray-400">
                          ({view.timeSpent}s on page)
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Existing Selection Banner */}
          {existingSelection && !contractSigned && (() => {
            // Calculate total using same logic as invoice (includes discounts)
            const packagePrice = Number(existingSelection.package_price) || 0;
            const addons = existingSelection.addons || [];
            const addonsTotal = addons.reduce((sum, addon) => {
              const price = typeof addon === 'object' ? (Number(addon.price) || 0) : 0;
              return sum + price;
            }, 0);
            const subtotal = packagePrice + addonsTotal;
            
            // Apply discount if present
            let discountAmount = 0;
            if (existingSelection.discount_type && existingSelection.discount_value && existingSelection.discount_value > 0) {
              if (existingSelection.discount_type === 'percentage') {
                discountAmount = subtotal * (Number(existingSelection.discount_value) / 100);
              } else {
                discountAmount = Number(existingSelection.discount_value);
              }
            }
            
            const calculatedTotal = Math.max(0, subtotal - discountAmount);
            const displayTotal = calculatedTotal > 0 ? calculatedTotal : (existingSelection.total_price || 0);
            
            return (
              <div className={`${getThemeBgGradient()} border ${getThemeBorder()} rounded-2xl p-8 mb-8 shadow-sm`}>
                <div className="flex items-start gap-4">
                  <div className={`flex-shrink-0 w-12 h-12 ${holidayTheme ? `${holidayTheme.bgColor}/10 dark:${holidayTheme.bgColor}/20` : 'bg-brand/10 dark:bg-brand/20'} rounded-xl flex items-center justify-center`}>
                    <CheckCircle className={`w-6 h-6 ${getThemeText()}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                      Your Selection
                    </h3>
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-gray-600 dark:text-gray-400 text-sm">Package</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{existingSelection.package_name}</span>
                      </div>
                      {existingSelection.addons && existingSelection.addons.length > 0 && (
                        <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400 text-sm">Add-ons</span>
                          <span className="font-medium text-gray-900 dark:text-white text-sm">
                            {existingSelection.addons.map(a => typeof a === 'object' ? a.name || a.id : a).join(', ')}
                          </span>
                        </div>
                      )}
                      {discountAmount > 0 && (
                        <div className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400 text-sm">Discount</span>
                          <span className="font-medium text-green-600 dark:text-green-400 text-sm">
                            -${discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">Total Amount</span>
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          ${displayTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      {outstandingBalance > 0 && (
                        <div className="flex items-center justify-between pt-3 mt-3 border-t-2 border-gray-300 dark:border-gray-600">
                          <span className="text-base font-semibold text-gray-700 dark:text-gray-300">Outstanding Balance</span>
                          <span className={`text-xl font-bold ${getThemeText()}`}>
                            ${outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/quote/${id}/payment`}
                        className={`inline-flex items-center justify-center gap-2 px-6 py-3 ${getThemeBg()} ${getThemeHover()} text-white rounded-xl transition-all text-sm font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5`}
                      >
                        <CheckCircle className="w-5 h-5" />
                        Make Payment
                      </Link>
                      {/* Hide Edit Selection button if contract is signed or payment has been made */}
                      {!contractSigned && !hasPayment && (
                        <button
                          onClick={() => setShowEditMode(!showEditMode)}
                          className="px-5 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300 rounded-xl transition-all text-sm font-medium whitespace-nowrap"
                        >
                          {showEditMode ? 'Cancel' : 'Edit Selection'}
                        </button>
                      )}
                      {/* Hide Remove button if contract is signed, payment made, or contract/invoice exists */}
                      {!contractSigned && !hasPayment && !existingSelection.contract_id && !existingSelection.invoice_id && (
                        <button
                          onClick={async () => {
                            if (confirm('Are you sure you want to remove your selection? You can always make a new selection later.')) {
                              try {
                                const response = await fetch('/api/quote/delete', {
                                  method: 'DELETE',
                                  headers: {
                                    'Content-Type': 'application/json',
                                  },
                                  body: JSON.stringify({
                                    quoteSelectionId: existingSelection.id
                                  })
                                });
                                
                                if (response.ok) {
                                  setExistingSelection(null);
                                  setSelectedPackage(null);
                                  setSelectedAddons([]);
                                  setShowEditMode(false);
                                  window.location.reload();
                                } else {
                                  alert('Failed to remove selection. Please try again.');
                                }
                              } catch (error) {
                                console.error('Error removing selection:', error);
                                alert('Failed to remove selection. Please try again.');
                              }
                            }
                          }}
                          className="px-5 py-3 bg-white dark:bg-gray-800 border-2 border-red-300 dark:border-red-700 hover:border-red-400 dark:hover:border-red-600 text-red-600 dark:text-red-400 rounded-xl transition-all text-sm font-medium whitespace-nowrap"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Contract Signed Notice */}
          {contractSigned && existingSelection && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 mb-8">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-1">
                    Contract Signed
                  </h3>
                  <p className="text-sm text-green-800 dark:text-green-200 mb-4">
                    Your selection has been finalized and your contract has been signed. Changes cannot be made at this time.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    {existingSelection.contract_id && (
                      <Link
                        href={`/quote/${id}/contract`}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border-2 border-green-600 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors text-sm font-medium"
                      >
                        <FileText className="w-4 h-4" />
                        View Your Contract
                      </Link>
                    )}
                    {existingSelection && outstandingBalance > 0 && (
                      <Link
                        href={`/quote/${id}/payment`}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand hover:bg-brand-dark text-white rounded-lg transition-colors text-sm font-semibold shadow-lg hover:shadow-xl"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Make Payment
                        {outstandingBalance > 0 && (
                          <span className="ml-1 text-xs opacity-90">
                            (${outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} remaining)
                          </span>
                        )}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons for Existing Selection */}
          {existingSelection && !contractSigned && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 text-center">
                Continue Your Booking
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <Link
                  href={`/quote/${id}/invoice`}
                  className="group relative bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700 hover:border-brand dark:hover:border-brand transition-all text-center shadow-sm hover:shadow-md"
                >
                  <div className="w-12 h-12 bg-brand/10 dark:bg-brand/20 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-brand/20 dark:group-hover:bg-brand/30 transition-colors">
                    <FileText className="w-6 h-6 text-brand" />
                  </div>
                  <span className="block font-semibold text-gray-900 dark:text-white mb-1">View Invoice</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Review pricing details</span>
                </Link>
                <Link
                  href={`/quote/${id}/contract`}
                  className="group relative bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700 hover:border-brand dark:hover:border-brand transition-all text-center shadow-sm hover:shadow-md"
                >
                  <div className="w-12 h-12 bg-brand/10 dark:bg-brand/20 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-brand/20 dark:group-hover:bg-brand/30 transition-colors">
                    <FileText className="w-6 h-6 text-brand" />
                  </div>
                  <span className="block font-semibold text-gray-900 dark:text-white mb-1">Sign Contract</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Review and sign</span>
                </Link>
                <Link
                  href={`/quote/${id}/payment`}
                  className="group relative bg-gradient-to-br from-brand/10 to-brand/5 dark:from-brand/20 dark:to-brand/10 rounded-xl p-6 border-2 border-brand hover:border-brand-dark transition-all text-center shadow-sm hover:shadow-md"
                >
                  <div className="w-12 h-12 bg-brand rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-brand-dark transition-colors">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <span className="block font-semibold text-gray-900 dark:text-white mb-1">Make Payment</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Secure checkout</span>
                </Link>
              </div>
            </div>
          )}

          {/* Savings Explanation */}
          {(!existingSelection || showEditMode) && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8 border border-gray-200 dark:border-gray-700">
              <p className="text-center text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Our packages bundle services at a discounted rate. Compare the package price to a la carte pricing and see your savings! 🎉
              </p>
            </div>
          )}

          {/* Smart Recommendations Banner */}
          {smartRecommendations && (!existingSelection || showEditMode) && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 mb-8 border-2 border-blue-200 dark:border-blue-700 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Personalized Recommendation
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {smartRecommendations.message}
                  </p>
                  {smartRecommendations.packages.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Recommended Packages:</p>
                      <div className="flex flex-wrap gap-2">
                        {smartRecommendations.packages.map((pkgId) => {
                          const pkg = packages.find(p => p.id === pkgId);
                          if (!pkg) return null;
                          return (
                            <span
                              key={pkgId}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 text-sm font-medium border border-blue-200 dark:border-blue-700"
                            >
                              {pkg.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {smartRecommendations.addons.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Recommended Add-ons:</p>
                      <div className="flex flex-wrap gap-2">
                        {smartRecommendations.addons.map((addonId) => {
                          const addon = addons.find(a => a.id === addonId);
                          if (!addon) return null;
                          return (
                            <span
                              key={addonId}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 text-sm font-medium border border-indigo-200 dark:border-indigo-700"
                            >
                              {addon.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Packages Section */}
          {(!existingSelection || showEditMode) && !contractSigned && !hasPayment && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-4">
              <Music className={`inline w-8 h-8 ${getThemeText()} mr-2`} />
              {showEditMode ? 'Edit Your Package Selection' : 'Choose Your Package'}
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {packages.map((pkg) => {
                const isExpanded = expandedPackages.has(pkg.id);
                const isSelected = selectedPackage?.id === pkg.id;
                
                // Track package expansion for analytics
                const handleExpand = (e) => {
                  e.stopPropagation();
                  const newExpanded = new Set(expandedPackages);
                  if (isExpanded) {
                    newExpanded.delete(pkg.id);
                  } else {
                    newExpanded.add(pkg.id);
                    // Track package expansion
                    if (id && leadData) {
                      fetch('/api/analytics/quote-page-view', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          quote_id: id,
                          event_type: 'package_expanded',
                          metadata: {
                            package_id: pkg.id,
                            package_name: pkg.name,
                            package_price: pkg.price,
                            event_type: leadData.eventType || leadData.event_type
                          }
                        })
                      }).catch(err => console.error('Error tracking package expansion:', err));
                    }
                  }
                  setExpandedPackages(newExpanded);
                };

                return (
                  <div
                    key={pkg.id}
                    className={`relative bg-white dark:bg-gray-800 rounded-xl border-2 transition-all hover:shadow-xl ${
                      isSelected
                        ? 'border-brand shadow-lg'
                        : 'border-gray-200 dark:border-gray-700 hover:border-brand/50'
                    } ${pkg.popular ? 'ring-2 ring-brand/30' : ''}`}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-brand text-black px-4 py-1 rounded-full text-sm font-bold z-10">
                        Most Popular
                      </div>
                    )}
                    
                    <div className="p-6">
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{pkg.name}</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">{pkg.description}</p>
                      
                      {/* Price & Savings - Always Visible */}
                      <div className="mb-4">
                        <div className="flex items-baseline gap-3 mb-2">
                          <span className={`text-4xl font-bold ${getThemeText()}`}>
                            ${(adminMode && isSelected && customizedPackage && customizedPackage.id === pkg.id && customizedPackage.price !== customizedPackage.originalPrice)
                              ? customizedPackage.price.toLocaleString()
                              : pkg.price.toLocaleString()}
                          </span>
                          <span className="text-lg text-gray-400 dark:text-gray-500 line-through">
                            ${(adminMode && isSelected && customizedPackage && customizedPackage.id === pkg.id && customizedPackage.price !== customizedPackage.originalPrice)
                              ? customizedPackage.aLaCartePrice.toLocaleString()
                              : pkg.aLaCartePrice.toLocaleString()}
                          </span>
                        </div>
                        {(adminMode && isSelected && customizedPackage && customizedPackage.id === pkg.id && customizedPackage.price !== customizedPackage.originalPrice) ? (
                          <div className="inline-flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-3 py-1 rounded-full text-sm font-semibold">
                            <Settings className="w-4 h-4" />
                            Customized (${(customizedPackage.originalPrice - customizedPackage.price).toLocaleString()} off)
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-sm font-semibold">
                            <CheckCircle className="w-4 h-4" />
                            Save ${(pkg.aLaCartePrice - pkg.price).toLocaleString()}
                          </div>
                        )}
                      </div>

                      {/* Expand/Collapse Button */}
                      <button
                        onClick={handleExpand}
                        className="w-full mb-4 py-2 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4" />
                            Hide Details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            View What&apos;s Included
                          </>
                        )}
                      </button>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="space-y-4 animate-fadeIn">
                          {/* Features List */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">What&apos;s Included:</h4>
                            <ul className="space-y-2">
                              {pkg.features.map((feature, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                                  <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* A La Carte Breakdown */}
                          <div className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">If purchased separately:</p>
                            <ul className="space-y-2 mb-2">
                              {getPackageBreakdown(pkg.id).map((item, idx) => (
                                <li key={idx} className="flex justify-between text-xs">
                                  <div className="flex-1 pr-2">
                                    <span className="text-gray-600 dark:text-gray-400 font-medium">{item.item}</span>
                                    {item.description && (
                                      <p className="text-gray-500 dark:text-gray-500 text-xs mt-0.5">{item.description}</p>
                                    )}
                                  </div>
                                  <span className="font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">${item.price.toLocaleString()}</span>
                                </li>
                              ))}
                            </ul>
                            <div className="pt-2 border-t border-gray-300 dark:border-gray-600 flex justify-between text-sm font-bold">
                              <span>A La Carte Total:</span>
                              <span className="text-gray-500 dark:text-gray-400 line-through">${pkg.aLaCartePrice.toLocaleString()}</span>
                            </div>
                            <div className={`flex justify-between text-sm font-bold ${getThemeText()} mt-1`}>
                              <span>Package Price:</span>
                              <span>${pkg.price.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Admin Customization UI */}
                      {adminMode && isSelected && customizedPackage && customizedPackage.id === pkg.id && (
                        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg">
                          <div className="flex items-center gap-2 mb-3">
                            <Settings className="w-5 h-5 text-yellow-700 dark:text-yellow-400" />
                            <h4 className="font-bold text-yellow-900 dark:text-yellow-200">Admin: Customize Package</h4>
                          </div>
                          <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-3">
                            Remove features to adjust the price. The package price will be reduced by the value of removed items.
                          </p>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {customizedFeatures.map((feature, idx) => (
                              <div
                                key={idx}
                                className={`flex items-start gap-2 p-2 rounded ${
                                  feature.removed
                                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700'
                                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                                }`}
                              >
                                <button
                                  onClick={() => handleToggleFeature(idx)}
                                  className={`mt-0.5 p-1 rounded ${
                                    feature.removed
                                      ? 'bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-300'
                                      : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                  }`}
                                  title={feature.removed ? 'Click to include' : 'Click to remove'}
                                >
                                  {feature.removed ? (
                                    <X className="w-4 h-4" />
                                  ) : (
                                    <CheckCircle className="w-4 h-4" />
                                  )}
                                </button>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className={`text-sm font-medium ${
                                      feature.removed
                                        ? 'line-through text-gray-500 dark:text-gray-500'
                                        : 'text-gray-900 dark:text-gray-100'
                                    }`}>
                                      {feature.item}
                                    </span>
                                    <span className={`text-sm font-semibold ${
                                      feature.removed
                                        ? 'text-red-600 dark:text-red-400'
                                        : 'text-gray-700 dark:text-gray-300'
                                    }`}>
                                      ${feature.price.toLocaleString()}
                                    </span>
                                  </div>
                                  {feature.description && (
                                    <p className={`text-xs mt-0.5 ${
                                      feature.removed
                                        ? 'text-gray-400 dark:text-gray-600'
                                        : 'text-gray-600 dark:text-gray-400'
                                    }`}>
                                      {feature.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          {customizedPackage && customizedPackage.price !== customizedPackage.originalPrice && (
                            <div className="mt-3 pt-3 border-t border-yellow-300 dark:border-yellow-700">
                              <div className="flex justify-between items-center text-sm">
                                <span className="text-yellow-900 dark:text-yellow-200 font-medium">Original Price:</span>
                                <span className="text-yellow-700 dark:text-yellow-400 line-through">${customizedPackage.originalPrice.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm mt-1">
                                <span className="text-yellow-900 dark:text-yellow-200 font-bold">Adjusted Price:</span>
                                <span className="text-yellow-900 dark:text-yellow-200 font-bold text-lg">${customizedPackage.price.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs mt-1 text-yellow-700 dark:text-yellow-400">
                                <span>Savings:</span>
                                <span>${(customizedPackage.originalPrice - customizedPackage.price).toLocaleString()}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Select Package Button */}
                      <button
                        onClick={() => {
                          handleAdminSelectPackage(pkg);
                          // Track package selection
                          if (id && leadData) {
                            fetch('/api/analytics/quote-page-view', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                quote_id: id,
                                event_type: 'package_selected',
                                metadata: {
                                  package_id: pkg.id,
                                  package_name: pkg.name,
                                  package_price: pkg.price,
                                  event_type: leadData.eventType || leadData.event_type,
                                  admin_customized: adminMode
                                }
                              })
                            }).catch(err => console.error('Error tracking package selection:', err));
                          }
                        }}
                        className={`w-full mt-4 py-3 px-4 rounded-lg font-semibold transition-all ${
                          isSelected
                            ? 'bg-brand text-white shadow-lg'
                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        {isSelected ? (
                          <span className="flex items-center justify-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            {adminMode ? 'Customize Package' : 'Selected'}
                          </span>
                        ) : (
                          'Select This Package'
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          )}

          {/* Speaker Rental Section for Non-Wedding Events Only */}
          {!isWedding && (!existingSelection || showEditMode) && !contractSigned && !hasPayment && (
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-center mb-4">
                <Music className={`inline w-8 h-8 ${getThemeText()} mr-2`} />
                Speaker Rental
              </h2>
              <p className="text-center text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                Need sound equipment for your event? Our speaker rental is perfect for outdoor events, separate areas, or when you need audio coverage. Available for all event types except weddings.
              </p>
              <div className="max-w-md mx-auto">
                <div
                  onClick={handleSelectSpeakerRental}
                  className={`bg-white dark:bg-gray-800 rounded-xl p-6 border-2 cursor-pointer transition-all shadow-sm hover:shadow-md ${
                    selectedSpeakerRental
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30'
                      : 'border-orange-200 dark:border-orange-700 hover:border-orange-400'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2">
                        Speaker Setup Rental (Up to 4 Hours)
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Professional speaker system rental with built-in mixer for up to 4 hours. Perfect for separate areas, outdoor spaces, or multiple rooms at your holiday event. Includes microphone input and all necessary cables.
                      </p>
                      {selectedSpeakerRental && (
                        <div className="mt-3 p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                          <p className="text-sm text-orange-800 dark:text-orange-200">
                            <strong>Event Time:</strong> {selectedSpeakerRental.startTime} - {selectedSpeakerRental.endTime}
                            <br />
                            <strong>Duration:</strong> {selectedSpeakerRental.totalHours.toFixed(1)} hours
                            {selectedSpeakerRental.totalHours > 4 && (
                              <>
                                <br />
                                <strong>Additional Hours:</strong> {Math.ceil(selectedSpeakerRental.totalHours - 4)} hour(s) at $100/hour
                              </>
                            )}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                          $400
                          <span className="text-base font-normal text-gray-500 ml-2">(up to 4 hours)</span>
                        </div>
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                          selectedSpeakerRental
                            ? 'bg-orange-500 border-orange-500'
                            : 'border-orange-300 dark:border-orange-600'
                        }`}>
                          {selectedSpeakerRental && (
                            <CheckCircle className="w-5 h-5 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectSpeakerRental();
                    }}
                    className={`w-full mt-4 py-3 px-4 rounded-lg font-semibold transition-all ${
                      selectedSpeakerRental
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {selectedSpeakerRental ? 'Selected' : 'Select Speaker Rental'}
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Add-ons Section */}
          {(!existingSelection || showEditMode) && !contractSigned && !hasPayment && (
          <section id="addons-section" className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-4">
              <Sparkles className={`inline w-8 h-8 ${getThemeText()} mr-2`} />
              A La Carte
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Add extra services to your package. These are optional upgrades that can be added to personalize your celebration even more! 
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {addons
                .filter(addon => {
                  // Exclude speaker rental from regular addons (it's a standalone selection)
                  if (addon.id === 'speaker_rental' || addon.id === 'holiday_speaker_rental') {
                    return false;
                  }
                  // For holiday parties, also filter out other speaker-related addons
                  if (isHoliday && addon.id.includes('speaker')) {
                    return false;
                  }
                  return true;
                })
                .map((addon) => {
                const isSelected = selectedAddons.find(a => a.id === addon.id);
                return (
                  <div
                    key={addon.id}
                    onClick={() => toggleAddon(addon)}
                    className={`bg-white dark:bg-gray-800 rounded-lg p-4 border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-brand bg-brand/5 dark:bg-brand/10'
                        : 'border-gray-200 dark:border-gray-700 hover:border-brand/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{addon.name}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{addon.description}</p>
                        <div className="text-lg font-bold text-brand">
                          ${addon.price.toLocaleString()}
                          {addon.per && <span className="text-sm font-normal text-gray-500"> / {addon.per}</span>}
                        </div>
                      </div>
                      <div className={`ml-4 w-6 h-6 rounded border-2 flex items-center justify-center ${
                        isSelected
                          ? 'bg-brand border-brand'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {isSelected && <CheckCircle className="w-5 h-5 text-white" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          )}

          {/* Total and CTA */}
          {(!existingSelection || showEditMode) && !contractSigned && !hasPayment && (
          <section className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700">
            <div className="max-w-2xl mx-auto">
              {/* Savings Alert - Show when addons selected without package */}
              {!selectedPackage && selectedAddons.length > 0 && bestPackageMatch && bestPackageMatch.includedCount > 0 && (() => {
                const currentAddonTotal = calculateALaCarteTotal();
                const packageValue = bestPackageMatch.aLaCarteTotal;
                const packagePrice = bestPackageMatch.packagePrice;
                const additionalCost = packagePrice - currentAddonTotal;
                const additionalValue = packageValue - currentAddonTotal;
                const netValueGain = additionalValue - additionalCost;
                
                return (
                  <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-bold text-yellow-900 dark:text-yellow-200 mb-2">
                          💰 Better Value with {bestPackageMatch.package.name}!
                        </h3>
                        <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-3">
                          You&apos;ve selected {bestPackageMatch.includedCount} addon{bestPackageMatch.includedCount > 1 ? 's' : ''} that {bestPackageMatch.includedCount > 1 ? 'are' : 'is'} included in <strong>{bestPackageMatch.package.name}</strong>! Upgrade to the package and get much more for your money.
                        </p>
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-3">
                          <div className="space-y-2 mb-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">What you&apos;re paying now:</span>
                              <span className="text-base font-semibold text-gray-700 dark:text-gray-300">
                                ${currentAddonTotal.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600 dark:text-gray-400">What you&apos;d get in {bestPackageMatch.package.name}:</span>
                              <span className="text-base font-semibold text-gray-700 dark:text-gray-300">
                                ${packageValue.toLocaleString()} <span className="text-xs text-gray-500">worth</span>
                              </span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                              <span className="text-sm font-semibold text-brand">Package Price:</span>
                              <span className="text-lg font-bold text-brand">
                                ${packagePrice.toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="pt-2 border-t-2 border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20 rounded p-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-gray-600 dark:text-gray-400">Pay ${additionalCost.toLocaleString()} more, get</span>
                              <span className="text-xs font-semibold text-green-700 dark:text-green-400">${additionalValue.toLocaleString()} more value</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-semibold text-green-700 dark:text-green-400">Net Value Gain:</span>
                              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                ${netValueGain.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedPackage(bestPackageMatch.package)}
                          className="w-full btn-primary text-sm py-2 flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Upgrade to {bestPackageMatch.package.name}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Discount Code Section */}
              {selectedPackage && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  {!discountData ? (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Have a discount code?
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={discountCode}
                          onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                          onKeyPress={(e) => e.key === 'Enter' && handleValidateDiscount()}
                          placeholder="Enter code"
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand focus:border-transparent dark:bg-gray-700 dark:text-white"
                        />
                        <button
                          onClick={handleValidateDiscount}
                          disabled={validatingDiscount || !discountCode.trim()}
                          className="px-6 py-2 bg-brand hover:bg-brand-dark text-black font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          {validatingDiscount ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Validating...
                            </>
                          ) : (
                            <>
                              <Tag className="w-4 h-4" />
                              Apply
                            </>
                          )}
                        </button>
                      </div>
                      {discountError && (
                        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                          <XCircle className="w-4 h-4" />
                          {discountError}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Tag className="w-5 h-5 text-green-600 dark:text-green-400" />
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {discountData.code} Applied
                          </span>
                          {discountData.description && (
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              - {discountData.description}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={handleRemoveDiscount}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                          title="Remove discount code"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="text-sm text-green-600 dark:text-green-400 font-medium">
                        You saved ${discountData.discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Price Breakdown */}
              {selectedPackage && (
                <div className="mb-4 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Subtotal:</span>
                    <span>${calculateSubtotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  {discountData && discountData.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Discount ({discountData.code}):</span>
                      <span>-${discountData.discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Regular Total Display */}
              <div className="flex justify-between items-center mb-6">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">Total:</span>
                <span className="text-4xl font-bold text-brand">${calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              
              {!selectedPackage && selectedAddons.length === 0 && (
                <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
                  Please select a package to see your total
                </p>
              )}

              {!selectedPackage && selectedAddons.length > 0 && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300 text-center">
                    <strong>Note:</strong> Addons are additions to packages. Select a package above to see your complete total and maximize your savings!
                  </p>
                </div>
              )}

              {/* Show package savings if package is selected */}
              {selectedPackage && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-800 dark:text-green-300">
                      Package Savings:
                    </span>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      ${(selectedPackage.aLaCartePrice - selectedPackage.price).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-green-700 dark:text-green-400 mt-1 text-center">
                    You&apos;re saving ${(selectedPackage.aLaCartePrice - selectedPackage.price).toLocaleString()} compared to purchasing items separately!
                  </p>
                </div>
              )}

              <button
                id="save-selections-button"
                onClick={handleSaveQuote}
                disabled={(!selectedPackage && !selectedSpeakerRental) || saving}
                className="w-full btn-primary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Heart className="w-5 h-5" />
                    Save My Selections
                  </>
                )}
              </button>

              <p className="text-center text-sm text-gray-500 dark:text-gray-500 mt-4">
                Ben will review your selections and prepare a detailed proposal within 24 hours
              </p>
            </div>
          </section>
          )}
        </div>
      </main>

      {/* Speaker Rental Time Entry Modal */}
      {showSpeakerTimeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Event Time Details
            </h3>
            
            {!showSpeakerUpsell ? (
              <>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Please provide the start and end times for your event so we can ensure the speaker rental covers your full event duration.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Event Start Time
                    </label>
                    <input
                      type="time"
                      value={speakerStartTime}
                      onChange={(e) => setSpeakerStartTime(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Event End Time
                    </label>
                    <input
                      type="time"
                      value={speakerEndTime}
                      onChange={(e) => setSpeakerEndTime(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowSpeakerTimeModal(false);
                      setShowSpeakerUpsell(false);
                      setSpeakerStartTime('');
                      setSpeakerEndTime('');
                      setCalculatedHours(0);
                      setAdditionalHoursSelected(0);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSpeakerTimeSubmit}
                    className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-semibold"
                  >
                    Continue
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Your event duration is <strong>{calculatedHours.toFixed(1)} hours</strong>. The base speaker rental covers up to 4 hours.
                  </p>
                  {calculatedHours > 4 && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-4">
                      <p className="text-sm font-medium text-orange-900 dark:text-orange-200 mb-3">
                        Add Additional Hours
                      </p>
                      <p className="text-sm text-orange-800 dark:text-orange-300 mb-4">
                        Your event is {calculatedHours.toFixed(1)} hours. Add {Math.ceil(calculatedHours - 4)} additional hour{Math.ceil(calculatedHours - 4) > 1 ? 's' : ''} at $100/hour?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddSpeakerHours(Math.ceil(calculatedHours - 4))}
                          className={`flex-1 px-4 py-2 rounded-lg transition-colors font-semibold ${
                            additionalHoursSelected === Math.ceil(calculatedHours - 4)
                              ? 'bg-orange-500 text-white'
                              : 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 border border-orange-300 dark:border-orange-600'
                          }`}
                        >
                          Yes, Add {Math.ceil(calculatedHours - 4)} Hour{Math.ceil(calculatedHours - 4) > 1 ? 's' : ''} (+${Math.ceil(calculatedHours - 4) * 100})
                        </button>
                        <button
                          onClick={() => handleAddSpeakerHours(0)}
                          className={`flex-1 px-4 py-2 rounded-lg transition-colors font-semibold ${
                            additionalHoursSelected === 0
                              ? 'bg-orange-500 text-white'
                              : 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 border border-orange-300 dark:border-orange-600'
                          }`}
                        >
                          No, Just 4 Hours
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowSpeakerUpsell(false);
                      setAdditionalHoursSelected(0);
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => handleSaveSpeakerRental()}
                    className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-semibold"
                  >
                    Save Selection
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <QuoteBottomNav quoteId={id} />
      </div>
    </>
  );
}

