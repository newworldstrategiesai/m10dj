'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Phone, User } from 'lucide-react';
import { cn } from '@/utils/cn';
import dayjs from 'dayjs';

interface SMSThreadItemProps {
  thread: {
    id: string;
    profile: string;
    username: string;
    fullName: string;
    title: string;
    messages: Array<{
      sender: string;
      message: string;
      timestamp: string;
    }>;
    phone?: string;
    isSMS?: boolean;
    destinationNumber?: string;
  };
  isSelected: boolean;
  hasUnread?: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function SMSThreadItem({ thread, isSelected, hasUnread = false, onClick }: SMSThreadItemProps) {
  // Format the contact name to ensure it's not just a phone number
  const formatContactName = (name: string, phone?: string) => {
    if (!name || name.trim() === '') {
      return phone ? `Contact (${phone})` : 'Unknown Contact';
    }
    if (phone && name === phone) {
      return `Contact (${phone})`;
    }
    return name.trim();
  };

  const displayName = formatContactName(thread.fullName, thread.phone);
  const isSMS = thread.isSMS || false;
  
  return (
    <button
      className={cn(
        'flex w-full items-start space-x-3 rounded-lg px-3 py-2 transition-colors hover:bg-accent/50 text-left relative',
        isSelected ? 'bg-accent' : 'hover:bg-accent/50'
      )}
      onClick={onClick}
    >
      <div className="relative">
        <Avatar className="h-10 w-10 border border-white/20 dark:border-gray-700/30">
          <AvatarImage src={thread.profile} alt={displayName} />
          <AvatarFallback className={cn(
            'text-foreground',
            isSMS ? "bg-green-100 dark:bg-green-900" : "bg-gray-100 dark:bg-gray-800"
          )}>
            {isSMS ? <Phone size={18} /> : <User size={18} />}
          </AvatarFallback>
        </Avatar>
        {hasUnread && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-blue-500 ring-2 ring-white dark:ring-gray-900" />
        )}
      </div>
      <div className="flex-1 overflow-hidden max-w-[calc(100%-60px)]">
        <div className="flex items-center justify-between w-full">
          <p className={cn(
            "text-sm leading-none truncate max-w-[70%]",
            hasUnread ? "font-semibold" : "font-medium",
            hasUnread ? "text-foreground" : "text-muted-foreground"
          )}>
            {displayName}
          </p>
          {thread.messages.length > 0 && (
            <span className={cn(
              "text-xs ml-2 flex-shrink-0", 
              hasUnread ? "text-foreground font-medium" : "text-muted-foreground"
            )}>
              {dayjs(thread.messages[thread.messages.length - 1].timestamp).format('h:mm A')}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between w-full mt-1">
          <p className={cn(
            "text-xs truncate text-left max-w-[70%]",
            hasUnread ? "text-foreground" : "text-muted-foreground"
          )}>
            {thread.messages.length > 0
              ? thread.messages[thread.messages.length - 1].message
              : thread.title}
          </p>
          {isSMS && thread.destinationNumber && (
            <Badge variant="outline" className="ml-2 text-xs dark:border-gray-700 dark:text-gray-300 flex-shrink-0">
              {thread.destinationNumber}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
} 