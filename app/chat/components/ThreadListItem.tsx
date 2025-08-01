import { cn } from '@/utils/cn';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format, isToday, isYesterday } from 'date-fns';

interface ThreadListItemProps {
  thread: {
    id: string;
    first_name?: string;
    last_name?: string;
    phone: string;
    messages?: Array<{
      content: string;
      timestamp: string;
      direction: 'inbound' | 'outbound';
    }>;
    unreadCount?: number;
  };
  isSelected?: boolean;
  onClick?: () => void;
}

export function ThreadListItem({ thread, isSelected, onClick }: ThreadListItemProps) {
  const lastMessage = thread.messages?.[thread.messages.length - 1];
  
  // Enhanced name display logic
  const getDisplayName = () => {
    const firstName = thread.first_name?.trim();
    const lastName = thread.last_name?.trim();
    
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    }
    
    // Fallback to phone number
    return thread.phone;
  };
  
  const displayName = getDisplayName();
  const isPhoneNumber = displayName === thread.phone;

  // Format date to show as Today, Yesterday, or date
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return 'Today';
    }
    if (isYesterday(date)) {
      return 'Yesterday';
    }
    return format(date, 'MMM d');
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative w-full p-3 rounded-lg transition-all duration-200',
        'flex items-center gap-3 text-left',
        'border border-transparent',
        isSelected
          ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-200 dark:border-blue-700/60 shadow-sm dark:shadow-[0_0_12px_rgba(59,130,246,0.2)]'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:border-gray-200 dark:hover:border-blue-800/40'
      )}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full" />
      )}
      
      <Avatar className={cn(
        "h-10 w-10 flex-shrink-0",
        isSelected && "ring-2 ring-blue-500/30 dark:ring-blue-400/30"
      )}>
        <AvatarFallback className={cn(
          "dark:bg-gray-800 dark:text-white",
          isSelected && "bg-blue-100 dark:bg-blue-800/50 text-blue-700 dark:text-blue-200"
        )}>
          {displayName[0]?.toUpperCase() || 'C'}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0 max-w-[calc(100%-80px)] px-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "font-medium truncate",
              "dark:text-white",
              isSelected && "text-blue-700 dark:text-blue-300 font-semibold"
            )}>
              {displayName}
            </h3>
            {/* Show phone number below name if we're showing a contact name */}
            {!isPhoneNumber && (
              <p className={cn(
                "text-xs text-gray-500 dark:text-gray-400 truncate",
                isSelected && "text-blue-600 dark:text-blue-400"
              )}>
                {thread.phone}
              </p>
            )}
          </div>
          {lastMessage && (
            <div className="text-xs text-muted-foreground dark:text-gray-400 whitespace-nowrap flex-shrink-0 flex flex-col items-end">
              <span className={cn(
                isSelected && "text-blue-600 dark:text-blue-300 font-medium"
              )}>
                {formatDate(lastMessage.timestamp)}
              </span>
              <span className={cn(
                "dark:text-gray-500",
                isSelected && "text-blue-500 dark:text-blue-400"
              )}>
                {format(new Date(lastMessage.timestamp), 'h:mm a')}
              </span>
            </div>
          )}
        </div>
        {lastMessage && (
          <p className={cn(
            "text-sm text-muted-foreground dark:text-gray-400 truncate mt-1",
            isSelected && "text-blue-600 dark:text-blue-300"
          )}>
            {lastMessage.content}
          </p>
        )}
      </div>
      
      {thread.unreadCount ? (
        <div className={cn(
          "flex-shrink-0 h-5 w-5 rounded-full text-xs flex items-center justify-center font-semibold",
          isSelected 
            ? "bg-blue-600 dark:bg-blue-500 text-white shadow-sm"
            : "bg-primary dark:bg-blue-600 text-primary-foreground dark:shadow-[0_0_12px_rgba(59,130,246,0.4)]"
        )}>
          {thread.unreadCount}
        </div>
      ) : null}
    </button>
  );
} 