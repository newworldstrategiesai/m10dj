import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, Send } from 'lucide-react';

export default function ContactForm({ className = '' }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventType: '',
    eventDate: '',
    guests: '',
    venue: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          eventType: formData.eventType,
          eventDate: formData.eventDate,
          location: formData.venue,
          message: `${formData.message}${formData.guests ? `\n\nNumber of guests: ${formData.guests}` : ''}`
        })
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setError(error.message || 'Failed to send message. Please try again or call us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={`bg-white rounded-2xl p-8 text-center ${className}`}>
        <div className="w-16 h-16 bg-brand text-white rounded-full flex items-center justify-center mx-auto mb-6">
          <Send className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-semibold text-gray-900 mb-4 font-playfair">Thank You!</h3>
        <p className="text-gray-600 mb-6 font-inter">
          We've received your message and will get back to you within 24 hours with a personalized quote for your event.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setError('');
            setFormData({
              name: '',
              email: '',
              phone: '',
              eventType: '',
              eventDate: '',
              guests: '',
              venue: '',
              message: ''
            });
          }}
          className="btn-secondary"
        >
          Send Another Message
        </button>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="mb-8">
        <h3 className="text-2xl font-semibold text-gray-900 mb-4 font-playfair">Get Your Free Quote</h3>
        <p className="text-gray-600 font-inter">
          Tell us about your event and we'll provide a customized quote within 24 hours.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm font-inter">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2 font-inter">
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
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2 font-inter">
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
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="phone" className="block text-sm font-semibold text-gray-900 mb-2 font-inter">
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
          </div>

          <div>
            <label htmlFor="eventType" className="block text-sm font-semibold text-gray-900 mb-2 font-inter">
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
            <label htmlFor="eventDate" className="block text-sm font-semibold text-gray-900 mb-2 font-inter">
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
          </div>

          <div>
            <label htmlFor="guests" className="block text-sm font-semibold text-gray-900 mb-2 font-inter">
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
          <label htmlFor="venue" className="block text-sm font-semibold text-gray-900 mb-2 font-inter">
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
          <label htmlFor="message" className="block text-sm font-semibold text-gray-900 mb-2 font-inter">
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
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Get My Free Quote</span>
            </>
          )}
        </button>
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
    </div>
  );
} 