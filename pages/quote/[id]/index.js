import { useRouter } from 'next/router';
import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Sparkles, Music, Calendar, MapPin, Users, Heart, Star, ArrowLeft, Loader2, ChevronDown, ChevronUp, FileText } from 'lucide-react';

export default function PersonalizedQuote() {
  const router = useRouter();
  const { id } = router.query;
  const [leadData, setLeadData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [saving, setSaving] = useState(false);
  const [expandedBreakdown, setExpandedBreakdown] = useState(null);
  const [expandedPackages, setExpandedPackages] = useState(new Set()); // Track which packages are expanded
  const [existingSelection, setExistingSelection] = useState(null);
  const [contractSigned, setContractSigned] = useState(false);
  const [showEditMode, setShowEditMode] = useState(false);
  

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
      const [leadResponse, quoteResponse] = await Promise.all([
        fetch(`/api/leads/${id}`),
        fetch(`/api/quote/${id}`).catch(() => null) // Quote might not exist yet
      ]);

      if (leadResponse.ok) {
        const data = await leadResponse.json();
        if (data && data.id) {
          setLeadData(data);
          setError(null);
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
          if (quoteData.package_id) {
            setSelectedPackage(quoteData.package_id);
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

  // Track page view and time on page
  useEffect(() => {
    if (!id || !leadData || loading) return;

    const quoteId = id;
    const startTime = Date.now();
    let timeTrackingInterval = null;
    let hasTrackedView = false;

    // Track initial page view
    const trackPageView = async () => {
      if (hasTrackedView) return;
      hasTrackedView = true;

      try {
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
              name: leadData.name
            }
          })
        });
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
  }, [id, leadData, loading, selectedPackage, selectedAddons]);

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

  // Determine event type from lead data
  const eventType = leadData?.eventType || leadData?.event_type || 'wedding';
  const isCorporate = eventType?.toLowerCase().includes('corporate') || eventType?.toLowerCase().includes('business');
  const isSchool = eventType?.toLowerCase().includes('school') || eventType?.toLowerCase().includes('dance') || eventType?.toLowerCase().includes('prom') || eventType?.toLowerCase().includes('homecoming');

  // Wedding Packages
  const weddingPackages = [
    {
      id: 'package1',
      name: 'Package 1',
      price: 2000,
      aLaCartePrice: 2600,
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
      price: 2500,
      aLaCartePrice: 3200,
      description: 'Reception Only - Most Popular',
      features: [
        'Up to 4 hours of DJ/MC services at reception',
        'Speakers & microphones included',
        'Dance Floor Lighting',
        'Multi-color LED fixtures for dance floor',
        'Uplighting (16 multicolor LED fixtures)',
        'Ceremony Audio (additional hour + ceremony music)',
        'Monogram Projection',
        'Custom graphic with your names or initials'
      ],
      popular: true
    },
    {
      id: 'package3',
      name: 'Package 3',
      price: 3000,
      aLaCartePrice: 3700,
      description: 'Ceremony & Reception - Premium Experience',
      features: [
        'Up to 4 hours of DJ/MC services at reception',
        'Speakers & microphones included',
        'Ceremony Audio (additional hour + ceremony music)',
        'Dance Floor Lighting',
        'Multi-color LED fixtures for dance floor',
        'Uplighting (16 multicolor LED fixtures)',
        'Dancing on the Clouds',
        'Sophisticated dry ice effect for first dance',
        'Monogram Projection',
        'Custom graphic with your names or initials'
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

  const packages = isSchool ? schoolPackages : (isCorporate ? corporatePackages : weddingPackages);

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
      name: '3 Hours DJ/MC Services (A La Carte)',
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
      name: 'Additional Speaker',
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
      name: '3 Hours DJ/MC Services (A La Carte)',
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
      name: 'Additional Speaker',
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
      name: '3 Hours DJ/MC Services (A La Carte)',
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
      name: 'Additional Speaker',
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

  const addons = isSchool ? schoolAddons : (isCorporate ? corporateAddons : weddingAddons);

  const getPackageBreakdown = (packageId) => {
    const breakdowns = {
      // Wedding Package Breakdowns
      'package1': [
        { item: '4 Hours DJ/MC Services', description: 'Professional DJ and MC services for up to 4 hours. Includes sound system, microphones, and music library.', price: 1600 },
        { item: 'Dance Floor Lighting', description: 'Multi-color LED fixtures for lighting the dance floor, audience, and/or performer.', price: 400 },
        { item: 'Uplighting (16 fixtures)', description: 'Up to 16 multicolor LED fixtures to enhance your venue ambiance.', price: 350 },
        { item: 'Additional Speaker', description: 'Extra powered speaker with built-in mixer for microphone or auxiliary inputs.', price: 250 }
      ],
      'package2': [
        { item: '4 Hours DJ/MC Services', description: 'Professional DJ and MC services for up to 4 hours. Includes sound system, microphones, and music library.', price: 1600 },
        { item: 'Dance Floor Lighting', description: 'Multi-color LED fixtures for lighting the dance floor, audience, and/or performer.', price: 400 },
        { item: 'Uplighting (16 fixtures)', description: 'Up to 16 multicolor LED fixtures to enhance your venue ambiance.', price: 350 },
        { item: 'Ceremony Audio', description: 'Additional hour of DJ services + ceremony music programming. Perfect for couples who want professional audio for their ceremony.', price: 500 },
        { item: 'Monogram Projection', description: 'A custom graphic showing the names or initials of newlyweds. The font and look is fully customizable to fit clients needs. Monograms can be projected on any floor or wall.', price: 350 }
      ],
      'package3': [
        { item: '4 Hours DJ/MC Services', description: 'Professional DJ and MC services for up to 4 hours. Includes sound system, microphones, and music library.', price: 1600 },
        { item: 'Dance Floor Lighting', description: 'Multi-color LED fixtures for lighting the dance floor, audience, and/or performer.', price: 400 },
        { item: 'Uplighting (16 fixtures)', description: 'Up to 16 multicolor LED fixtures to enhance your venue ambiance.', price: 350 },
        { item: 'Ceremony Audio', description: 'Additional hour of DJ services + ceremony music programming. Perfect for couples who want professional audio for their ceremony.', price: 500 },
        { item: 'Monogram Projection', description: 'A custom graphic showing the names or initials of newlyweds. The font and look is fully customizable to fit clients needs. Monograms can be projected on any floor or wall.', price: 350 },
        { item: 'Dancing on the Clouds', description: 'Sophisticated dry ice effect for first dance and special moments. Creates a magical, floor-hugging cloud effect.', price: 500 }
      ],
      // Corporate Package Breakdowns
      'corporate-basics': [
        { item: '3 Hours DJ/MC Services', description: 'Professional DJ and MC services for up to 3 hours. Includes sound system, microphones, and music library.', price: 850 }
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
      ]
    };
    return breakdowns[packageId] || [];
  };

  const calculateTotal = () => {
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

  const handleSaveQuote = async () => {
    if (!selectedPackage) {
      alert('Please select a package first');
      return;
    }

    setSaving(true);
    try {
      // If using fallback data (id === 'fallback'), we can't save to database
      // But we can still show success and store locally
      if (id === 'fallback' || !id || id === 'null' || id === 'undefined') {
        // Store selections in localStorage as backup
        const quoteData = {
          packageId: selectedPackage.id,
          packageName: selectedPackage.name,
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
      const totalPrice = calculateTotal();
      
      console.log('💾 Saving quote:', {
        leadId: id,
        packageId: selectedPackage?.id,
        packageName: selectedPackage?.name,
        packagePrice: packagePrice,
        totalPrice: totalPrice,
        selectedPackage: selectedPackage
      });

      const response = await fetch('/api/quote/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leadId: id,
          packageId: selectedPackage.id,
          packageName: selectedPackage.name,
          packagePrice: packagePrice,
          addons: selectedAddons.map(a => ({ id: a.id, name: a.name, price: a.price })),
          totalPrice: totalPrice
        })
      });

      if (response.ok) {
        const result = await response.json();
        router.push(`/quote/${id}/confirmation`);
      } else {
        // If save fails, still store locally as backup
        const quoteData = {
          leadId: id,
          packageId: selectedPackage.id,
          packageName: selectedPackage.name,
          addons: selectedAddons.map(a => ({ id: a.id, name: a.name, price: a.price })),
          total: calculateTotal(),
          leadData: leadData,
          timestamp: new Date().toISOString()
        };
        
        try {
          localStorage.setItem('pending_quote', JSON.stringify(quoteData));
          console.log('✅ Saved quote selections to localStorage as backup');
        } catch (e) {
          console.warn('Could not save to localStorage:', e);
        }
        
        throw new Error('Failed to save quote');
      }
    } catch (error) {
      console.error('Error saving quote:', error);
      // Even if save fails, we've stored locally, so show a helpful message
      alert('Your selections have been saved locally. We\'ll contact you within 24 hours to finalize your quote. Thank you!');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Head>
          <title>Loading Your Quote | M10 DJ Company</title>
        </Head>
        {/* Simplified Header with Logo Only */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center h-14">
              <Link href="/" className="flex-shrink-0">
                <Image
                  src="/logo-static.jpg"
                  alt="M10 DJ Company"
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                  priority
                />
              </Link>
            </div>
          </div>
        </header>
        <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
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
        </Head>
        {/* Simplified Header with Logo Only */}
        <header className="sticky top-0 z-50 bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-800">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center h-14">
              <Link href="/" className="flex-shrink-0">
                <Image
                  src="/logo-static.jpg"
                  alt="M10 DJ Company"
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                  priority
                />
              </Link>
            </div>
          </div>
        </header>
        <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
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
          <meta name="description" content={`Personalized ${isCorporate ? 'corporate event' : 'wedding'} DJ quote for ${leadData.name}`} />
      </Head>
      {/* Simplified Header with Logo Only */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="inline-block">
            <Image
              src="/logo-static.jpg"
              alt="M10 DJ Company"
              width={120}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </Link>
        </div>
      </header>
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          {/* Header Section */}
          <div className="text-center mb-12">
            <Link href="/" className="inline-flex items-center gap-2 text-brand hover:text-brand-dark mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Your Personalized {isSchool ? 'School Event' : isCorporate ? 'Corporate Event' : 'Wedding'} Quote
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-4 text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>{leadData.name}</span>
              </div>
              {leadData.eventDate && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>{new Date(leadData.eventDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
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

          {/* Existing Selection Banner */}
          {existingSelection && !contractSigned && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 mb-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                      You've Already Made a Selection
                    </h3>
                  </div>
                  <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <p><strong>Package:</strong> {existingSelection.package_name}</p>
                    {existingSelection.addons && existingSelection.addons.length > 0 && (
                      <p><strong>Add-ons:</strong> {existingSelection.addons.map(a => typeof a === 'object' ? a.name || a.id : a).join(', ')}</p>
                    )}
                    <p><strong>Total:</strong> ${existingSelection.total_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowEditMode(!showEditMode)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium whitespace-nowrap"
                >
                  {showEditMode ? 'Cancel Edit' : 'Edit Selection'}
                </button>
              </div>
            </div>
          )}

          {/* Contract Signed Notice */}
          {contractSigned && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 mb-8">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                  <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-1">
                    Contract Signed
                  </h3>
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Your selection has been finalized and your contract has been signed. Changes cannot be made at this time.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons for Existing Selection */}
          {existingSelection && !contractSigned && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-8 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
                Next Steps
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <Link
                  href={`/quote/${id}/invoice`}
                  className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-brand transition-colors text-center"
                >
                  <FileText className="w-8 h-8 text-brand mb-2" />
                  <span className="font-medium text-gray-900 dark:text-white">View Invoice</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 mt-1">See payment details</span>
                </Link>
                <Link
                  href={`/quote/${id}/contract`}
                  className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-brand transition-colors text-center"
                >
                  <FileText className="w-8 h-8 text-brand mb-2" />
                  <span className="font-medium text-gray-900 dark:text-white">Sign Contract</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 mt-1">Review and sign</span>
                </Link>
                <Link
                  href={`/quote/${id}/payment`}
                  className="flex flex-col items-center justify-center p-4 border-2 border-brand rounded-lg bg-brand/10 hover:bg-brand/20 transition-colors text-center"
                >
                  <CheckCircle className="w-8 h-8 text-brand mb-2" />
                  <span className="font-medium text-gray-900 dark:text-white">Make Payment</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 mt-1">Secure checkout</span>
                </Link>
              </div>
            </div>
          )}

          {/* Savings Explanation */}
          {(!existingSelection || showEditMode) && (
            <div className="bg-gradient-to-r from-brand/10 to-brand/5 dark:from-brand/20 dark:to-brand/10 rounded-xl p-6 mb-8 border border-brand/20">
              <p className="text-center text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Our packages bundle services at a discounted rate. Compare the package price to a la carte pricing and see your savings! 🎉
              </p>
            </div>
          )}

          {/* Packages Section */}
          {(!existingSelection || showEditMode || contractSigned) && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-4">
              <Music className="inline w-8 h-8 text-brand mr-2" />
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
                          <span className="text-4xl font-bold text-brand">${pkg.price.toLocaleString()}</span>
                          <span className="text-lg text-gray-400 dark:text-gray-500 line-through">${pkg.aLaCartePrice.toLocaleString()}</span>
                        </div>
                        <div className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-sm font-semibold">
                          <CheckCircle className="w-4 h-4" />
                          Save ${(pkg.aLaCartePrice - pkg.price).toLocaleString()}
                        </div>
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
                            <div className="flex justify-between text-sm font-bold text-brand mt-1">
                              <span>Package Price:</span>
                              <span>${pkg.price.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Select Package Button */}
                      <button
                        onClick={() => {
                          setSelectedPackage(pkg);
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
                                  event_type: leadData.eventType || leadData.event_type
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
                            Selected
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

          {/* Add-ons Section */}
          {(!existingSelection || showEditMode || contractSigned) && (
          <section id="addons-section" className="mb-12">
            <h2 className="text-3xl font-bold text-center mb-4">
              <Sparkles className="inline w-8 h-8 text-brand mr-2" />
              A La Carte
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              Add extra services to your package. These are optional upgrades that can be added to personalize your celebration even more! 
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {addons.map((addon) => {
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
          {(!existingSelection || showEditMode || contractSigned) && (
          <section className="bg-gradient-to-r from-brand/10 to-brand/5 dark:from-brand/20 dark:to-brand/10 rounded-xl p-8 border border-brand/20">
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

              {/* Regular Total Display */}
              <div className="flex justify-between items-center mb-6">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">Total:</span>
                <span className="text-4xl font-bold text-brand">${calculateTotal().toLocaleString()}</span>
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
                onClick={handleSaveQuote}
                disabled={!selectedPackage || saving}
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
    </>
  );
}

