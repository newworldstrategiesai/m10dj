import React from 'react';
import { format } from 'date-fns';
import {
  MessageSquare,
  ArrowDown,
  ArrowUp,
  Copy,
  CheckCircle2,
  Phone,
  X,
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import Button from "@/components/ui/Button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/Toasts/use-toast";

interface MessageDetailsProps {
  message: {
    id?: string;
    from: string;
    to: string;
    body: string;
    dateSent: string;
    status?: string;
    direction?: 'inbound' | 'outbound';
  };
  twilioNumbers: string[];
  onClose: () => void;
}

export function MessageDetailsModal({ message, twilioNumbers, onClose }: MessageDetailsProps) {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Text copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy text",
        variant: "destructive",
      });
    }
  };

  const getDirectionBadge = () => {
    // If direction is explicitly provided, use it
    if (message.direction) {
      return message.direction === 'inbound' ? (
        <Badge variant="secondary" className="gap-1">
          <ArrowDown className="h-3 w-3" />
          Inbound
        </Badge>
      ) : (
        <Badge variant="secondary" className="gap-1">
          <ArrowUp className="h-3 w-3" />
          Outbound
        </Badge>
      );
    }

    // Otherwise, determine direction based on the from/to numbers
    // Check if the from number is one of our Twilio numbers
    const isFromTwilio = twilioNumbers.some(num => 
      num && message.from.includes(num)
    );
    
    return isFromTwilio ? (
      <Badge variant="secondary" className="gap-1">
        <ArrowUp className="h-3 w-3" />
        Outbound
      </Badge>
    ) : (
      <Badge variant="secondary" className="gap-1">
        <ArrowDown className="h-3 w-3" />
        Inbound
      </Badge>
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Message Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-1">Date & Time</h4>
              <p className="text-sm text-muted-foreground">
                {format(new Date(message.dateSent), 'PPpp')}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Direction</h4>
              <div>{getDirectionBadge()}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <h4 className="font-medium mb-1">From</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{message.from}</span>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-1">To</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{message.to}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-medium">Message</h4>
              <Button
                variant="flat"
                className="h-8"
                onClick={() => handleCopyText(message.body)}
              >
                {copied ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <ScrollArea className="h-[200px] rounded-md border p-4">
              <div className="text-sm whitespace-pre-wrap text-muted-foreground">
                {message.body}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 