import React from 'react';
import { cn } from '@/utils/cn';

interface TypingIndicatorProps {
  className?: string;
  showLabel?: boolean;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  className,
  showLabel = true
}) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1">
        <div className="h-2 w-2 rounded-full bg-muted-foreground/70 animate-bounce [animation-delay:-0.3s]"></div>
        <div className="h-2 w-2 rounded-full bg-muted-foreground/70 animate-bounce [animation-delay:-0.15s]"></div>
        <div className="h-2 w-2 rounded-full bg-muted-foreground/70 animate-bounce"></div>
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground">typing...</span>
      )}
    </div>
  );
};

export default TypingIndicator;
