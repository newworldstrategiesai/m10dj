'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface FontOption {
  value: string;
  label: string;
}

export interface FontSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: FontOption[];
  id?: string;
  className?: string;
  placeholder?: string;
}

export const FontSelect: React.FC<FontSelectProps> = ({
  value,
  onChange,
  options,
  id,
  className,
  placeholder = 'Select a font...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Find the selected option
  const selectedOption = options.find(opt => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        const currentIndex = options.findIndex(opt => opt.value === value);
        const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
        onChange(options[nextIndex].value);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        const currentIndex = options.findIndex(opt => opt.value === value);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
        onChange(options[prevIndex].value);
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, value, options, onChange]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <button
        ref={buttonRef}
        type="button"
        id={id}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg',
          'bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm',
          'flex items-center justify-between',
          'focus:outline-none focus:ring-2 focus:ring-[#fcba00] focus:border-transparent',
          'hover:bg-gray-50 dark:hover:bg-gray-600',
          'transition-colors'
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span
          className="truncate"
          style={{
            fontFamily: selectedOption?.value || 'inherit',
          }}
        >
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          className={cn(
            'ml-2 h-4 w-4 text-gray-400 flex-shrink-0 transition-transform',
            isOpen && 'transform rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown menu */}
          <div
            className={cn(
              'absolute z-50 w-full mt-1 rounded-lg border border-gray-200 dark:border-gray-700',
              'bg-white dark:bg-gray-800 shadow-lg',
              'max-h-64 overflow-y-auto',
              'animate-in fade-in-0 zoom-in-95'
            )}
            role="listbox"
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm',
                    'flex items-center justify-between',
                    'hover:bg-gray-100 dark:hover:bg-gray-700',
                    'focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700',
                    'transition-colors',
                    'first:rounded-t-lg last:rounded-b-lg',
                    isSelected && 'bg-[#fcba00]/10 dark:bg-[#fcba00]/20'
                  )}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span
                    style={{
                      fontFamily: option.value,
                    }}
                    className="truncate flex-1"
                  >
                    {option.label}
                  </span>
                  {isSelected && (
                    <Check className="ml-2 h-4 w-4 text-[#fcba00] flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default FontSelect;
