"use client";

import { useEffect } from "react";
import { toast } from "sonner";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }

    let deferred: InstallEvent | null = null;
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      deferred = event as InstallEvent;
      toast("Instalar o Patrimônia", {
        description: "Adicione o aplicativo à tela inicial para acesso rápido.",
        action: { label: "Instalar", onClick: async () => {
          if (!deferred) return;
          await deferred.prompt();
          await deferred.userChoice;
          deferred = null;
        } },
        duration: 12000,
      });
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);
  return null;
}
