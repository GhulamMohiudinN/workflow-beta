"use client";

/**
 * The notification bell: unread count, latest notifications, mark as read.
 *
 * Kept current two ways. A live socket pushes new ones instantly when the
 * backend runs as a long-lived server; on Vercel, where it cannot, the bell
 * re-checks every 30 seconds and whenever the window regains focus. Either
 * path alone is enough.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FiBell, FiCheck } from "react-icons/fi";
import { notificationAPI } from "../app/api/notificationAPI";
import { getSocket } from "../app/utils/socket";
import { notificationLinkFor } from "../app/utils/permissions";

const POLL_MS = 30 * 1000;

const timeAgo = (iso) => {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

const readUser = () => {
  try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
};

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef(null);

  const load = useCallback(async () => {
    const res = await notificationAPI.list();
    if (res.success) {
      setItems(res.notifications || []);
      setUnread(res.unread || 0);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, POLL_MS);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);

    const socket = getSocket();
    const onNotification = (n) => {
      setItems((prev) => [n, ...prev.filter((p) => p.id !== n.id)].slice(0, 30));
      setUnread((u) => u + 1);
    };
    socket?.on("notification", onNotification);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      socket?.off("notification", onNotification);
    };
  }, [load]);

  // Close when clicking anywhere else.
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const openNotification = async (n) => {
    if (!n.read) {
      setItems((prev) => prev.map((p) => (p.id === n.id ? { ...p, read: true } : p)));
      setUnread((u) => Math.max(0, u - 1));
      notificationAPI.markRead(n.id);
    }
    const target = notificationLinkFor(readUser(), n.link);
    if (target) {
      setOpen(false);
      router.push(target);
    }
  };

  const markAll = async () => {
    setItems((prev) => prev.map((p) => ({ ...p, read: true })));
    setUnread(0);
    await notificationAPI.markAllRead();
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="app-focus relative flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
      >
        <FiBell size={17} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-lg sm:w-96">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
            <p className="text-sm font-black text-[var(--color-text)]">Notifications</p>
            {unread > 0 && (
              <button type="button" onClick={markAll}
                className="flex items-center gap-1 text-xs font-bold text-[var(--color-primary)] hover:underline">
                <FiCheck size={12} /> Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-[var(--color-muted)]">You&apos;re all caught up.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => openNotification(n)}
                  className={`flex w-full gap-3 border-b border-[var(--color-border)] px-4 py-3 text-left last:border-0 hover:bg-[var(--color-surface-hover)] ${n.read ? "" : "bg-blue-50/60"}`}
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-[var(--color-primary)]"}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-[var(--color-text)]">{n.title}</span>
                    {n.message && <span className="mt-0.5 block truncate text-xs text-[var(--color-muted)]">{n.message}</span>}
                    <span className="mt-1 block text-[11px] text-[var(--color-faint)]">{timeAgo(n.createdAt)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
