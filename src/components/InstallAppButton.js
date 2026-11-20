"use client";

/**
 * "Install app" button for the desktop / home-screen version of the workspace.
 *
 * Shown only where the browser actually offers installation — Chrome and Edge
 * fire beforeinstallprompt; Safari and Firefox do not, and are better served by
 * written instructions than by a button that does nothing. Hidden once the app
 * is installed or is already running as one.
 */

import { useEffect, useState } from "react";
import { FiDownload } from "react-icons/fi";
import { toast } from "./Toast";

export default function InstallAppButton() {
  const [promptEvent, setPromptEvent] = useState(null);

  useEffect(() => {
    // Already running as the installed app: nothing to offer.
    if (window.matchMedia?.("(display-mode: standalone)").matches) return undefined;

    const onPrompt = (event) => {
      // Stop the browser's own mini-bar so the offer comes from this button.
      event.preventDefault();
      setPromptEvent(event);
    };
    const onInstalled = () => {
      setPromptEvent(null);
      toast.success("Iris Monde is installed. Open it from your desktop or Start menu.");
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!promptEvent) return null;

  const install = async () => {
    promptEvent.prompt();
    await promptEvent.userChoice.catch(() => null);
    // The event can only be used once, whatever the answer was.
    setPromptEvent(null);
  };

  return (
    <button
      type="button"
      onClick={install}
      className="app-focus hidden items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-bold text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] sm:flex"
      title="Install Iris Monde as a desktop app"
    >
      <FiDownload size={14} /> Install app
    </button>
  );
}
