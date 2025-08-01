"use client";

import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import Button from '@/components/ui/Button';
import { IconArrowLeft, IconChevronLeft, IconDotsVertical, IconPhone, IconVideo } from '@tabler/icons-react';
import { cn } from '@/utils/cn';

interface ChatHeaderProps {
  user: {
    id: string;
    profile: string;
    username: string;
    fullName: string;
    title: string;
    phone?: string;
    isSMS?: boolean;
    isAI?: boolean;
    destinationNumber?: string;
  };
  onBackClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  onDetailsClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  showBackButton?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  user,
  onBackClick,
  onDetailsClick,
  showBackButton = false
}) => {
  if (!user) return null;
  
  // Format phone numbers for display
  const formatPhoneNumber = (phone?: string) => {
    if (!phone) return '';
    // Basic formatting for US numbers
    if (phone.length === 10) {
      return `(${phone.substring(0, 3)}) ${phone.substring(3, 6)}-${phone.substring(6)}`;
    }
    // For international numbers with country code
    if (phone.length > 10 && phone.startsWith('+')) {
      const countryCode = phone.substring(0, phone.length - 10);
      const number = phone.substring(phone.length - 10);
      return `${countryCode} (${number.substring(0, 3)}) ${number.substring(3, 6)}-${number.substring(6)}`;
    }
    return phone;
  };

  // Format the contact name if needed
  const formatContactName = (name: string, phone?: string) => {
    if (name.trim() === '' && phone) {
      return formatPhoneNumber(phone);
    }
    return name;
  };
  
  const formattedUserName = formatContactName(user.fullName, user.phone);
  
  return (
    <div className="border-b border-[#c6c6c8] dark:border-[#38383a] px-4 py-2 flex items-center h-[60px] shrink-0 bg-[#f6f6f6] dark:bg-[#1c1c1e]">
      {showBackButton && (
        <Button 
          variant="flat" 
           
          className="mr-2 rounded-full py-0 px-0 h-auto bg-transparent hover:bg-transparent"
          onClick={onBackClick}
        >
          <div className="flex items-center text-[#0884fe]">
            <IconChevronLeft className="h-5 w-5" />
            <span className="text-[16px]">Messages</span>
          </div>
        </Button>
      )}
      
      <div className="flex items-center justify-center flex-1">
        <div className="flex flex-col items-center">
          <Avatar className="h-9 w-9 mb-1 rounded-full">
            <AvatarImage src={user.profile} alt={formattedUserName} />
            <AvatarFallback className={cn(
              'isSMS' in user ? "bg-green-100 dark:bg-green-900" : 
              'isAI' in user ? "bg-blue-100 dark:bg-blue-900" : 
              "bg-gray-100 dark:bg-gray-800"
            )}>
              {formattedUserName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <h2 className="text-[17px] font-semibold">{formattedUserName}</h2>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <Button 
          variant="flat" 
           
          className="rounded-full p-0 h-auto w-auto bg-transparent hover:bg-transparent"
        >
          <IconPhone className="h-5 w-5 text-[#0884fe]" />
          <span className="sr-only">Call</span>
        </Button>
        
        <Button 
          variant="flat" 
           
          className="rounded-full p-0 h-auto w-auto bg-transparent hover:bg-transparent"
        >
          <IconVideo className="h-5 w-5 text-[#0884fe]" />
          <span className="sr-only">Video</span>
        </Button>
        
        <Button 
          variant="flat" 
           
          className="rounded-full p-0 h-auto w-auto bg-transparent hover:bg-transparent"
          onClick={onDetailsClick}
        >
          <IconDotsVertical className="h-5 w-5 text-[#0884fe]" />
          <span className="sr-only">Info</span>
        </Button>
      </div>
    </div>
  );
};
