import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Mail, MapPin, Clock, AlertCircle, Send, Phone } from 'lucide-react';
import { FormErrorLogger } from '../../utils/form-error-logger';
import { FormStateManager } from '../../utils/form-state-manager';
import { ClientIdempotencyTracker } from '../../utils/idempotency';
import { validateContactForm } from '../../utils/form-validator';
import ContactFormChat from './ContactFormChat';
import VenueInput from './VenueInput';
import { useToast } from '@/components/ui/Toasts/use-toast';
// Temporarily disabled to prevent rate limiting issues
// import { trackLead, trackContactAction } from '../EnhancedTracking';

export default function ContactForm({ className = '', showSubmitButton = true, isSubmitOnly = false, modalLayout = false, organizationId = null, ctaSource = null }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventType: '',
    eventDate: '',
    eventTime: '',
    guests: '',
    venueName: '',
    venueAddress: '',
    message: '',
    honeypot: '' // Hidden field for bot detection
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(() => {
    // Check if chat should be minimized from sessionStorage
    if (typeof window !== 'undefined') {
      try {
        return sessionStorage.getItem('chat_minimized') === 'true';
      } catch (e) {
        return false;
      }
    }
    return false;
  });
  const [submissionId, setSubmissionId] = useState(() => {
    // Restore submissionId from sessionStorage if available
    if (typeof window !== 'undefined') {
      try {
        const savedId = sessionStorage.getItem('chat_submission_id');
        return savedId && savedId !== '' ? savedId : null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [error, setError] = useState('');
  const [fieldWarnings, setFieldWarnings] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [showRestoredNotice, setShowRestoredNotice] = useState(false);
  
  // Initialize utilities
  const errorLogger = useRef(null);
  const stateManager = useRef(null);
  const idempotencyTracker = useRef(null);
  const idempotencyKey = useRef(null);
  const draftSaveTimeout = useRef(null);
  const lastDraftSaveRef = useRef(null);
  
  useEffect(() => {
    errorLogger.current = new FormErrorLogger('MainContactForm');
    stateManager.current = new FormStateManager('contact_form', {
      excludeFields: ['honeypot'],
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });
    idempotencyTracker.current = new ClientIdempotencyTracker('contact_submissions');
    
    errorLogger.current.logEvent('form_loaded');
    
    // Try to restore saved form state
    const savedState = stateManager.current.restoreState();
    if (savedState) {
      setFormData(prev => ({ ...prev, ...savedState }));
      setShowRestoredNotice(true);
      errorLogger.current.logEvent('form_state_restored');
      
      // Hide notice after 5 seconds
      setTimeout(() => setShowRestoredNotice(false), 5000);
    }
  }, []);

  // Auto-save draft to backend when user fills out form
  const saveDraftToBackend = async (formDataToSave) => {
    // Only save if we have name and email (minimum requirements)
    if (!formDataToSave.name?.trim() || !formDataToSave.email?.trim() || !formDataToSave.email.includes('@')) {
      return;
    }

    // Don't save if this is the same as the last saved draft (avoid duplicate saves)
    const currentState = JSON.stringify({
      name: formDataToSave.name,
      email: formDataToSave.email,
      phone: formDataToSave.phone,
      eventType: formDataToSave.eventType,
      eventDate: formDataToSave.eventDate,
      venueName: formDataToSave.venueName,
      venueAddress: formDataToSave.venueAddress
    });

    if (lastDraftSaveRef.current === currentState) {
      return;
    }

    try {
      const response = await fetch('/api/contact/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formDataToSave.name.trim(),
          email: formDataToSave.email.trim().toLowerCase(),
          phone: formDataToSave.phone?.trim() || null,
          eventType: formDataToSave.eventType || null,
          eventDate: formDataToSave.eventDate || null,
          eventTime: formDataToSave.eventTime || null,
          venueName: formDataToSave.venueName?.trim() || null,
          venueAddress: formDataToSave.venueAddress?.trim() || null,
          location: (formDataToSave.venueName && formDataToSave.venueAddress)
            ? `${formDataToSave.venueName}, ${formDataToSave.venueAddress}`
            : (formDataToSave.venueName || formDataToSave.venueAddress || null),
          message: formDataToSave.message?.trim() || null,
          guests: formDataToSave.guests || null,
          honeypot: formDataToSave.honeypot || ''
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          lastDraftSaveRef.current = currentState;
          console.log('✅ Draft saved to backend', result.isNewDraft ? '(new)' : '(updated)');
        }
      }
    } catch (error) {
      // Silently fail - draft saving shouldn't interrupt user experience
      console.debug('Could not save draft to backend:', error);
    }
  };

  // Debounced auto-save to backend
  useEffect(() => {
    // Clear any existing timeout
    if (draftSaveTimeout.current) {
      clearTimeout(draftSaveTimeout.current);
    }

    // Only save if we have name and email
    if (!formData.name?.trim() || !formData.email?.trim()) {
      return;
    }

    // Debounce draft saves - wait 10 seconds after user stops typing
    draftSaveTimeout.current = setTimeout(() => {
      saveDraftToBackend(formData);
    }, 10000); // 10 second delay

    // Cleanup on unmount
    return () => {
      if (draftSaveTimeout.current) {
        clearTimeout(draftSaveTimeout.current);
      }
    };
  }, [formData.name, formData.email, formData.phone, formData.eventType, formData.eventDate, formData.venueName, formData.venueAddress, formData.message, formData.guests]);

  // Stop saving drafts when form is submitted
  useEffect(() => {
    if (submitted) {
      if (draftSaveTimeout.current) {
        clearTimeout(draftSaveTimeout.current);
      }
      lastDraftSaveRef.current = null;
    }
  }, [submitted]);

  // No scroll handling needed - chat opens full-screen

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const updatedData = {
      ...formData,
      [name]: value
    };
    
    setFormData(updatedData);
    
    // Auto-save form state (debounced)
    if (stateManager.current) {
      stateManager.current.saveState(updatedData);
    }
    
    // Clear field-specific errors when user starts typing
    if (error) {
      setError('');
    }
    if (fieldWarnings[name]) {
      setFieldWarnings(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  // Validate form data before submission using enhanced validator
  const validateForm = () => {
    // Combine venueName and venueAddress for backward compatibility with validator
    const location = formData.venueName || formData.venueAddress || '';
    const validation = validateContactForm({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      eventType: formData.eventType,
      eventDate: formData.eventDate,
      location: location,
      message: formData.message
    });
    
    // Set field-specific errors for display
    // Map location error to venue for display
    const mappedErrors = { ...validation.errors };
    if (mappedErrors.location) {
      mappedErrors.venue = mappedErrors.location;
      delete mappedErrors.location;
    }
    setFieldErrors(mappedErrors);
    
    // Set warnings for display
    if (validation.hasWarnings) {
      setFieldWarnings(validation.warnings);
    } else {
      setFieldWarnings({});
    }
    
    // Log validation errors
    if (!validation.valid && errorLogger.current) {
      errorLogger.current.logValidationError(Object.values(validation.errors));
    }
    
    return validation.valid ? [] : Object.values(validation.errors);
  };

  // Retry logic with exponential backoff
  const submitWithRetry = async (data, maxRetries = 3) => {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Submitting form (attempt ${attempt}/${maxRetries})...`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...data,
            organizationId: organizationId || undefined
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const result = await response.json();
          console.log('Form submitted successfully:', result);
          
          // Log success
          if (errorLogger.current) {
            errorLogger.current.logSuccess(result.submissionId, result.contactId);
          }
          
          return { success: true, data: result };
        } else {
          const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
          lastError = new Error(errorData.message || `Server error: ${response.status}`);
          
          // Log API error
          if (errorLogger.current) {
            errorLogger.current.logApiError(lastError, attempt, maxRetries);
          }
          
          // Don't retry on client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            throw lastError;
          }
          
          console.error(`Attempt ${attempt} failed:`, lastError.message);
        }
      } catch (error) {
        lastError = error;
        console.error(`Attempt ${attempt} failed:`, error.message);
        
        // Log network errors
        if (error.name === 'AbortError' || error.message.includes('fetch')) {
          if (errorLogger.current) {
            errorLogger.current.logNetworkError(error);
          }
        }
        
        // Don't retry on validation errors or abort errors
        if (error.name === 'AbortError') {
          lastError = new Error('Request timeout. Please check your connection and try again.');
          if (attempt < maxRetries) continue;
          throw lastError;
        }
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    throw lastError || new Error('Failed to submit form after multiple attempts');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setFieldWarnings({});
    setFieldErrors({});
    
    // Log submission attempt
    if (errorLogger.current) {
      errorLogger.current.logSubmissionAttempt(formData);
    }
    
    // Check for duplicate submission
    if (idempotencyTracker.current && idempotencyTracker.current.isDuplicate(formData, 60)) {
      setError('You just submitted this form. Please wait a moment before submitting again.');
      setIsSubmitting(false);
      return;
    }
    
    // Validate form
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join('. ') + '.');
      setIsSubmitting(false);
      
      // Scroll to error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    // Generate idempotency key for this submission
    if (!idempotencyKey.current) {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      idempotencyKey.current = `${timestamp}-${random}`;
    }
    
    try {
      // Build location string from venueName and venueAddress (for backward compatibility)
      let location = null;
      if (formData.venueName && formData.venueAddress) {
        location = `${formData.venueName.trim()}, ${formData.venueAddress.trim()}`;
      } else if (formData.venueName) {
        location = formData.venueName.trim();
      } else if (formData.venueAddress) {
        location = formData.venueAddress.trim();
      }
      
      const submissionData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        eventType: formData.eventType,
        eventDate: formData.eventDate || null,
        eventTime: formData.eventTime || null,
        venueName: formData.venueName.trim() || null,
        venueAddress: formData.venueAddress.trim() || null,
        location: location, // Keep for backward compatibility
        message: `${formData.message}${formData.guests ? `\n\nNumber of guests: ${formData.guests}` : ''}`.trim(),
        honeypot: formData.honeypot, // Include honeypot field
        idempotencyKey: idempotencyKey.current, // Include idempotency key
        ...(ctaSource && { ctaSource }), // Which CTA opened the form (e.g. hero, packages-essential)
        ...(typeof window !== 'undefined' && window.location?.pathname && { sourcePage: window.location.pathname }) // Page where form was opened
      };
      
      // Submit with retry logic
      const result = await submitWithRetry(submissionData);
      
      if (result.success) {
        // Record submission for duplicate detection
        if (idempotencyTracker.current) {
          idempotencyTracker.current.recordSubmission(submissionData, idempotencyKey.current);
        }
        
        // Clear saved form state on successful submission
        if (stateManager.current) {
          stateManager.current.clearState();
        }

        // Clear draft save timeout
        if (draftSaveTimeout.current) {
          clearTimeout(draftSaveTimeout.current);
        }
        lastDraftSaveRef.current = null;
        
        // Track successful lead generation
        // trackLead('contact_form', {
        //   event_type: formData.eventType,
        //   guest_count: formData.guests,
        //   has_venue: !!formData.venue,
        //   has_date: !!formData.eventDate
        // });
        
        // Track Facebook conversion
        if (typeof window !== 'undefined' && window.fbq) {
          window.fbq('track', 'Lead', {
            content_name: 'Contact Form Submission',
            content_category: formData.eventType,
            value: 1
          });
        }
        
        // Log success for monitoring
        console.log('✅ Lead form submitted successfully:', {
          submissionId: result.data?.submissionId,
          contactId: result.data?.contactId,
          quoteId: result.data?.quoteId,
          timestamp: new Date().toISOString(),
          idempotencyKey: idempotencyKey.current
        });
        
        // Store quote ID for personalized pages
        // Use quoteId (explicit field), or fallback to contactId, then submissionId
        const quoteId = result.data?.quoteId || result.data?.contactId || result.data?.submissionId;
        
        // Store form data in sessionStorage as fallback for quote page
        if (result.data?.formData) {
          try {
            sessionStorage.setItem('quote_form_data', JSON.stringify(result.data.formData));
            console.log('✅ Saved form data to sessionStorage as fallback');
          } catch (e) {
            console.warn('⚠️ Could not save form data to sessionStorage:', e);
          }
        }
        
        // Also store contact form data for schedule page pre-population
        try {
          sessionStorage.setItem('contact_form_data', JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            eventType: formData.eventType,
            eventDate: formData.eventDate,
            venueName: formData.venueName,
            venueAddress: formData.venueAddress,
            message: formData.message
          }));
          console.log('✅ Saved contact form data for schedule page pre-population');
        } catch (e) {
          console.warn('⚠️ Could not save contact form data to sessionStorage:', e);
        }
        
        if (quoteId) {
          console.log('📋 Setting quote ID:', quoteId, '(type:', typeof quoteId, ')');
          setSubmissionId(String(quoteId)); // Ensure it's a string
        } else {
          console.error('❌ CRITICAL: No valid ID returned from API for quote page!');
          console.error('API response:', result.data);
          
          // Even without quoteId, we can still show the chat
          // The quote page will use form data from sessionStorage
          if (result.data?.formData) {
            console.log('✅ Will use form data fallback for quote page');
          }
        }
        
        // Show success toast notification
        toast({
          title: 'Form Submitted Successfully!',
          description: 'Thank you for your submission. We\'ll get back to you soon!',
          duration: 3000,
        });
        
        setSubmitted(true);
        
        // Reset idempotency key for potential future submissions
        idempotencyKey.current = null;
      }
    } catch (error) {
      console.error('❌ Critical error submitting form:', error);
      
      // User-friendly error messages
      let errorMessage = 'We encountered an issue processing your request. ';
      
      if (error.message.includes('timeout') || error.message.includes('network')) {
        errorMessage += 'Please check your internet connection and try again. ';
      } else if (error.message.includes('validation')) {
        errorMessage += error.message + ' ';
      } else {
        errorMessage += 'Please try again or call us directly at (901) 410-2020. ';
      }
      
      errorMessage += 'Your information is important to us!';
      
      setError(errorMessage);
      
      // Log to console for debugging
      console.error('Form submission error details:', {
        error: error.message,
        stack: error.stack,
        formData: { ...formData, message: '[redacted]' }, // Don't log sensitive data fully
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if we're on quote page and auto-minimize chat
  useEffect(() => {
    if (typeof window !== 'undefined' && submitted) {
      const isQuotePage = window.location.pathname.includes('/quote/');
      if (isQuotePage) {
        setIsChatMinimized(true);
      }
    }
  }, [submitted]);

  // Show chat interface after successful submission
  useEffect(() => {
    if (submitted && !isChatMinimized) {
      // Lock body scroll when chat is full-screen
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      // Ensure we're at the top of the page
      window.scrollTo(0, 0);
    } else {
      // Restore scroll when chat is minimized or closed
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }
    return () => {
      // Restore scroll when component unmounts
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [submitted, isChatMinimized]);

  // Render chat using Portal (full-screen or minimized)
  const chatOverlay = submitted && typeof document !== 'undefined' && createPortal(
    isChatMinimized ? (
      // Minimized chat widget
      <ContactFormChat 
        formData={formData}
        submissionId={submissionId}
        onClose={() => setSubmitted(false)}
        isMinimized={true}
        onMinimize={() => setIsChatMinimized(false)}
      />
    ) : (
      // Full-screen chat
      <div 
        className="fixed inset-0 z-[99999] bg-white dark:bg-black"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
      >
        <ContactFormChat 
          formData={formData}
          submissionId={submissionId}
          onClose={() => setSubmitted(false)}
          isMinimized={false}
          onMinimize={() => setIsChatMinimized(true)}
        />
      </div>
    ),
    document.body
    );

  const isModal = className.includes('modal-form');

  // If submit-only mode, only render the submit button section
  if (isSubmitOnly) {
    return (
      <div className={`${className}`}>
        <form onSubmit={handleSubmit} className="space-y-0">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full bg-gradient-to-r from-brand to-amber-500 hover:from-amber-500 hover:to-brand text-black font-bold ${isModal ? 'py-3 px-4 text-sm' : 'py-4 px-6'} rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]`}
            aria-busy={isSubmitting}
            aria-live="polite"
          >
            {isSubmitting ? (
              <>
                <div className={`${isModal ? 'w-4 h-4' : 'w-5 h-5'} border-2 border-black border-t-transparent rounded-full animate-spin`}></div>
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send className={isModal ? 'w-4 h-4' : 'w-5 h-5'} />
                <span>Get My Free Quote</span>
              </>
            )}
          </button>
          
          {isSubmitting && (
            <div className={`text-center ${isModal ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400 ${isModal ? 'mt-2' : 'mt-3'} animate-pulse font-inter`}>
              Please wait, do not refresh or close this page...
            </div>
          )}
          
          <p className={`text-center text-xs text-gray-500 dark:text-gray-400 ${isModal ? 'mt-2' : 'mt-4'} font-inter`}>
            We&apos;ll respond within 24 hours • <a href="tel:+19014102020" className="text-brand hover:underline font-semibold">Call (901) 410-2020</a> for immediate assistance
          </p>
        </form>
      </div>
    );
  }

  // Modal layout: form spans scrollable area and sticky footer
  if (modalLayout) {
    return (
      <div className={`${className} flex flex-col`} style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <form onSubmit={handleSubmit} className={`flex flex-col flex-1 min-h-0 ${isModal ? 'space-y-3' : 'space-y-6'}`} style={{ display: 'flex', flexDirection: 'column', flex: '1 1 0%', minHeight: 0, overflow: 'hidden' }}>
          {/* Scrollable form fields */}
          <div className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', flex: '1 1 0%', minHeight: 0, overflowY: 'auto' }}>
            <div className="p-4">
              {showRestoredNotice && (
                <div className={`${isModal ? 'mb-3 p-2' : 'mb-6 p-4'} bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start`}>
                  <AlertCircle className={`${isModal ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0`} />
                  <div>
                    <p className={`text-blue-800 dark:text-blue-300 ${isModal ? 'text-xs' : 'text-sm'} font-inter font-semibold`}>
                      Your previous form data was restored
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className={`${isModal ? 'mb-3 p-2' : 'mb-6 p-4'} bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg`}>
                  <p className={`text-red-700 dark:text-red-400 ${isModal ? 'text-xs' : 'text-sm'} font-inter`}>{error}</p>
                </div>
              )}

              {/* Honeypot field */}
              <div style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }} aria-hidden="true">
                <label htmlFor="website">Website (leave blank)</label>
                <input
                  type="text"
                  id="website"
                  name="honeypot"
                  value={formData.honeypot}
                  onChange={handleInputChange}
                  tabIndex="-1"
                  autoComplete="off"
                />
              </div>

              {/* Form fields - same as below */}
              <div className={`grid grid-cols-1 ${isModal ? 'md:grid-cols-2 gap-3' : 'md:grid-cols-2 gap-6'}`}>
                <div>
                  <label htmlFor="name" className={`block ${isModal ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 dark:text-gray-100 ${isModal ? 'mb-1' : 'mb-2'} font-inter`}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`modern-input ${isModal ? 'py-2 text-sm' : ''} ${fieldErrors.name ? 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="Your full name"
                  />
                  {fieldErrors.name && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-start">
                      <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                      {fieldErrors.name}
                    </p>
                  )}
                  {!fieldErrors.name && fieldWarnings.name && (
                    <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-500 flex items-start">
                      <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                      {fieldWarnings.name}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className={`block ${isModal ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 dark:text-gray-100 ${isModal ? 'mb-1' : 'mb-2'} font-inter`}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`modern-input ${isModal ? 'py-2 text-sm' : ''} ${fieldErrors.email ? 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="your.email@example.com"
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-start">
                      <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                      {fieldErrors.email}
                    </p>
                  )}
                  {!fieldErrors.email && fieldWarnings.email && (
                    <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-500 flex items-start">
                      <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                      {fieldWarnings.email}
                    </p>
                  )}
                </div>
              </div>

              <div className={`grid grid-cols-1 ${isModal ? 'md:grid-cols-2 gap-3' : 'md:grid-cols-2 gap-6'}`}>
                <div>
                  <label htmlFor="phone" className={`block ${isModal ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 dark:text-gray-100 ${isModal ? 'mb-1' : 'mb-2'} font-inter`}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`modern-input ${isModal ? 'py-2 text-sm' : ''} ${fieldErrors.phone ? 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                    placeholder="(901) 410-2020"
                  />
                  {fieldErrors.phone && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-start">
                      <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                      {fieldErrors.phone}
                    </p>
                  )}
                  {!fieldErrors.phone && fieldWarnings.phone && (
                    <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-500 flex items-start">
                      <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                      {fieldWarnings.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="eventType" className={`block ${isModal ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 dark:text-gray-100 ${isModal ? 'mb-1' : 'mb-2'} font-inter`}>
                    Event Type *
                  </label>
                  <select
                    id="eventType"
                    name="eventType"
                    required
                    value={formData.eventType}
                    onChange={handleInputChange}
                    className={`modern-select ${isModal ? 'py-2 text-sm' : ''} ${fieldErrors.eventType ? 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  >
                    <option value="">Select event type</option>
                    <option value="Wedding">Wedding</option>
                    <option value="Corporate Event">Corporate Event</option>
                    <option value="Birthday Party">Birthday Party</option>
                    <option value="Anniversary">Anniversary</option>
                    <option value="Graduation">Graduation</option>
                    <option value="Holiday Party">Holiday Party</option>
                    <option value="School Dance">School Dance/Event</option>
                    <option value="Other">Other</option>
                  </select>
                  {fieldErrors.eventType && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-start">
                      <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                      {fieldErrors.eventType}
                    </p>
                  )}
                </div>
              </div>

              <div className={`grid grid-cols-1 ${isModal ? 'md:grid-cols-2 gap-3' : 'md:grid-cols-2 gap-6'}`}>
                <div>
                  <label htmlFor="eventDate" className={`block ${isModal ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 dark:text-gray-100 ${isModal ? 'mb-1' : 'mb-2'} font-inter`}>
                    Event Date
                  </label>
                  <input
                    type="date"
                    id="eventDate"
                    name="eventDate"
                    value={formData.eventDate}
                    onChange={handleInputChange}
                    className={`modern-input ${isModal ? 'py-2 text-sm' : ''} ${fieldErrors.eventDate ? 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {fieldErrors.eventDate && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-start">
                      <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                      {fieldErrors.eventDate}
                    </p>
                  )}
                  {!fieldErrors.eventDate && fieldWarnings.eventDate && (
                    <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-500 flex items-start">
                      <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                      {fieldWarnings.eventDate}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="guests" className={`block ${isModal ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 dark:text-gray-100 ${isModal ? 'mb-1' : 'mb-2'} font-inter`}>
                    Number of Guests
                  </label>
                  <select
                    id="guests"
                    name="guests"
                    value={formData.guests}
                    onChange={handleInputChange}
                    className={`modern-select ${isModal ? 'py-2 text-sm' : ''}`}
                  >
                    <option value="">Select guest count</option>
                    <option value="1-25">1-25 guests</option>
                    <option value="26-50">26-50 guests</option>
                    <option value="51-100">51-100 guests</option>
                    <option value="101-200">101-200 guests</option>
                    <option value="201-300">201-300 guests</option>
                    <option value="300+">300+ guests</option>
                  </select>
                </div>
              </div>

              <VenueInput
                venueName={formData.venueName}
                venueAddress={formData.venueAddress}
                onVenueNameChange={(name) => {
                  setFormData(prev => ({ ...prev, venueName: name }));
                  if (stateManager.current) {
                    stateManager.current.saveState({ ...formData, venueName: name });
                  }
                }}
                onVenueAddressChange={(address) => {
                  setFormData(prev => ({ ...prev, venueAddress: address }));
                  if (stateManager.current) {
                    stateManager.current.saveState({ ...formData, venueAddress: address });
                  }
                }}
                isModal={isModal}
                error={fieldErrors.venue}
              />

              <div>
                <label htmlFor="message" className={`block ${isModal ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 dark:text-gray-100 ${isModal ? 'mb-1' : 'mb-2'} font-inter`}>
                  Additional Details
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={isModal ? "2" : "4"}
                  value={formData.message}
                  onChange={handleInputChange}
                  className={`modern-textarea ${isModal ? 'py-2 text-sm' : ''}`}
                  placeholder="Tell us more about your event, special requests, or any questions you have..."
                />
                {fieldWarnings.message && (
                  <p className="mt-0.5 text-xs text-yellow-600 dark:text-yellow-500 flex items-start">
                    <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                    {fieldWarnings.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Submit Button Footer */}
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-black shadow-lg" style={{ flexShrink: 0, flex: '0 0 auto', padding: '16px', paddingBottom: `max(16px, calc(env(safe-area-inset-bottom, 0px) + 16px))` }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-gradient-to-r from-brand to-amber-500 hover:from-amber-500 hover:to-brand text-black font-bold ${isModal ? 'py-3 px-4 text-sm' : 'py-4 px-6'} rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]`}
              aria-busy={isSubmitting}
              aria-live="polite"
            >
              {isSubmitting ? (
                <>
                  <div className={`${isModal ? 'w-4 h-4' : 'w-5 h-5'} border-2 border-black border-t-transparent rounded-full animate-spin`}></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className={isModal ? 'w-4 h-4' : 'w-5 h-5'} />
                  <span>Get My Free Quote</span>
                </>
              )}
            </button>
            
            {isSubmitting && (
              <div className={`text-center ${isModal ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400 ${isModal ? 'mt-2' : 'mt-3'} animate-pulse font-inter`}>
                Please wait, do not refresh or close this page...
              </div>
            )}
            
            <p className={`text-center text-xs text-gray-500 dark:text-gray-400 ${isModal ? 'mt-2' : 'mt-4'} font-inter`}>
              We&apos;ll respond within 24 hours • <a href="tel:+19014102020" className="text-brand hover:underline font-semibold">Call (901) 410-2020</a> for immediate assistance
            </p>
          </div>
        </form>
        {chatOverlay}
      </div>
    );
  }

  return (
    <div className={`${className}`}>

      {showRestoredNotice && (
        <div className={`${isModal ? 'mb-3 p-2' : 'mb-6 p-4'} bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start`}>
          <AlertCircle className={`${isModal ? 'w-4 h-4' : 'w-5 h-5'} text-blue-600 dark:text-blue-400 mr-2 mt-0.5 flex-shrink-0`} />
          <div>
            <p className={`text-blue-800 dark:text-blue-300 ${isModal ? 'text-xs' : 'text-sm'} font-inter font-semibold`}>
              Your previous form data was restored
            </p>
            {!isModal && (
              <p className="text-blue-700 dark:text-blue-400 text-xs font-inter mt-1">
                We saved your progress automatically. Feel free to continue or start fresh.
              </p>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className={`${isModal ? 'mb-3 p-2' : 'mb-6 p-4'} bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg`}>
          <p className={`text-red-700 dark:text-red-400 ${isModal ? 'text-xs' : 'text-sm'} font-inter`}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className={isModal ? 'space-y-3' : 'space-y-6'}>
        {/* Honeypot field - hidden from users, visible to bots */}
        <div style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }} aria-hidden="true">
          <label htmlFor="website">Website (leave blank)</label>
          <input
            type="text"
            id="website"
            name="honeypot"
            value={formData.honeypot}
            onChange={handleInputChange}
            tabIndex="-1"
            autoComplete="off"
          />
        </div>
        <div className={`grid grid-cols-1 ${isModal ? 'md:grid-cols-2 gap-3' : 'md:grid-cols-2 gap-6'}`}>
          <div>
            <label htmlFor="name" className={`block ${isModal ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 dark:text-gray-100 ${isModal ? 'mb-1' : 'mb-2'} font-inter`}>
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className={`modern-input ${isModal ? 'py-2 text-sm' : ''} ${fieldErrors.name ? 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Your full name"
            />
            {fieldErrors.name && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-start">
                <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                {fieldErrors.name}
              </p>
            )}
            {!fieldErrors.name && fieldWarnings.name && (
              <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-500 flex items-start">
                <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                {fieldWarnings.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className={`block ${isModal ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 dark:text-gray-100 ${isModal ? 'mb-1' : 'mb-2'} font-inter`}>
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className={`modern-input ${isModal ? 'py-2 text-sm' : ''} ${fieldErrors.email ? 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="your.email@example.com"
            />
            {fieldErrors.email && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-start">
                <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                {fieldErrors.email}
              </p>
            )}
            {!fieldErrors.email && fieldWarnings.email && (
              <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-500 flex items-start">
                <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                {fieldWarnings.email}
              </p>
            )}
          </div>
        </div>

        <div className={`grid grid-cols-1 ${isModal ? 'md:grid-cols-2 gap-3' : 'md:grid-cols-2 gap-6'}`}>
          <div>
            <label htmlFor="phone" className={`block ${isModal ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 dark:text-gray-100 ${isModal ? 'mb-1' : 'mb-2'} font-inter`}>
              Phone Number *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              value={formData.phone}
              onChange={handleInputChange}
              className={`modern-input ${isModal ? 'py-2 text-sm' : ''} ${fieldErrors.phone ? 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="(901) 410-2020"
            />
            {fieldErrors.phone && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-start">
                <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                {fieldErrors.phone}
              </p>
            )}
            {!fieldErrors.phone && fieldWarnings.phone && (
              <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-500 flex items-start">
                <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                {fieldWarnings.phone}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="eventType" className={`block ${isModal ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 dark:text-gray-100 ${isModal ? 'mb-1' : 'mb-2'} font-inter`}>
              Event Type *
            </label>
            <select
              id="eventType"
              name="eventType"
              required
              value={formData.eventType}
              onChange={handleInputChange}
              className={`modern-select ${isModal ? 'py-2 text-sm' : ''} ${fieldErrors.eventType ? 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
            >
              <option value="">Select event type</option>
              <option value="Wedding">Wedding</option>
              <option value="Corporate Event">Corporate Event</option>
              <option value="Birthday Party">Birthday Party</option>
              <option value="Anniversary">Anniversary</option>
              <option value="Graduation">Graduation</option>
              <option value="Holiday Party">Holiday Party</option>
              <option value="School Dance">School Dance/Event</option>
              <option value="Other">Other</option>
            </select>
            {fieldErrors.eventType && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-start">
                <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                {fieldErrors.eventType}
              </p>
            )}
          </div>
        </div>

        <div className={`grid grid-cols-1 ${isModal ? 'md:grid-cols-2 gap-3' : 'md:grid-cols-2 gap-6'}`}>
          <div>
            <label htmlFor="eventDate" className={`block ${isModal ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 dark:text-gray-100 ${isModal ? 'mb-1' : 'mb-2'} font-inter`}>
              Event Date
            </label>
            <input
              type="date"
              id="eventDate"
              name="eventDate"
              value={formData.eventDate}
              onChange={handleInputChange}
              className={`modern-input ${isModal ? 'py-2 text-sm' : ''} ${fieldErrors.eventDate ? 'border-red-500 dark:border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
            />
            {fieldErrors.eventDate && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400 flex items-start">
                <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                {fieldErrors.eventDate}
              </p>
            )}
            {!fieldErrors.eventDate && fieldWarnings.eventDate && (
              <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-500 flex items-start">
                <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                {fieldWarnings.eventDate}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="guests" className={`block ${isModal ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 dark:text-gray-100 ${isModal ? 'mb-1' : 'mb-2'} font-inter`}>
              Number of Guests
            </label>
            <select
              id="guests"
              name="guests"
              value={formData.guests}
              onChange={handleInputChange}
              className={`modern-select ${isModal ? 'py-2 text-sm' : ''}`}
            >
              <option value="">Select guest count</option>
              <option value="1-25">1-25 guests</option>
              <option value="26-50">26-50 guests</option>
              <option value="51-100">51-100 guests</option>
              <option value="101-200">101-200 guests</option>
              <option value="201-300">201-300 guests</option>
              <option value="300+">300+ guests</option>
            </select>
          </div>
        </div>

        <VenueInput
          venueName={formData.venueName}
          venueAddress={formData.venueAddress}
          onVenueNameChange={(name) => {
            setFormData(prev => ({ ...prev, venueName: name }));
            if (stateManager.current) {
              stateManager.current.saveState({ ...formData, venueName: name });
            }
          }}
          onVenueAddressChange={(address) => {
            setFormData(prev => ({ ...prev, venueAddress: address }));
            if (stateManager.current) {
              stateManager.current.saveState({ ...formData, venueAddress: address });
            }
          }}
          isModal={isModal}
          error={fieldErrors.venue}
        />

        <div>
          <label htmlFor="message" className={`block ${isModal ? 'text-xs' : 'text-sm'} font-semibold text-gray-900 dark:text-gray-100 ${isModal ? 'mb-1' : 'mb-2'} font-inter`}>
            Additional Details
          </label>
          <textarea
            id="message"
            name="message"
            rows={isModal ? "2" : "4"}
            value={formData.message}
            onChange={handleInputChange}
            className={`modern-textarea ${isModal ? 'py-2 text-sm' : ''}`}
            placeholder="Tell us more about your event, special requests, or any questions you have..."
          />
          {fieldWarnings.message && (
            <p className="mt-0.5 text-xs text-yellow-600 dark:text-yellow-500 flex items-start">
              <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
              {fieldWarnings.message}
            </p>
          )}
        </div>

        {showSubmitButton && (
          <div className={isModal ? 'pt-2' : 'pt-4'}>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-gradient-to-r from-brand to-amber-500 hover:from-amber-500 hover:to-brand text-black font-bold ${isModal ? 'py-3 px-4 text-sm' : 'py-4 px-6'} rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]`}
              aria-busy={isSubmitting}
              aria-live="polite"
            >
              {isSubmitting ? (
                <>
                  <div className={`${isModal ? 'w-4 h-4' : 'w-5 h-5'} border-2 border-black border-t-transparent rounded-full animate-spin`}></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className={isModal ? 'w-4 h-4' : 'w-5 h-5'} />
                  <span>Get My Free Quote</span>
                </>
              )}
            </button>
            
            {isSubmitting && (
              <div className={`text-center ${isModal ? 'text-xs' : 'text-sm'} text-gray-500 dark:text-gray-400 ${isModal ? 'mt-2' : 'mt-3'} animate-pulse font-inter`}>
                Please wait, do not refresh or close this page...
              </div>
            )}
            
            <p className={`text-center text-xs text-gray-500 dark:text-gray-400 ${isModal ? 'mt-2' : 'mt-4'} font-inter`}>
              We&apos;ll respond within 24 hours • <a href="tel:+19014102020" className="text-brand hover:underline font-semibold">Call (901) 410-2020</a> for immediate assistance
            </p>
          </div>
        )}
      </form>
      {chatOverlay}
    </div>
  );
} 