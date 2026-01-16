/**
 * Message Content Renderer
 * 
 * Renders assistant messages with support for text, buttons, and cards
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { IconExternalLink, IconChevronRight, IconCopy, IconCheck } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/utils/cn';
import dayjs from 'dayjs';
import { useToast } from '@/components/ui/Toasts/use-toast';
import { ComposeMessageModal } from './ComposeMessageModal';

interface ActionButton {
  label: string;
  action: 'link' | 'function' | 'copy' | 'send_sms' | 'send_email' | 'mark_spam' | 'request_review' | 'approve_and_send_sms' | 'approve_and_send_email' | 'quick_option' | 'update_song_request';
  value: string;
  variant?: 'default' | 'outline' | 'secondary';
  metadata?: {
    contact_id?: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    initial_message?: string;
    initial_subject?: string;
    message?: string;
    subject?: string;
    option_text?: string; // The text to send when option is selected
    request_id?: string; // For song request updates
    status?: string; // For song request status updates
  };
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
  quickOptions?: ActionButton[]; // Quick option buttons that can be clicked or typed
}

interface MessageContentRendererProps {
  content: string | StructuredContent;
  timestamp?: string;
  functionsCalled?: Array<{ name: string; arguments: any }>;
  onNavigate?: () => void; // Callback to close assistant when navigating
  onSendMessage?: (message: string) => void; // Callback to send a message to the assistant
}

export function MessageContentRenderer({ 
  content, 
  timestamp,
  functionsCalled,
  onNavigate,
  onSendMessage
}: MessageContentRendererProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const [composeModalOpen, setComposeModalOpen] = useState(false);
  const [composeModalData, setComposeModalData] = useState<{
    contactId: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    initialMessage?: string;
    initialSubject?: string;
    initialType?: 'sms' | 'email';
  } | null>(null);

  // Extract message draft from assistant response
  const extractMessageDraft = (text: string): { message: string; subject?: string; type: 'sms' | 'email' } | null => {
    if (!text) return null;

    // Check if this looks like a message draft - updated patterns to match assistant output
    const isEmailDraft = 
      text.includes("Here's a suggested email") || 
      text.includes("Here's a suggested email for") ||
      (text.includes("Subject:") && (text.includes("email") || text.includes("Email")));
    
    const isSMSDraft = 
      text.includes("Here's a suggested SMS") || 
      text.includes("Here's a suggested SMS for") ||
      (text.includes("Here's a suggested version") && !isEmailDraft);

    if (!isEmailDraft && !isSMSDraft) return null;

    let extractedMessage = '';
    let extractedSubject = '';

    if (isEmailDraft) {
      // Extract subject line - look for "Subject:" or "**Subject:**"
      const subjectMatch = text.match(/(?:\*\*)?Subject:\s*\*?\*?\s*(.+?)(?:\n|$)/i);
      if (subjectMatch) {
        extractedSubject = subjectMatch[1].trim();
      }

      // Extract message body - look for "**Message:**" or content after subject
      let messageStart = -1;
      let messageEnd = text.length;
      
      // Try to find "**Message:**" marker
      const messageMarkerMatch = text.match(/\*\*Message:\*\*\s*\n/i);
      if (messageMarkerMatch) {
        messageStart = messageMarkerMatch.index! + messageMarkerMatch[0].length;
      } else {
        // Fallback: find content after subject
        const subjectEnd = text.indexOf(extractedSubject) + extractedSubject.length;
        messageStart = subjectEnd;
      }
      
      // Find where message ends (before closing markers like "---" or "Feel free")
      const closingMarkers = [
        text.indexOf("---", messageStart),
        text.indexOf("Feel free", messageStart),
        text.indexOf("Would you like", messageStart),
        text.indexOf("**[Copy Message]**", messageStart)
      ].filter(idx => idx > messageStart);
      
      if (closingMarkers.length > 0) {
        messageEnd = Math.min(...closingMarkers);
      }
      
      if (messageStart > -1 && messageEnd > messageStart) {
        extractedMessage = text.substring(messageStart, messageEnd)
          .replace(/^\*\*Subject:.*$/m, '')
          .replace(/^\*\*To:.*$/m, '')
          .replace(/^\*\*Message:\*\*\s*/i, '')
          .replace(/^---.*$/gm, '')
          .replace(/^Hi\s+\[Name\],/m, 'Hi [Name],')
          .replace(/^\n+/g, '')
          .replace(/\n+---.*$/g, '')
          .replace(/\[Copy Message\].*$/g, '')
          .trim();
      }
    } else if (isSMSDraft) {
      // Extract SMS message - look for content after "Here's a suggested SMS for"
      let messageStart = -1;
      let messageEnd = text.length;
      
      // Find the start after the intro phrase
      const introMatch = text.match(/Here's a suggested SMS for[^:]*:\s*\n/i);
      if (introMatch) {
        messageStart = introMatch.index! + introMatch[0].length;
      }
      
      // Find where message ends
      const closingMarkers = [
        text.indexOf("---", messageStart),
        text.indexOf("Feel free", messageStart),
        text.indexOf("Would you like", messageStart)
      ].filter(idx => idx > messageStart && idx > -1);
      
      if (closingMarkers.length > 0) {
        messageEnd = Math.min(...closingMarkers);
      }
      
      if (messageStart > -1 && messageEnd > messageStart) {
        extractedMessage = text.substring(messageStart, messageEnd)
          .replace(/^---.*$/gm, '')
          .replace(/^\n+/g, '')
            .trim();
      }
    }

    if (extractedMessage) {
      return {
        message: extractedMessage,
        subject: extractedSubject || undefined,
        type: isEmailDraft ? 'email' : 'sms'
      };
    }

    return null;
  };

  const handleCopyMessage = async (draft: { message: string; subject?: string; type: 'sms' | 'email' }, copyType: 'subject' | 'message' = 'message') => {
    let textToCopy = '';
    
    if (copyType === 'subject' && draft.subject) {
      textToCopy = draft.subject;
    } else {
      textToCopy = draft.message;
    }

    await navigator.clipboard.writeText(textToCopy);
    setCopied(copyType === 'subject' ? 'subject' : 'message');
    toast({
      title: copyType === 'subject' ? "Subject copied!" : "Message copied!",
      description: copyType === 'subject' ? "Subject line copied to clipboard" : "Message copied to clipboard",
    });
    setTimeout(() => setCopied(null), 2000);
  };
  
  // Extract quick options from text
  const extractQuickOptions = (text: string): ActionButton[] => {
    if (!text) return [];
    
    const options: ActionButton[] = [];
    
    // Check if this text contains option-related keywords
    const hasOptionKeywords = 
      text.toLowerCase().includes('quick option') ||
      text.toLowerCase().includes('option buttons') ||
      text.toLowerCase().includes('options') ||
      text.toLowerCase().includes('topics you might consider') ||
      text.toLowerCase().includes('suggestions');
    
    if (!hasOptionKeywords) {
      return []; // Early return if this doesn't look like an options list
    }
    
    // Find the section with options (usually after phrases like "Here are some...")
    const optionSectionPatterns = [
      /here are some quick option buttons[:\s]*([\s\S]+?)(?:\n\n\s*These topics|\n\n\s*Let me know|$)/i,
      /here are some[:\s]+([\s\S]+?)(?:\n\n\s*These topics|\n\n\s*Let me know|$)/i,
      /you might consider[:\s]+([\s\S]+?)(?:\n\n\s*These topics|\n\n\s*Let me know|$)/i,
      /quick option buttons[:\s]+([\s\S]+?)(?:\n\n\s*These topics|\n\n\s*Let me know|$)/i,
    ];
    
    let optionSection = '';
    let sectionStartIndex = -1;
    
    for (const pattern of optionSectionPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        optionSection = match[1];
        sectionStartIndex = text.indexOf(match[0]);
        break;
      }
    }
    
    // If we didn't find a specific section but text has option keywords, search entire text
    const searchText = optionSection || text;
    const searchStartIndex = sectionStartIndex >= 0 ? sectionStartIndex : 0;
    
    // Look for patterns like "- Option Name" or "• Option Name" followed by newline or end of text
    // Match bullet points that are on their own lines
    const bulletPattern = /^[-•]\s*(.+?)(?:\n|$)/gm;
    let match;
    let matchCount = 0;
    
    // Reset regex lastIndex
    bulletPattern.lastIndex = 0;
    
    while ((match = bulletPattern.exec(searchText)) !== null) {
      const optionText = match[1].trim();
      
      // Skip empty lines
      if (!optionText) continue;
      
      // Clean up common trailing phrases
      const cleanedText = optionText
        .replace(/\s*\.\s*$/, '') // Remove trailing periods
        .replace(/\s*--.*$/, '') // Remove trailing comments
        .replace(/\s*\(.*?\)\s*$/, '') // Remove trailing parentheses
        .trim();
      
      // Valid options: 3-60 chars, typically capitalized or title case
      if (cleanedText.length >= 3 && cleanedText.length <= 60) {
        // Check if it looks like an option (not a sentence or explanation)
        const isLikelyOption = 
          !cleanedText.toLowerCase().includes(' because ') &&
          !cleanedText.toLowerCase().includes(' when ') &&
          !cleanedText.toLowerCase().includes(' where ') &&
          !cleanedText.toLowerCase().startsWith('you can') &&
          !cleanedText.toLowerCase().startsWith('this will') &&
          !cleanedText.toLowerCase().includes('help streamline') &&
          cleanedText.length > 0;
        
        if (isLikelyOption) {
          // Get context around this match to verify it's in an options section
          const globalMatchIndex = searchStartIndex + match.index;
          const beforeMatch = text.substring(Math.max(0, globalMatchIndex - 200), globalMatchIndex);
          const afterMatch = text.substring(globalMatchIndex + match[0].length, Math.min(text.length, globalMatchIndex + match[0].length + 100));
          
          const isInOptionsSection = 
            optionSection.length > 0 || // We already found an options section
            beforeMatch.toLowerCase().includes('option') ||
            beforeMatch.toLowerCase().includes('suggest') ||
            beforeMatch.toLowerCase().includes('consider') ||
            beforeMatch.toLowerCase().includes('here are') ||
            beforeMatch.toLowerCase().includes('topics') ||
            beforeMatch.toLowerCase().includes('quick option') ||
            afterMatch.trim().startsWith('-') || // Next line is also a bullet
            afterMatch.trim().startsWith('•');
          
          if (isInOptionsSection) {
            options.push({
              label: cleanedText,
              action: 'quick_option',
              value: cleanedText,
              variant: 'outline',
              metadata: {
                option_text: cleanedText
              }
            });
            matchCount++;
          }
        }
      }
    }
    
    // Also look for numbered lists (1. 2. etc.) but only if we didn't find many bullet points
    if (options.length < 2) {
      const numberedPattern = /^\d+\.\s*(.+?)(?:\n|$)/gm;
      numberedPattern.lastIndex = 0;
      
      while ((match = numberedPattern.exec(searchText)) !== null) {
        const optionText = match[1].trim().replace(/\s*\.\s*$/, '').trim();
        if (optionText.length >= 3 && optionText.length <= 60) {
          const isLikelyOption = 
            !optionText.includes(' because ') &&
            !optionText.includes(' when ') &&
            !optionText.includes(' where ') &&
            !optionText.toLowerCase().startsWith('you can');
          
          if (isLikelyOption && !options.find(o => o.label === optionText)) {
            options.push({
              label: optionText,
              action: 'quick_option',
              value: optionText,
              variant: 'outline',
              metadata: {
                option_text: optionText
              }
            });
          }
        }
      }
    }
    
    // Return only if we found at least 2 options (likely a selection list)
    // And limit to reasonable number (max 12 options)
    return options.length >= 2 && options.length <= 12 ? options : [];
  };
  
  // Parse content - can be string or structured object
  let messageContent: StructuredContent;
  
  if (typeof content === 'string') {
    // Try to parse JSON from the string (if assistant returns structured data)
    try {
      const parsed = JSON.parse(content);
      if (parsed.text || parsed.buttons || parsed.cards || parsed.quickOptions) {
        messageContent = parsed;
        // Also extract quick options from text if not already provided
        if (parsed.text && !parsed.quickOptions) {
          const extractedOptions = extractQuickOptions(parsed.text);
          if (extractedOptions.length > 0) {
            messageContent.quickOptions = extractedOptions;
          }
        }
      } else {
        messageContent = { text: content };
        // Extract quick options from plain text
        const extractedOptions = extractQuickOptions(content);
        if (extractedOptions.length > 0) {
          messageContent.quickOptions = extractedOptions;
        }
      }
    } catch {
      // Not JSON, treat as plain text
      messageContent = { text: content };
      // Extract quick options from plain text
      const extractedOptions = extractQuickOptions(content);
      if (extractedOptions.length > 0) {
        messageContent.quickOptions = extractedOptions;
      }
    }
  } else {
    messageContent = content;
    // Extract quick options from text if available
    if (messageContent.text && !messageContent.quickOptions) {
      const extractedOptions = extractQuickOptions(messageContent.text);
      if (extractedOptions.length > 0) {
        messageContent.quickOptions = extractedOptions;
      }
    }
  }

  const handleAction = async (button: ActionButton) => {
    switch (button.action) {
      case 'link':
        if (button.value.startsWith('http')) {
          window.open(button.value, '_blank');
        } else {
          // Close assistant before navigating
          if (onNavigate) {
            onNavigate();
          }
          // Small delay to ensure overlay closes, then navigate
          setTimeout(() => {
            router.push(button.value);
          }, 100);
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
      case 'send_sms':
      case 'send_email':
        // Send message to assistant to start conversation flow
        if (button.metadata?.contact_id && onSendMessage) {
          const messageType = button.action === 'send_sms' ? 'SMS' : 'email';
          const contactName = button.metadata.contact_name || 'this contact';
          onSendMessage(`I want to send a ${messageType} to ${contactName}. What do you want to say in the ${messageType} message?`);
        } else {
          toast({
            title: 'Error',
            description: 'Unable to send message - contact information not available',
            variant: 'destructive',
          });
        }
        break;
      case 'mark_spam':
        // Send message to assistant to mark as spam
        if (button.metadata?.contact_id && onSendMessage) {
          onSendMessage(`Mark this contact as spam`);
          toast({
            title: "Marking as spam",
            description: "Sending request to mark contact as spam...",
          });
        } else {
          toast({
            title: 'Error',
            description: 'Unable to mark as spam - contact information not available',
            variant: 'destructive',
          });
        }
        break;
      case 'request_review':
        // Send message to assistant to request review
        if (button.metadata?.contact_id && onSendMessage) {
          const contactName = button.metadata.contact_name || 'this contact';
          onSendMessage(`Request a review from ${contactName}`);
          toast({
            title: "Requesting review",
            description: "Sending review request...",
          });
        } else {
          toast({
            title: 'Error',
            description: 'Unable to request review - contact information not available',
            variant: 'destructive',
          });
        }
        break;
      case 'approve_and_send_sms':
        // Send SMS immediately when user clicks Send button
        if (button.metadata?.contact_id && button.metadata?.message && onSendMessage) {
          // Send a message to the assistant to actually send the SMS
          onSendMessage(`Send this SMS message now: ${button.metadata.message}`);
          toast({
            title: "Sending SMS",
            description: "Sending message...",
          });
        } else {
          toast({
            title: 'Error',
            description: 'Unable to send SMS - message or contact information missing',
            variant: 'destructive',
          });
        }
        break;
      case 'approve_and_send_email':
        // Send email immediately when user clicks Send button
        if (button.metadata?.contact_id && button.metadata?.message && button.metadata?.subject && onSendMessage) {
          // Send a message to the assistant to actually send the email
          onSendMessage(`Send this email now. Subject: ${button.metadata.subject}. Message: ${button.metadata.message}`);
          toast({
            title: "Sending Email",
            description: "Sending message...",
          });
        } else {
          toast({
            title: 'Error',
            description: 'Unable to send email - message, subject, or contact information missing',
            variant: 'destructive',
          });
        }
        break;
      case 'quick_option':
        // Send the selected option as a message to the assistant
        if (onSendMessage) {
          const optionText = button.metadata?.option_text || button.value || button.label;
          // Use natural language to select the option
          // Common patterns: "Let's do [option]", "I'll take [option]", "Go with [option]", "[option]"
          onSendMessage(`Let's do ${optionText}`);
        }
        break;
      case 'update_song_request':
        // Update song request status
        if (button.metadata?.request_id && button.metadata?.status && onSendMessage) {
          const statusLabel = button.metadata.status === 'played' ? 'played' :
                             button.metadata.status === 'playing' ? 'now playing' :
                             button.metadata.status === 'acknowledged' ? 'acknowledged' :
                             button.metadata.status;
          onSendMessage(`Mark song request ${button.metadata.request_id} as ${statusLabel}`);
          toast({
            title: "Updating request",
            description: `Marking as ${statusLabel}...`,
          });
        } else {
          toast({
            title: 'Error',
            description: 'Unable to update request - missing information',
            variant: 'destructive',
          });
        }
        break;
    }
  };

  return (
    <>
      {composeModalData && (
        <ComposeMessageModal
          key={`compose-${composeModalData.contactId}-${composeModalOpen}`}
          open={composeModalOpen}
          onClose={() => {
            setComposeModalOpen(false);
            setComposeModalData(null);
          }}
          contactId={composeModalData.contactId}
          contactName={composeModalData.contactName}
          contactEmail={composeModalData.contactEmail}
          contactPhone={composeModalData.contactPhone}
          initialMessage={composeModalData.initialMessage}
          initialSubject={composeModalData.initialSubject}
          initialType={composeModalData.initialType}
        />
      )}
      <div className={cn(
        "w-full rounded-lg",
        // Remove background and padding - let parent handle styling
      )}>
      <div className="space-y-3">
        {/* Text Content */}
        {messageContent.text && (
          <div className="relative">
            <div className="whitespace-pre-wrap text-sm">{messageContent.text}</div>
            {/* Copy Buttons - appears when message draft is detected */}
            {(() => {
              const draft = extractMessageDraft(messageContent.text);
              if (draft) {
                return (
                  <div className="mt-2 flex justify-end gap-2">
                    {/* Subject Copy Button - only show for email with subject */}
                    {draft.type === 'email' && draft.subject && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyMessage(draft, 'subject')}
                        className="text-xs h-7"
                      >
                        {copied === 'subject' ? (
                          <>
                            <IconCheck className="h-3 w-3 mr-1" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <IconCopy className="h-3 w-3 mr-1" />
                            Copy Subject
                          </>
                        )}
                      </Button>
                    )}
                    {/* Message Body Copy Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyMessage(draft, 'message')}
                      className="text-xs h-7"
                    >
                      {copied === 'message' ? (
                        <>
                          <IconCheck className="h-3 w-3 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <IconCopy className="h-3 w-3 mr-1" />
                          Copy Message
                        </>
                      )}
                    </Button>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}

        {/* Cards */}
        {messageContent.cards && messageContent.cards.length > 0 && (
          <div className="space-y-3">
            {messageContent.cards.map((card, idx) => (
              <Card key={idx} className="border-gray-200 dark:border-gray-700 shadow-sm w-full max-w-full">
                {card.link ? (
                  <Link 
                    href={card.link}
                    onClick={(e) => {
                      // Close assistant when clicking card link
                      if (onNavigate) {
                        onNavigate();
                      }
                      // Let the Link component handle navigation naturally
                    }}
                  >
                    <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors pb-2 px-4 pt-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold">{card.title}</CardTitle>
                        <IconChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                      {card.description && (
                        <CardDescription className="text-sm mt-1.5">{card.description}</CardDescription>
                      )}
                    </CardHeader>
                    {card.fields && (
                      <CardContent className="pt-0 px-4 pb-3">
                        <div className="space-y-2.5">
                          {card.fields.map((field, fieldIdx) => (
                            <div key={fieldIdx} className="flex justify-between items-start gap-4 text-sm">
                              <span className="text-gray-500 dark:text-gray-400 font-medium flex-shrink-0">{field.label}:</span>
                              <span className="font-medium text-gray-900 dark:text-white text-right break-words">{field.value}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Link>
                ) : (
                  <>
                    <CardHeader className="pb-2 px-4 pt-4">
                      <CardTitle className="text-lg font-semibold">{card.title}</CardTitle>
                      {card.description && (
                        <CardDescription className="text-sm mt-1.5">{card.description}</CardDescription>
                      )}
                    </CardHeader>
                    {card.fields && (
                      <CardContent className="pt-0 px-4 pb-3">
                        <div className="space-y-2.5">
                          {card.fields.map((field, fieldIdx) => (
                            <div key={fieldIdx} className="flex justify-between items-start gap-4 text-sm">
                              <span className="text-gray-500 dark:text-gray-400 font-medium flex-shrink-0">{field.label}:</span>
                              <span className="font-medium text-gray-900 dark:text-white text-right break-words">{field.value}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </>
                )}
                
                {/* Card Actions */}
                {card.actions && card.actions.length > 0 && (
                  <CardContent className="pt-3 pb-4 px-4">
                    <div className="flex flex-wrap gap-2.5">
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
                          className="text-sm h-8 px-4"
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

        {/* Quick Options - Clickable buttons for selections */}
        {messageContent.quickOptions && messageContent.quickOptions.length > 0 && (
          <div className="pt-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Quick options (click to select or type your choice):
            </div>
            <div className="flex flex-wrap gap-2">
              {messageContent.quickOptions.map((button, idx) => (
                <Button
                  key={idx}
                  variant={button.variant || 'outline'}
                  size="sm"
                  onClick={() => handleAction(button)}
                  className="text-xs h-8 px-3"
                >
                  {button.label}
                </Button>
              ))}
            </div>
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
    </>
  );
}

