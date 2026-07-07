import { useEffect, useState } from "react";
import { Download, X, Smartphone, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "spendwise:install-dismissed-at";
const DISMISS_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error iOS
    window.navigator.standalone === true
  );
}

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window);
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) {
      setInstalled(true);
      return;
    }

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    const recentlyDismissed = Date.now() - dismissedAt < DISMISS_MS;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      if (!recentlyDismissed) {
        // slight delay so the popup doesn't fight page load
        setTimeout(() => setOpen(true), 1500);
      }
    };
    const onInstalled = () => {
      setInstalled(true);
      setOpen(false);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    // iOS: no beforeinstallprompt; show manual instructions
    if (isIOS() && !recentlyDismissed) {
      setIosHint(true);
      setTimeout(() => setOpen(true), 1500);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
    }
    setDeferred(null);
    setOpen(false);
  };

  const handleClose = (o: boolean) => {
    setOpen(o);
    if (!o) localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  if (installed) return null;
  if (!deferred && !iosHint) return null;

  return (
    <>
      {/* Floating "Install Now" button */}
      <button
        onClick={() => setOpen(true)}
        className="no-print fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full gradient-primary text-white px-4 py-3 shadow-lg hover:shadow-xl hover:scale-105 transition-all animate-fade-in"
        aria-label="Install Spend Wise app"
      >
        <Download className="h-4 w-4" />
        <span className="text-sm font-semibold">Install Now</span>
      </button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 h-14 w-14 rounded-2xl gradient-primary grid place-items-center text-white shadow-lg">
              <Smartphone className="h-7 w-7" />
            </div>
            <DialogTitle className="text-center text-xl">Install Spend Wise</DialogTitle>
            <DialogDescription className="text-center">
              Add Spend Wise to your home screen for a faster, app-like experience with quick access to your finances.
            </DialogDescription>
          </DialogHeader>

          {deferred ? (
            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={handleInstall} size="lg" className="gap-2">
                <Download className="h-4 w-4" /> Install Now
              </Button>
              <Button variant="ghost" onClick={() => handleClose(false)}>
                Maybe later
              </Button>
            </div>
          ) : (
            <div className="space-y-3 pt-2">
              <div className="rounded-lg border p-3 text-sm space-y-2">
                <div className="flex items-center gap-2">
                  <Share className="h-4 w-4 text-primary" />
                  <span>Tap the <strong>Share</strong> button in Safari</span>
                </div>
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-primary" />
                  <span>Select <strong>Add to Home Screen</strong></span>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={() => handleClose(false)}>
                <X className="h-4 w-4 mr-2" /> Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
