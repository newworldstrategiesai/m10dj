import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Mail, MapPin, Clock, AlertCircle, Send, Phone } from 'lucide-react';
import { FormErrorLogger } from '../../utils/form-error-logger';
import { FormStateManager } from '../../utils/form-state-manager';
import { ClientIdempotencyTracker } from '../../utils/idempotency';
import { validateContactForm } from '../../utils/form-validator';
import ContactFormChat from './ContactFormChat';
// Temporarily disabled to prevent rate limiting issues
// import { trackLead, trackContactAction } from '../EnhancedTracking';

export default function ContactForm({ className = '' }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventType: '',
    eventDate: '',
    guests: '',
    venue: '',
    message: '',
    honeypot: '' // Hidden field for bot detection
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [submissionId, setSubmissionId] = useState(null);
  const [error, setError] = useState('');
  const [fieldWarnings, setFieldWarnings] = useState({});
  const [showRestoredNotice, setShowRestoredNotice] = useState(false);
  
  // Initialize utilities
  const errorLogger = useRef(null);
  const stateManager = useRef(null);
  const idempotencyTracker = useRef(null);
  const idempotencyKey = useRef(null);
  
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
  };

  // Validate form data before submission using enhanced validator
  const validateForm = () => {
    const validation = validateContactForm({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      eventType: formData.eventType,
      eventDate: formData.eventDate,
      location: formData.venue,
      message: formData.message
    });
    
    // Set warnings for display
    if (validation.hasWarnings) {
      setFieldWarnings(validation.warnings);
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
          body: JSON.stringify(data),
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
      const submissionData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        eventType: formData.eventType,
        eventDate: formData.eventDate || null,
        location: formData.venue.trim() || null,
        message: `${formData.message}${formData.guests ? `\n\nNumber of guests: ${formData.guests}` : ''}`.trim(),
        honeypot: formData.honeypot, // Include honeypot field
        idempotencyKey: idempotencyKey.current // Include idempotency key
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
          timestamp: new Date().toISOString(),
          idempotencyKey: idempotencyKey.current
        });
        
        // Store submission ID for personalized pages
        setSubmissionId(result.data?.submissionId || result.data?.contactId);
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
        className="fixed inset-0 z-[99999] bg-white dark:bg-gray-900"
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

  return (
    <div className={`${className}`}>
      <div className="mb-8">
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4 font-sans">Get Your Free Quote</h3>
        <p className="text-gray-600 dark:text-gray-400 font-inter">
          Tell us about your event and we'll provide a customized quote within 24 hours.
        </p>
      </div>

      {showRestoredNotice && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-blue-800 dark:text-blue-300 text-sm font-inter font-semibold">
              Your previous form data was restored
            </p>
            <p className="text-blue-700 dark:text-blue-400 text-xs font-inter mt-1">
              We saved your progress automatically. Feel free to continue or start fresh.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-400 text-sm font-inter">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 font-inter">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              className="modern-input"
              placeholder="Your full name"
            />
            {fieldWarnings.name && (
              <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-500 flex items-start">
                <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                {fieldWarnings.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 font-inter">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="modern-input"
              placeholder="your.email@example.com"
            />
            {fieldWarnings.email && (
              <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-500 flex items-start">
                <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                {fieldWarnings.email}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 font-inter">
              Phone Number *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              required
              value={formData.phone}
              onChange={handleInputChange}
              className="modern-input"
              placeholder="(901) 410-2020"
            />
            {fieldWarnings.phone && (
              <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-500 flex items-start">
                <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                {fieldWarnings.phone}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="eventType" className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 font-inter">
              Event Type *
            </label>
            <select
              id="eventType"
              name="eventType"
              required
              value={formData.eventType}
              onChange={handleInputChange}
              className="modern-select"
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
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="eventDate" className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 font-inter">
              Event Date
            </label>
            <input
              type="date"
              id="eventDate"
              name="eventDate"
              value={formData.eventDate}
              onChange={handleInputChange}
              className="modern-input"
            />
            {fieldWarnings.eventDate && (
              <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-500 flex items-start">
                <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
                {fieldWarnings.eventDate}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="guests" className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 font-inter">
              Number of Guests
            </label>
            <select
              id="guests"
              name="guests"
              value={formData.guests}
              onChange={handleInputChange}
              className="modern-select"
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

        <div>
          <label htmlFor="venue" className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 font-inter">
            Venue/Location
          </label>
          <input
            type="text"
            id="venue"
            name="venue"
            value={formData.venue}
            onChange={handleInputChange}
            className="modern-input"
            placeholder="Event venue or location"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 font-inter">
            Additional Details
          </label>
          <textarea
            id="message"
            name="message"
            rows="4"
            value={formData.message}
            onChange={handleInputChange}
            className="modern-textarea"
            placeholder="Tell us more about your event, special requests, or any questions you have..."
          />
          {fieldWarnings.message && (
            <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-500 flex items-start">
              <AlertCircle className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" />
              {fieldWarnings.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          aria-busy={isSubmitting}
          aria-live="polite"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Submitting Your Request...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Get My Free Quote</span>
            </>
          )}
        </button>
        
        {isSubmitting && (
          <div className="text-center text-sm text-gray-600 mt-2 animate-pulse">
            Please wait, do not refresh or close this page...
          </div>
        )}
      </form>

      <div className="mt-8 pt-8 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-brand/10 text-brand rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 font-inter">Call us directly</p>
              <a href="tel:+19014102020" className="text-brand hover:text-brand-600 transition-colors font-inter">
(901) 410-2020
              </a>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-brand/10 text-brand rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 font-inter">Response time</p>
              <p className="text-gray-600 font-inter">Within 24 hours</p>
            </div>
          </div>
        </div>
      </div>
      {chatOverlay}
    </div>
  );
} 