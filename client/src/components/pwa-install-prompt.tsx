
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInstalled = localStorage.getItem('pwa-installed') === 'true';
    const promptDismissed = localStorage.getItem('pwa-prompt-dismissed') === 'true';
    
    if (isStandalone || isInstalled || promptDismissed) {
      setIsInstalled(true);
      return;
    }

    // Check if in Replit environment
    const isReplit = window.location.hostname.includes('replit.dev');
    
    // Listen for beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      console.log('PWA install prompt available');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after a short delay, unless in Replit
      setTimeout(() => {
        if (!isReplit) {
          setShowPrompt(true);
        }
      }, 3000);
    };

    // Listen for custom PWA installable event
    const handlePWAInstallable = () => {
      console.log('PWA installable event received');
      if (!isReplit && !promptDismissed) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('pwa-installable', handlePWAInstallable);
    
    // Show manual prompt for Replit or mobile browsers after delay
    if (isReplit || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      setTimeout(() => {
        if (!isInstalled && !promptDismissed) {
          setShowPrompt(true);
        }
      }, 5000);
    }
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('pwa-installable', handlePWAInstallable);
    };
  }, []);

  const handleInstall = async () => {
    const isReplit = window.location.hostname.includes('replit.dev');
    
    if (deferredPrompt && !isReplit) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          localStorage.setItem('pwa-installed', 'true');
          setIsInstalled(true);
        }
        
        setDeferredPrompt(null);
        setShowPrompt(false);
      } catch (error) {
        console.error('PWA install error:', error);
        showManualInstructions();
      }
    } else {
      showManualInstructions();
    }
  };

  const showManualInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isReplit = window.location.hostname.includes('replit.dev');
    
    let instructions = "";
    if (isReplit) {
      instructions = "Open this page in your mobile browser, then use 'Add to Home Screen'";
    } else if (isIOS) {
      instructions = "Tap the Share button (📤) → Add to Home Screen";
    } else if (isAndroid) {
      instructions = "Tap the menu (⋮) → Add to Home screen";
    } else {
      instructions = "Look for 'Add to Home Screen' in your browser menu";
    }

    alert(`📱 Add to Home Screen\n\n${instructions}`);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40">
      <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Smartphone className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Install Fruitbox</h3>
                <p className="text-xs text-white/80">Get app-like experience</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleInstall}
                className="bg-white text-blue-600 hover:bg-white/90"
              >
                Install
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
