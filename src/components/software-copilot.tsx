'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Loader2, Send, Sparkles, User, ArrowRight, Trash2 } from 'lucide-react';
import { getCopilotResponse } from '@/lib/actions';
import type { CopilotResponseMessage, CopilotRequestBody, SoftwareProduct } from '@/lib/types';
import Link from 'next/link';
import { paths } from '@/lib/paths';
import Image from 'next/image';

interface SoftwareCopilotProps {
  closeSheet: () => void;
  initialMessage?: string;
  storageKey?: string;
}

const LOCAL_STORAGE_KEY = 'softwareCopilotChatHistory';

// Simple Markdown component
function SimpleMarkdown({ content }: { content: string }) {
  const lines = content.split('\n');

  const parseLine = (line: string) => {
    // Bold and Italics
    line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    line = line.replace(/\*(.*?)\*/g, '<em>$1</em>');
    return line;
  };

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      {lines.map((line, index) => {
        if (line.startsWith('### ')) {
          return <h3 key={index} className="text-lg font-semibold mt-1 mb-1" dangerouslySetInnerHTML={{ __html: parseLine(line.substring(4)) }} />;
        }
        if (line.startsWith('## ')) {
          return <h2 key={index} className="text-xl font-bold mt-1 mb-1" dangerouslySetInnerHTML={{ __html: parseLine(line.substring(3)) }} />;
        }
        if (line.startsWith('# ')) {
          return <h1 key={index} className="text-xl font-extrabold mt-1 mb-1" dangerouslySetInnerHTML={{ __html: parseLine(line.substring(2)) }} />;
        }
        if (line.startsWith('* ')) {
          return <li key={index} className="ml-4 list-disc" dangerouslySetInnerHTML={{ __html: parseLine(line.substring(2)) }} />;
        }
        if (line.trim() === '') {
          return <div key={index} className="h-4" />;
        }
        return <p key={index} dangerouslySetInnerHTML={{ __html: parseLine(line) }} />;
      })}
    </div>
  );
}

// Storage Manager



export function SoftwareCopilot({ closeSheet, initialMessage, storageKey }: SoftwareCopilotProps) {
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState<CopilotResponseMessage[]>([]);
  const [isPending, startTransition] = useTransition();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Load chat history from local storage on initial render
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(storageKey || LOCAL_STORAGE_KEY);
      if (savedHistory) {
        setChatHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Failed to load chat history from local storage", error);
      localStorage.removeItem(storageKey || LOCAL_STORAGE_KEY);
    }
  }, [storageKey]);

  // Save chat history to local storage whenever it changes
  useEffect(() => {
    try {
      if (chatHistory.length > 0) {
        localStorage.setItem(storageKey || LOCAL_STORAGE_KEY, JSON.stringify(chatHistory));
      }

    } catch (error) {
      console.error("Failed to save chat history to local storage", error);
    }
  }, [chatHistory, storageKey]);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }

  useEffect(() => {
    // Scroll to the bottom when chat history updates
    scrollToBottom();
  }, [chatHistory]);

  useEffect(() => {
    if (initialMessage && chatHistory.length === 0) {
      handleQuerySubmit(initialMessage);
    }
  }, [initialMessage]);

  const handleQuerySubmit = (currentQuery?: string) => {
    const messageToSend = currentQuery || query;
    if (!messageToSend.trim()) return;

    const userMessage: CopilotResponseMessage = { role: 'user', content: [{ text: messageToSend }] };

    const requestBody: CopilotRequestBody = {
      history: chatHistory,
      prompt: messageToSend,
    };

    // Add user message to history immediately for optimistic update
    setChatHistory(prev => [...prev, userMessage]);
    setQuery('');

    startTransition(async () => {
      try {
        const result = await getCopilotResponse(requestBody);
        setChatHistory(prev => [...prev, result]);
      } catch (error) {
        console.error('Error getting AI response:', error);
        const errorMessage: CopilotResponseMessage = {
          role: 'assistant',
          content: [{ text: "Sorry, I couldn't process your request. Please try again." }],
        };
        setChatHistory(prev => [...prev, errorMessage]);
      }
    });
  };

  const handleClearChat = () => {
    setChatHistory([]);
    localStorage.removeItem(storageKey || LOCAL_STORAGE_KEY);
  };


  return (
    <>
      <SheetHeader className="p-6 pb-4 border-b bg-secondary/50">
        <SheetTitle className="flex items-center justify-between gap-3 text-lg">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border-2 border-primary/20">
              <AvatarFallback className="bg-primary text-primary-foreground">
                <Bot size={20} />
              </AvatarFallback>
            </Avatar>
            <div>
              <div>Software Copilot</div>
              <SheetDescription className="text-left mt-1">
                Ask me to find, compare, or recommend software for you.
              </SheetDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClearChat} title="Clear chat history">
            <Trash2 className="h-4 w-4" />
          </Button>
        </SheetTitle>
      </SheetHeader>

      <ScrollArea className="flex-grow" ref={scrollAreaRef}>
        <div className="space-y-6 p-6">
          {chatHistory.length === 0 && (
            <div className="text-start py-6 px-4 rounded-xl bg-muted/50 border">
              <h3 className="font-semibold text-base mb-2">How can I help?</h3>
              <p className="text-xs text-muted-foreground max-w-sm">
                e.g., "Compare ConnectSphere and DataVortex" or "Find me a good CRM for a small team."
              </p>
            </div>
          )}

          {chatHistory.map((message, index) => (
            <div key={index} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
              {message.role === 'assistant' && (
                <Avatar className="h-8 w-8 border-2 border-primary/10">
                  <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={16} /></AvatarFallback>
                </Avatar>
              )}

              <div className={`rounded-lg p-3 max-w-lg text-sm ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background border'}`}>
                {message.content.map((part, partIndex) => {
                  if (part.text) {
                    return <SimpleMarkdown key={partIndex} content={part.text} />;
                  }
                  if (part.product) {
                    const product = part.product as SoftwareProduct;
                    return (
                      <Card key={product.id} className="mt-2 group overflow-hidden border-primary/20 hover:shadow-lg transition-shadow" onClick={closeSheet}>
                        <Link href={paths.software(product.id)}>
                          <CardHeader className="p-4 flex-row items-start gap-4">
                            <div className="relative h-16 w-16 rounded-md overflow-hidden flex-shrink-0">
                              <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                            </div>
                            <div className='flex-1'>
                              <CardTitle className="text-base mb-1">{product.name}</CardTitle>
                              <CardDescription className="text-xs line-clamp-2">{product.description}</CardDescription>
                            </div>
                            <div className="self-center">
                              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                            </div>
                          </CardHeader>
                        </Link>
                      </Card>
                    )
                  }
                  return null;
                })}
              </div>

              {message.role === 'user' && (
                <Avatar className="h-8 w-8 border-2 border-primary/10">
                  <AvatarFallback className="bg-secondary text-foreground"><User size={16} /></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isPending && (
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8 border-2 border-primary/10">
                <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={16} /></AvatarFallback>
              </Avatar>
              <div className="rounded-lg p-3 bg-background border flex items-center gap-3">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <p className="text-foreground/80 text-sm">Thinking...</p>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <SheetFooter className="p-4 border-t bg-background">
        <div className="relative w-full">
          <Textarea
            placeholder="Describe your needs..."
            className="rounded-md pr-14 min-h-[60px] border resize-none text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleQuerySubmit();
              }
            }}
          />
          <Button
            type="submit"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md h-8 w-10"
            onClick={() => handleQuerySubmit()}
            disabled={isPending || !query.trim()}
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </SheetFooter>
    </>
  );
}
