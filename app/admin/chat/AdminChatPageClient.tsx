'use client';

import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import {
  Bot,
  Loader2,
  PenSquare,
  Sparkles,
  Triangle,
  User,
  FolderKanban,
  MessageSquare,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/utils/cn';

const exampleMessages = [
  {
    heading: 'Plan my day',
    message: `Create a quick morning briefing that highlights new leads, outstanding invoices, and contacts waiting on a reply.`
  },
  {
    heading: 'Draft a reply',
    message: `Write a 3-sentence SMS follow-up for a couple asking about wedding DJ pricing. Keep it friendly and include a soft CTA to book a planning call.`
  },
  {
    heading: 'Service selection',
    message: `Outline the exact steps to move a new lead from demo request to signed contract using our automation playbooks.`
  }
] as const;

const quickLinks = [
  {
    title: 'Automation Hub',
    description: 'Launch and monitor automations.',
    href: '/admin/automation',
    icon: Triangle
  },
  {
    title: 'Contacts CRM',
    description: 'Review timelines and send updates.',
    href: '/admin/contacts',
    icon: FolderKanban
  },
  {
    title: 'SMS Inbox',
    description: 'Open real-time SMS conversations.',
    href: '/chat/sms',
    icon: MessageSquare
  }
] as const;

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

function useLocalChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleInputChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value);
  }, []);

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
  }, []);

  const sendMessage = useCallback(
    async (userInput: string) => {
      const trimmed = userInput.trim();
      if (!trimmed) return;

      const userMessage: ChatMessage = {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-user`,
        role: 'user',
        content: trimmed,
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const context = [...messages, userMessage].map((message) => ({
          role: message.role,
          content: message.content,
        }));

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: trimmed,
            context,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error('Failed to generate response');
        }

        const data = await response.json();
        const assistantText =
          typeof data?.response === 'string'
            ? data.response
            : typeof data?.message === 'string'
            ? data.message
            : '';

        if (assistantText) {
          const assistantMessage: ChatMessage = {
            id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-assistant`,
            role: 'assistant',
            content: assistantText,
          };
          setMessages((prev) => [...prev, assistantMessage]);
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('Chat request failed:', error);
        }
      } finally {
        abortControllerRef.current = null;
        setIsLoading(false);
      }
    },
    [messages],
  );

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void sendMessage(input);
    },
    [input, sendMessage],
  );

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setInput,
    setMessages,
    stop,
  };
}

export default function AdminChatPageClient() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setInput,
    setMessages,
    stop,
  } = useLocalChat();

  const containerRef = useRef<HTMLDivElement | null>(null);

  const hasMessages = useMemo(() => messages.length > 0, [messages.length]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  const onExampleClick = (message: string) => {
    setInput(message);
    setMessages(() => []);
  };

  const onFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    handleSubmit(event);
  };

  return (
    <div className="grid min-h-screen bg-background text-foreground md:grid-cols-[320px_1fr]">
      <aside className="hidden border-r border-border bg-muted/40 md:flex md:flex-col md:justify-between">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">M10DJ Copilot</p>
              <h1 className="text-xl font-semibold text-foreground">Smart Assistant</h1>
            </div>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Ask for help with leads, automations, billing, or communications and get step-by-step plans instantly.
          </p>

          <div className="mt-8 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Examples</h2>
            <div className="space-y-3">
              {exampleMessages.map((example) => (
                <button
                  key={example.heading}
                  onClick={() => onExampleClick(example.message)}
                  className="w-full rounded-lg border border-border bg-card px-4 py-3 text-left transition hover:border-primary hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <PenSquare className="h-4 w-4 text-primary" />
                    {example.heading}
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{example.message}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3 border-t border-border p-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Shortcuts</h2>
          <div className="space-y-2">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between rounded-lg border border-transparent px-3 py-2 text-sm text-muted-foreground transition hover:border-border hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div>
                  <p className="font-medium text-foreground">{link.title}</p>
                  <p className="text-xs text-muted-foreground">{link.description}</p>
                </div>
                <link.icon className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </aside>

      <main className="flex flex-col">
        <header className="border-b border-border bg-background/80 px-4 py-5 backdrop-blur md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">AI Assistance</h2>
                <p className="text-sm text-muted-foreground">
                  Powered by OpenAI and tuned for M10DJ workflows.
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-primary/50 text-primary">
              Secure • Not shared outside your workspace
            </Badge>
          </div>
        </header>

        <div className="relative flex flex-1 flex-col">
          <ScrollArea className="flex-1">
            <div ref={containerRef} className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-10">
              {!hasMessages && (
                <div className="grid h-[420px] place-items-center rounded-3xl border border-dashed border-border bg-muted/40 p-8 text-center">
                  <div className="space-y-4">
                    <Sparkles className="mx-auto h-10 w-10 text-primary" />
                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-foreground">Ready when you are</h3>
                      <p className="text-sm text-muted-foreground">
                        Describe what you need—drafts, plans, follow-ups, or automation tweaks—and I&apos;ll build it.
                      </p>
                    </div>
                    <div className="grid gap-2 text-left text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <PenSquare className="h-4 w-4 text-primary" />
                        Ask for tailored email or SMS copy
                      </div>
                      <div className="flex items-center gap-2">
                        <FolderKanban className="h-4 w-4 text-primary" />
                        Request step-by-step operations playbooks
                      </div>
                      <div className="flex items-center gap-2">
                        <Triangle className="h-4 w-4 text-primary" />
                        Get help with Supabase tables or automations
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex w-full gap-3 whitespace-pre-wrap text-sm leading-relaxed',
                    message.role === 'user' ? 'flex-row-reverse text-right' : 'text-left'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold shadow-sm',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl border px-4 py-3 shadow-sm transition',
                      message.role === 'user'
                        ? 'border-primary/40 bg-primary/10 text-foreground'
                        : 'border-border bg-card text-foreground'
                    )}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="border-t border-border bg-background/80 px-4 py-4 backdrop-blur md:px-8">
            <form onSubmit={onFormSubmit} className="space-y-3 rounded-2xl border border-border bg-muted/30 p-4 shadow-sm">
              <Textarea
                value={input}
                onChange={handleInputChange}
                placeholder="Ask for an operations plan, draft a message, or request data insights…"
                rows={4}
                className="min-h-[120px] resize-none border-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus-visible:ring-0"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Tip: reference contacts, event dates, or automation names for more specific guidance.
                </p>
                <div className="flex items-center gap-2">
                  {isLoading && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={stop}
                      className="rounded-full border border-border bg-card px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
                    >
                      Stop
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-black shadow-brand transition hover:bg-primary/90 disabled:opacity-60"
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Send
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

