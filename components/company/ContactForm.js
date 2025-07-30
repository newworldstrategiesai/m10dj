import { useState } from 'react';
import { Phone, Mail, MapPin, Send, CheckCircle, AlertCircle } from 'lucide-react';

export default function ContactForm({ className = '', showContactInfo = true }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventType: '',
    eventDate: '',
    location: '',
    message: ''
  });
  
  const [status, setStatus] = useState({
    submitting: false,
    submitted: false,
    error: null
  });

  const eventTypes = [
    'Wedding',
    'Corporate Event',
    'Birthday Party',
    'Anniversary',
    'School Dance',
    'Private Party',
    'Other'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ submitting: true, submitted: false, error: null });

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus({ submitting: false, submitted: true, error: null });
        setFormData({
          name: '',
          email: '',
          phone: '',
          eventType: '',
          eventDate: '',
          location: '',
          message: ''
        });
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      setStatus({ 
        submitting: false, 
        submitted: false, 
        error: 'Failed to send message. Please try again or call us directly.' 
      });
    }
  };

  if (status.submitted) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 ${className}`}>
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Thank You!
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            We've received your message and will get back to you within 24 hours.
          </p>
          <button
            onClick={() => setStatus({ submitting: false, submitted: false, error: null })}
            className="btn-primary"
          >
            Send Another Message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden ${className}`}>
      <div className="grid md:grid-cols-2 gap-0">
        {/* Contact Form */}
        <div className="p-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Get Your Free Quote
          </h3>
          
          {status.error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" />
              <p className="text-red-700 dark:text-red-300 text-sm">{status.error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-neon-cyan mb-1 font-orbitron uppercase tracking-wide">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="cyber-input"
                  placeholder="Your full name"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neon-cyan mb-1 font-orbitron uppercase tracking-wide">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="cyber-input"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-neon-purple mb-1 font-orbitron uppercase tracking-wide">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="cyber-input"
                  placeholder="(901) 555-0123"
                />
              </div>
              <div>
                <label htmlFor="eventType" className="block text-sm font-medium text-neon-purple mb-1 font-orbitron uppercase tracking-wide">
                  Event Type *
                </label>
                <select
                  id="eventType"
                  name="eventType"
                  required
                  value={formData.eventType}
                  onChange={handleInputChange}
                  className="cyber-select"
                >
                  <option value="">Select event type</option>
                  {eventTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="eventDate" className="block text-sm font-medium text-neon-pink mb-1 font-orbitron uppercase tracking-wide">
                  Event Date
                </label>
                <input
                  type="date"
                  id="eventDate"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleInputChange}
                  className="cyber-input"
                />
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-neon-pink mb-1 font-orbitron uppercase tracking-wide">
                  Event Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="cyber-input"
                  placeholder="Venue or area"
                />
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-neon-green mb-1 font-orbitron uppercase tracking-wide">
                Additional Details
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                value={formData.message}
                onChange={handleInputChange}
                className="cyber-textarea"
                placeholder="Tell us about your event, music preferences, special requests, etc."
              />
            </div>

            <button
              type="submit"
              disabled={status.submitting}
              className="w-full btn-primary flex items-center justify-center"
            >
              {status.submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Get Free Quote
                </>
              )}
            </button>
          </form>
        </div>

        {/* Contact Information */}
        {showContactInfo && (
          <div className="bg-gray-50 dark:bg-gray-900 p-8 flex flex-col justify-center">
            <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Get In Touch
            </h4>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <Phone className="w-5 h-5 text-brand-gold mr-3" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">(901) 410-2020</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Call or text anytime</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-brand-gold mr-3" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">m10djcompany@gmail.com</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">We respond within 24 hours</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <MapPin className="w-5 h-5 text-brand-gold mr-3" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Memphis, TN & Surrounding Areas</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Serving all of Greater Memphis</p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Follow us on social media:
              </p>
              <div className="flex space-x-4">
                <a 
                  href="https://facebook.com/m10djcompany" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-brand-gold hover:text-brand-gold-dark transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a 
                  href="https://instagram.com/m10djcompany" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-brand-gold hover:text-brand-gold-dark transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.618 5.367 11.986 11.988 11.986s11.987-5.368 11.987-11.986C24.014 5.367 18.635.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.321-1.297C4.255 14.794 3.8 13.597 3.8 12.3c0-1.297.455-2.494 1.328-3.362.873-.807 2.024-1.297 3.321-1.297 1.297 0 2.448.49 3.321 1.297.873.868 1.328 2.065 1.328 3.362 0 1.297-.455 2.494-1.328 3.391-.873.807-2.024 1.297-3.321 1.297zm7.718-9.47h-1.297V5.823h1.297v1.695zm-3.321 5.823c0-.868-.326-1.695-.913-2.3-.588-.588-1.415-.913-2.3-.913-.868 0-1.695.325-2.3.913-.588.605-.913 1.432-.913 2.3 0 .868.325 1.695.913 2.3.605.588 1.432.913 2.3.913.885 0 1.712-.325 2.3-.913.587-.605.913-1.432.913-2.3z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 