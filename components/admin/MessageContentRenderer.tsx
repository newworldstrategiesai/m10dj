/**
 * Message Content Renderer
 * 
 * Renders assistant messages with support for text, buttons, and cards
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IconExternalLink, IconChevronRight, IconCopy, IconCheck } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/utils/cn';
import dayjs from 'dayjs';
import { useToast } from '@/components/ui/Toasts/use-toast';

interface ActionButton {
  label: string;
  action: 'link' | 'function' | 'copy';
  value: string;
  variant?: 'default' | 'outline' | 'secondary';
}

interface CardData {
  title: string;
  description?: string;
  fields?: Array<{ label: string; value: string }>;
  actions?: ActionButton[];
  link?: string;
}

interface StructuredContent {
  text?: string;
  buttons?: ActionButton[];
  cards?: CardData[];
}

interface MessageContentRendererProps {
  content: string | StructuredContent;
  timestamp?: string;
  functionsCalled?: Array<{ name: string; arguments: any }>;
}

export function MessageContentRenderer({ 
  content, 
  timestamp,
  functionsCalled 
}: MessageContentRendererProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  
  // Parse content - can be string or structured object
  let messageContent: StructuredContent;
  
  if (typeof content === 'string') {
    // Try to parse JSON from the string (if assistant returns structured data)
    try {
      const parsed = JSON.parse(content);
      if (parsed.text || parsed.buttons || parsed.cards) {
        messageContent = parsed;
      } else {
        messageContent = { text: content };
      }
    } catch {
      // Not JSON, treat as plain text
      messageContent = { text: content };
    }
  } else {
    messageContent = content;
  }

  const handleAction = async (button: ActionButton) => {
    switch (button.action) {
      case 'link':
        if (button.value.startsWith('http')) {
          window.open(button.value, '_blank');
        } else {
          router.push(button.value);
        }
        break;
      case 'copy':
        await navigator.clipboard.writeText(button.value);
        setCopied(button.value);
        toast({
          title: "Copied!",
          description: "Value copied to clipboard",
        });
        setTimeout(() => setCopied(null), 2000);
        break;
      case 'function':
        // Could trigger a function call
        console.log('Function action:', button.value);
        break;
    }
  };

  return (
    <div className={cn(
      "max-w-[80%] rounded-lg p-3",
      "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
    )}>
      <div className="space-y-3">
        {/* Text Content */}
        {messageContent.text && (
          <div className="whitespace-pre-wrap text-sm">{messageContent.text}</div>
        )}

        {/* Cards */}
        {messageContent.cards && messageContent.cards.length > 0 && (
          <div className="space-y-3">
            {messageContent.cards.map((card, idx) => (
              <Card key={idx} className="border-gray-200 dark:border-gray-700 shadow-sm">
                {card.link ? (
                  <Link href={card.link}>
                    <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold">{card.title}</CardTitle>
                        <IconChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                      {card.description && (
                        <CardDescription className="text-xs mt-1">{card.description}</CardDescription>
                      )}
                    </CardHeader>
                    {card.fields && (
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {card.fields.map((field, fieldIdx) => (
                            <div key={fieldIdx} className="flex justify-between text-xs">
                              <span className="text-gray-500 dark:text-gray-400">{field.label}:</span>
                              <span className="font-medium text-gray-900 dark:text-white">{field.value}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Link>
                ) : (
                  <>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-semibold">{card.title}</CardTitle>
                      {card.description && (
                        <CardDescription className="text-xs mt-1">{card.description}</CardDescription>
                      )}
                    </CardHeader>
                    {card.fields && (
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {card.fields.map((field, fieldIdx) => (
                            <div key={fieldIdx} className="flex justify-between text-xs">
                              <span className="text-gray-500 dark:text-gray-400">{field.label}:</span>
                              <span className="font-medium text-gray-900 dark:text-white">{field.value}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </>
                )}
                
                {/* Card Actions */}
                {card.actions && card.actions.length > 0 && (
                  <CardContent className="pt-2 pb-3">
                    <div className="flex flex-wrap gap-2">
                      {card.actions.map((action, actionIdx) => (
                        <Button
                          key={actionIdx}
                          variant={action.variant || 'outline'}
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleAction(action);
                          }}
                          className="text-xs h-7"
                        >
                          {action.action === 'copy' && (copied === action.value ? (
                            <IconCheck className="h-3 w-3 mr-1" />
                          ) : (
                            <IconCopy className="h-3 w-3 mr-1" />
                          ))}
                          {action.label}
                          {action.action === 'link' && (
                            <IconExternalLink className="h-3 w-3 ml-1" />
                          )}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        {messageContent.buttons && messageContent.buttons.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {messageContent.buttons.map((button, idx) => (
              <Button
                key={idx}
                variant={button.variant || 'outline'}
                size="sm"
                onClick={() => handleAction(button)}
                className="text-xs h-7"
              >
                {button.action === 'copy' && (copied === button.value ? (
                  <IconCheck className="h-3 w-3 mr-1" />
                ) : (
                  <IconCopy className="h-3 w-3 mr-1" />
                ))}
                {button.label}
                {button.action === 'link' && (
                  <IconExternalLink className="h-3 w-3 ml-1" />
                )}
              </Button>
            ))}
          </div>
        )}

        {/* Function Calls */}
        {functionsCalled && functionsCalled.length > 0 && (
          <div className="pt-2 border-t border-gray-300 dark:border-gray-600">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Functions used:
            </div>
            <div className="flex flex-wrap gap-1">
              {functionsCalled.map((fn, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {fn.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        {timestamp && (
          <div className="text-xs opacity-70 pt-1">
            {dayjs(timestamp).format('h:mm A')}
          </div>
        )}
      </div>
    </div>
  );
}

