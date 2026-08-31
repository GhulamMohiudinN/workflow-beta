"use client";

/**
 * Lightweight self-contained toast system — replaces react-hot-toast.
 *
 * Previously <Toaster/> from react-hot-toast was mounted once globally in
 * the root layout AND again inside ~12 individual pages. Multiple portals
 * competing over the same global toast store is exactly the anti-pattern
 * react-hot-toast's own docs warn against — on client-side navigation, a
 * toast's exit animation could get orphaned between the unmounting page's
 * Toaster and the surviving global one, leaving it stuck on screen until a
 * full refresh. Mount <Toaster/> exactly once (root layout) going forward.
 */

import { useState, useEffect, useCallback } from "react";
import { FiCheckCircle, FiXCircle, FiX } from "react-icons/fi";

let toasts = [];
let listeners = [];

const notify = () => listeners.forEach((listener) => listener(toasts));

const addToast = (type, message, opts = {}) => {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const duration = opts.duration ?? 3500;
  toasts = [...toasts, { id, type, message, duration }];
  notify();
  return id;
};

export const removeToast = (id) => {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
};

export const toast = {
  success: (message, opts) => addToast("success", message, opts),
  error: (message, opts) => addToast("error", message, opts),
};

function ToastItem({ item }) {
  const [leaving, setLeaving] = useState(false);
  const [paused, setPaused] = useState(false);

  const dismiss = useCallback(() => {
    setLeaving(true);
    setTimeout(() => removeToast(item.id), 180);
  }, [item.id]);

  useEffect(() => {
    if (paused || item.duration === Infinity) return;
    const timer = setTimeout(dismiss, item.duration);
    return () => clearTimeout(timer);
  }, [paused, item.duration, dismiss]);

  const isSuccess = item.type === "success";

  return (
    <div
      role="status"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className={`pointer-events-auto flex w-[320px] max-w-[calc(100vw-2rem)] items-start gap-2.5 rounded-xl border bg-white px-4 py-3 shadow-lg transition-all duration-200 ease-out ${
        leaving
          ? "translate-x-3 scale-95 opacity-0"
          : "translate-x-0 scale-100 opacity-100"
      } ${isSuccess ? "border-emerald-200" : "border-red-200"}`}
      style={{ animation: leaving ? undefined : "toast-in 0.22s ease-out" }}
    >
      {isSuccess ? (
        <FiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
      ) : (
        <FiXCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
      )}
      <p className="flex-1 text-sm font-medium leading-snug text-slate-800">
        {item.message}
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss notification"
        className="-mr-1 -mt-1 shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
      >
        <FiX className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function Toaster() {
  const [items, setItems] = useState(toasts);

  useEffect(() => {
    listeners.push(setItems);
    return () => {
      listeners = listeners.filter((l) => l !== setItems);
    };
  }, []);

  if (!items.length) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed top-4 right-4 z-[1000] flex flex-col gap-2"
    >
      {items.map((item) => (
        <ToastItem key={item.id} item={item} />
      ))}
    </div>
  );
}

export default toast;
