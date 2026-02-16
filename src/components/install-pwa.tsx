'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Download, X } from 'lucide-react';

// Show the prompt again after 7 days
const DISMISS_PERIOD = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export default function InstallPWA() {
  const [installPrompt, setInstallPrompt] = useState<any | null>(null);
  const [isPromptVisible, setIsPromptVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();

      const lastDismissed = localStorage.getItem('pwaInstallDismissed');
      if (lastDismissed) {
        const timeSinceDismissed = Date.now() - parseInt(lastDismissed, 10);
        if (timeSinceDismissed < DISMISS_PERIOD) {
          console.log('PWA install prompt dismissed recently.');
          return;
        }
      }

      setInstallPrompt(event);
      setIsPromptVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    setIsPromptVisible(false);
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the PWA installation');
    } else {
      console.log('User dismissed the PWA installation');
    }
    setInstallPrompt(null);
  };

  const handleDismiss = () => {
    setIsPromptVisible(false);
    localStorage.setItem('pwaInstallDismissed', Date.now().toString());
  };

  if (!isPromptVisible) {
    return null;
  }

  return (
    <AlertDialog open={isPromptVisible} onOpenChange={setIsPromptVisible}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" /> Install the sixstars App
          </AlertDialogTitle>
          <AlertDialogDescription>
            For a better experience, install the sixstars app on your device. It's fast, works offline, and takes up almost no space.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleDismiss}>
            <X className="mr-2 h-4 w-4" /> Dismiss
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleInstall}>
            <Download className="mr-2 h-4 w-4" /> Install
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
