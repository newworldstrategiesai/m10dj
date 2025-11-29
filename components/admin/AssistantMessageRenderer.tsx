/**
 * Assistant Message Renderer
 * 
 * Renders different types of assistant messages including text, buttons, and cards
 */

'use client';

import { IconRobot, IconExternalLink, IconChevronRight } from '@tabler/icons-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/utils/cn';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

interface MessageContent {
  text?: string;
  buttons?: ActionButton[];
  cards?: CardData[];
  functionCalls?: Array<{ name: string; arguments: any }>;
}

interface AssistantMessageRendererProps {
  content: string | MessageContent;
  timestamp: string;
  functionsCalled?: Array<{ name: string; arguments: any }>;
}

export function AssistantMessageRenderer({ 
  content, 
  timestamp,
  functionsCalled 
}: AssistantMessageRendererProps) {
  const router = useRouter();
  
  // Parse content - can be string or structured object
  let messageContent: MessageContent;
  
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

  const handleAction = (button: ActionButton) => {
    switch (button.action) {
      case 'link':
        if (button.value.startsWith('http')) {
          window.open(button.value, '_blank');
        } else {
          router.push(button.value);
        }
        break;
      case 'copy':
        navigator.clipboard.writeText(button.value);
        break;
      case 'function':
        // Could trigger a function call - for now just show a message
        console.log('Function action:', button.value);
        break;
    }
  };

  return (
    <div className="space-y-3">
      {/* Text Content */}
      {messageContent.text && (
        <div className="whitespace-pre-wrap text-sm">{messageContent.text}</div>
      )}

      {/* Cards */}
      {messageContent.cards && messageContent.cards.length > 0 && (
        <div className="space-y-3">
          {messageContent.cards.map((card, idx) => (
            <Card key={idx} className="border-gray-200 dark:border-gray-700">
              {card.link ? (
                <Link href={card.link}>
                  <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{card.title}</CardTitle>
                      <IconChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                    {card.description && (
                      <CardDescription>{card.description}</CardDescription>
                    )}
                  </CardHeader>
                  {card.fields && (
                    <CardContent>
                      <div className="space-y-2">
                        {card.fields.map((field, fieldIdx) => (
                          <div key={fieldIdx} className="flex justify-between text-sm">
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
                  <CardHeader>
                    <CardTitle className="text-base">{card.title}</CardTitle>
                    {card.description && (
                      <CardDescription>{card.description}</CardDescription>
                    )}
                  </CardHeader>
                  {card.fields && (
                    <CardContent>
                      <div className="space-y-2">
                        {card.fields.map((field, fieldIdx) => (
                          <div key={fieldIdx} className="flex justify-between text-sm">
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
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    {card.actions.map((action, actionIdx) => (
                      <Button
                        key={actionIdx}
                        variant={action.variant || 'outline'}
                        size="sm"
                        onClick={() => handleAction(action)}
                        className="text-xs"
                      >
                        {action.label}
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
        <div className="flex flex-wrap gap-2 pt-2">
          {messageContent.buttons.map((button, idx) => (
            <Button
              key={idx}
              variant={button.variant || 'outline'}
              size="sm"
              onClick={() => handleAction(button)}
            >
              {button.label}
              {button.action === 'link' && (
                <IconExternalLink className="h-3 w-3 ml-1" />
              )}
            </Button>
          ))}
        </div>
      )}

      {/* Function Calls */}
      {(functionsCalled || messageContent.functionCalls) && (
        <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Functions used:
          </div>
          <div className="flex flex-wrap gap-1">
            {(functionsCalled || messageContent.functionCalls || []).map((fn, idx) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {fn.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Timestamp */}
      <div className="text-xs opacity-70 mt-1">
        {dayjs(timestamp).format('h:mm A')}
      </div>
    </div>
  );
}

