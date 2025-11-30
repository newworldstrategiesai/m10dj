import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import ContactForm from './ContactForm';

export default function ContactFormModal({ isOpen, onClose }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      console.log('ContactFormModal: Opening modal');
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] bg-white dark:bg-gray-900"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        width: '100vw', 
        height: '100vh',
        overflow: 'hidden'
      }}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-3 right-3 z-20 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
        aria-label="Close modal"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Contact Form Container - No scrolling, fits viewport */}
      <div 
        className="h-full w-full flex flex-col"
        style={{ 
          height: '100vh',
          maxHeight: '100vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Compact Header */}
        <div className="flex-shrink-0 px-4 pt-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Get Your Free Quote
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            We&apos;ll respond within 24 hours
          </p>
        </div>

        {/* Form Container - Single form spanning both sections */}
        <div className="flex-1 min-h-0 flex flex-col">
          <ContactForm className="modal-form" modalLayout={true} />
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

