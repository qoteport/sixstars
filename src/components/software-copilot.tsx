'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Bot } from 'lucide-react';

interface SoftwareCopilotProps {
  closeSheet: () => void;
  initialMessage?: string;
  storageKey?: string;
}

export function SoftwareCopilot({ closeSheet }: SoftwareCopilotProps) {
  return (
    <>
      <SheetHeader className="p-6 pb-4 border-b bg-secondary/50">
        <SheetTitle className="flex items-center gap-3 text-lg">
          Software Copilot
        </SheetTitle>
        <SheetDescription>
            Ask me to find, compare, or recommend software for you.
        </SheetDescription>
      </SheetHeader>

      <ScrollArea className="flex-grow">
        <div className="p-6 text-center h-full flex flex-col items-center justify-center">
            <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-semibold">AI Copilot Unavailable</h3>
            <p className="mt-2 text-sm text-muted-foreground">
                The AI copilot is temporarily unavailable. We are working to restore it. Please try again later.
            </p>
        </div>
      </ScrollArea>

      <SheetFooter className="p-4 border-t bg-background">
        <Button onClick={closeSheet} className="w-full" variant="outline">Close</Button>
      </SheetFooter>
    </>
  );
}
