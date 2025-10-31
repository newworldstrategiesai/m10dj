'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Plus,
  Briefcase,
  Users,
  FileText,
  Calendar,
  Mail,
  DollarSign,
  Link as LinkIcon,
  MessageSquare,
  FileSignature
} from 'lucide-react';

interface CreateOption {
  label: string;
  icon: React.ReactNode;
  href?: string;
  action?: () => void;
  description?: string;
}

export default function GlobalNewButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const createOptions: CreateOption[] = [
    {
      label: 'Project',
      icon: <Briefcase className="w-5 h-5" />,
      href: '/admin/projects/new',
      description: 'Create a new event or booking'
    },
    {
      label: 'Contact',
      icon: <Users className="w-5 h-5" />,
      href: '/admin/contacts?new=true',
      description: 'Add a new client or lead'
    },
    {
      label: 'Invoice',
      icon: <FileText className="w-5 h-5" />,
      href: '/admin/invoices/new',
      description: 'Generate a new invoice'
    },
    {
      label: 'Contract',
      icon: <FileSignature className="w-5 h-5" />,
      href: '/admin/contracts?new=true',
      description: 'Create a new contract'
    },
    {
      label: 'Event',
      icon: <Calendar className="w-5 h-5" />,
      href: '/admin/calendar?new=true',
      description: 'Schedule a new event'
    },
    {
      label: 'Email',
      icon: <Mail className="w-5 h-5" />,
      href: '/admin/email?compose=true',
      description: 'Send an email to clients'
    },
    {
      label: 'Payment Link',
      icon: <LinkIcon className="w-5 h-5" />,
      href: '/admin/invoices/payment-link',
      description: 'Generate a payment link'
    },
    {
      label: 'Message',
      icon: <MessageSquare className="w-5 h-5" />,
      href: '/admin/messages?new=true',
      description: 'Send SMS to a contact'
    }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close dropdown on route change
  useEffect(() => {
    setIsOpen(false);
  }, [router.pathname]);

  const handleOptionClick = (option: CreateOption) => {
    if (option.action) {
      option.action();
    } else if (option.href) {
      router.push(option.href);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* NEW Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-4 py-2 lg:px-5 lg:py-2.5
          bg-[#fcba00] hover:bg-[#e5a800] active:bg-[#d99800]
          text-black font-semibold rounded-lg
          transition-all duration-200
          shadow-sm hover:shadow-md
          text-sm lg:text-base
          ${isOpen ? 'ring-2 ring-[#fcba00] ring-offset-2' : ''}
        `}
      >
        <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
        <span className="hidden sm:inline">NEW</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="
            absolute right-0 mt-2 w-72 lg:w-80
            bg-white rounded-xl shadow-2xl border border-gray-200
            overflow-hidden z-50
            animate-in fade-in slide-in-from-top-2 duration-200
          "
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">Create New</h3>
            <p className="text-xs text-gray-600 mt-0.5">Choose what you'd like to create</p>
          </div>

          {/* Options List */}
          <div className="py-2 max-h-[70vh] overflow-y-auto">
            {createOptions.map((option, index) => (
              <button
                key={index}
                onClick={() => handleOptionClick(option)}
                className="
                  w-full flex items-start gap-3 px-4 py-3
                  hover:bg-gray-50 active:bg-gray-100
                  transition-colors duration-150
                  text-left group
                "
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-10 h-10 rounded-lg bg-gray-100 group-hover:bg-[#fcba00]/10 flex items-center justify-center transition-colors">
                    <span className="text-gray-700 group-hover:text-[#fcba00] transition-colors">
                      {option.icon}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm group-hover:text-[#fcba00] transition-colors">
                    {option.label}
                  </div>
                  {option.description && (
                    <div className="text-xs text-gray-600 mt-0.5 line-clamp-1">
                      {option.description}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Footer with Quick Tip */}
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500">
              💡 <span className="font-medium">Tip:</span> Use keyboard shortcuts to create faster
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

