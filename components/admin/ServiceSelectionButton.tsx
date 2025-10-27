/**
 * Service Selection Button Component
 * 
 * Add this to your admin contacts page to easily generate service selection links
 * 
 * Usage:
 * <ServiceSelectionButton contactId={contact.id} contactName={contact.name} contactEmail={contact.email} />
 */

import React, { useState } from 'react';
import { Link as LinkIcon, Copy, Check, Loader2, Mail } from 'lucide-react';

interface ServiceSelectionButtonProps {
  contactId: string;
  contactName: string;
  contactEmail: string;
}

export default function ServiceSelectionButton({ 
  contactId, 
  contactName, 
  contactEmail 
}: ServiceSelectionButtonProps) {
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateLink = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate-service-selection-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contactId }),
      });

      const data = await response.json();

      if (data.success) {
        setLink(data.link);
      } else {
        alert('Error generating link: ' + data.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to generate link');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (link) {
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sendEmail = () => {
    if (link) {
      const subject = encodeURIComponent('Select Your Wedding DJ Services - M10 DJ Company');
      const body = encodeURIComponent(
        `Hi ${contactName.split(' ')[0]},\n\n` +
        `Thank you for your interest in M10 DJ Company for your special day!\n\n` +
        `I've created a personalized service selection page where you can choose your perfect package and add-ons. This will help me prepare an accurate proposal tailored to your needs.\n\n` +
        `Click here to select your services:\n${link}\n\n` +
        `Once you submit your selections, I'll prepare a detailed proposal and follow up within 24 hours.\n\n` +
        `If you have any questions, feel free to call me at (901) 410-2020.\n\n` +
        `Looking forward to making your celebration unforgettable!\n\n` +
        `Best regards,\nBen Murray\nM10 DJ Company\n(901) 410-2020\nwww.m10djcompany.com`
      );
      
      window.open(`mailto:${contactEmail}?subject=${subject}&body=${body}`, '_blank');
    }
  };

  if (!link) {
    return (
      <button
        onClick={generateLink}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <LinkIcon className="w-4 h-4 mr-2" />
            Generate Service Selection Link
          </>
        )}
      </button>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center text-green-700">
          <Check className="w-5 h-5 mr-2" />
          <span className="font-semibold">Link Generated!</span>
        </div>
      </div>
      
      <div className="bg-white rounded border border-gray-300 p-3 mb-3 break-all text-sm text-gray-700 font-mono">
        {link}
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={copyToClipboard}
          className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </>
          )}
        </button>
        
        <button
          onClick={sendEmail}
          className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-brand text-white rounded hover:bg-brand/90 transition-colors"
        >
          <Mail className="w-4 h-4 mr-2" />
          Send Email
        </button>
      </div>
      
      <p className="text-xs text-gray-500 mt-3">
        This link is unique to {contactName} and will save their selections to their contact record.
      </p>
    </div>
  );
}

