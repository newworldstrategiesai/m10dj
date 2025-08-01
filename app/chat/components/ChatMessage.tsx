import { cn } from '@/utils/cn';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Button from '@/components/ui/Button';
import { IconCheck, IconChecks } from '@tabler/icons-react';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';

interface ChatMessageProps {
  message: {
    id: string;
    content: string;
    direction: 'inbound' | 'outbound';
    timestamp: string;
    status?: string;
    sender?: string;
    isAI?: boolean;
  };
  onMessageClick?: () => void;
}

export function ChatMessage({ message, onMessageClick }: ChatMessageProps) {
  const isOutbound = message.direction === 'outbound';
  const isDelivered = message.status === 'delivered';
  const isRead = message.status === 'read';
  const isAI = message.isAI;
  const [isMobile, setIsMobile] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check if we're on mobile and in dark mode
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    // Set initial state
    checkMobile();
    checkDarkMode();
    
    // Add event listeners
    window.addEventListener('resize', checkMobile);
    
    // Check for dark mode changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkDarkMode();
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkMobile);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      className={cn(
        'flex items-start gap-2',
        // Adjust max-width based on screen size and message direction
        isMobile
          ? isOutbound 
            ? 'max-w-[70%]' // Outbound messages on mobile (wider)
            : 'max-w-[75%]' // Inbound messages on mobile (wider)
          : isOutbound 
            ? 'max-w-[80%]' // Outbound messages on desktop
            : 'max-w-[80%]', // Inbound messages on desktop
        isOutbound ? 'ml-auto' : 'mr-auto'
      )}
      onClick={onMessageClick}
    >
      {!isOutbound && (
        <Avatar className="h-8 w-8 flex-shrink-0 border dark:border-blue-900/50 dark:shadow-[0_0_5px_rgba(59,130,246,0.2)]">
          <AvatarFallback className={cn(
            isAI ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-white',
            'dark:shadow-inner'
          )}>
            {isAI ? 'AI' : message.sender?.[0]?.toUpperCase() || 'C'}
          </AvatarFallback>
        </Avatar>
      )}
      <div className="flex flex-col gap-1 w-full">
        <div
          className={cn(
            'rounded-2xl px-4 py-2 text-sm break-words inline-block max-w-full transition-shadow duration-200',
            isOutbound
              ? 'bg-primary text-primary-foreground rounded-tr-none dark:bg-gradient-to-br dark:from-blue-600 dark:to-blue-800 dark:shadow-[0_0_8px_rgba(59,130,246,0.3)]'
              : 'bg-blue-500 text-white dark:bg-gray-800 rounded-tl-none dark:shadow-[0_0_8px_rgba(59,130,246,0.15)]'
          )}
          style={{ 
            wordBreak: 'break-word', 
            overflowWrap: 'break-word', 
            hyphens: 'auto',
            whiteSpace: 'pre-wrap',
            maxWidth: '100%'
          }}
        >
          {message.content}
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground dark:text-gray-300">
          {isAI && !isOutbound && (
            <span className="text-xs font-medium text-blue-500 dark:text-blue-400">AI Assistant</span>
          )}
          <span className="dark:opacity-80">{format(new Date(message.timestamp), 'h:mm a')}</span>
          {isOutbound && (
            <span className="ml-1">
              {isRead ? (
                <IconChecks className="h-3 w-3 text-primary dark:text-blue-400" />
              ) : isDelivered ? (
                <IconChecks className="h-3 w-3 dark:text-gray-300" />
              ) : (
                <IconCheck className="h-3 w-3 dark:text-gray-300" />
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
} 