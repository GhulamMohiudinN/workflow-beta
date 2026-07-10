"use client";

/**
 * CommandSearch — global keyboard-navigable search palette.
 *
 * Searches processes, templates, and users in parallel with a
 * 300 ms debounce. Groups results by entity type. Supports full
 * keyboard navigation (↑ ↓ Enter Escape) and closes on outside click.
 *
 * Usage:
 *   <CommandSearch />   — drop inside any client layout, opens on input focus
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  FiSearch, FiX, FiLayers, FiLayout, FiUsers,
  FiArrowRight, FiLoader, FiAlertCircle,
} from "react-icons/fi";
import { processAPI } from "../app/api/processAPI";
import { templateAPI } from "../app/api/templateAPI";
import { userAPI } from "../app/api/userAPI";

// ─── Static navigation shortcuts ────────────────────────────────────────────
const NAV_PAGES = [
  { id: "nav-dashboard",     label: "Dashboard",       href: "/dashboard",      category: "Pages" },
  { id: "nav-processes",     label: "Processes",       href: "/processes",      category: "Pages" },
  { id: "nav-templates",     label: "Templates",       href: "/templates",      category: "Pages" },
  { id: "nav-builder",       label: "Process Builder", href: "/builder",        category: "Pages" },
  { id: "nav-company",       label: "Company",         href: "/company",        category: "Pages" },
  { id: "nav-users",         label: "Users",           href: "/users",          category: "Pages" },
  { id: "nav-settings",      label: "Settings",        href: "/settings",       category: "Pages" },
  { id: "nav-activity-logs", label: "Activity Logs",   href: "/activity-logs",  category: "Pages" },
  { id: "nav-reports",       label: "Reports",         href: "/reports",        category: "Pages" },
];

// ─── Category metadata ───────────────────────────────────────────────────────
const CATEGORY_META = {
  Pages:     { icon: FiLayout,  color: "text-blue-500",   bg: "bg-blue-50"   },
  Processes: { icon: FiLayers,  color: "text-cyan-600",   bg: "bg-cyan-50"   },
  Templates: { icon: FiLayout,  color: "text-teal-600",   bg: "bg-teal-50"   },
  Users:     { icon: FiUsers,   color: "text-violet-500", bg: "bg-violet-50" },
};

// ─── Debounce hook ───────────────────────────────────────────────────────────
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function CommandSearch() {
  const router   = useRouter();
  const [query,   setQuery]   = useState("");
  const [isOpen,  setIsOpen]  = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [cursor,  setCursor]  = useState(-1);

  const inputRef     = useRef(null);
  const containerRef = useRef(null);
  const listRef      = useRef(null);

  const debouncedQuery = useDebounce(query.trim(), 300);

  // ── Search across all entities in parallel ─────────────────────────────
  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const q = debouncedQuery;

    Promise.all([
      processAPI.getWorkspaceProcesses({ search: q, limit: 5 }),
      templateAPI.listTemplates({ search: q, limit: 5 }),
      userAPI.getWorkspaceUsers({ search: q, limit: 5 }),
    ])
      .then(([procRes, tplRes, userRes]) => {
        if (cancelled) return;

        const items = [];

        (procRes.data || []).forEach((p) =>
          items.push({
            id:       `proc-${p._id || p.id}`,
            label:    p.name || "Untitled Process",
            sub:      p.category || p.status || "",
            href:     `/processes/${p._id || p.id}`,
            category: "Processes",
          })
        );

        (tplRes.data || []).forEach((t) =>
          items.push({
            id:       `tpl-${t._id || t.id}`,
            label:    t.name || "Untitled Template",
            sub:      t.category || t.status || "",
            href:     `/templates/${t._id || t.id}`,
            category: "Templates",
          })
        );

        (userRes.users || []).forEach((u) =>
          items.push({
            id:       `usr-${u._id || u.id}`,
            label:    u.name || u.email || "Unknown User",
            sub:      u.role || u.email || "",
            href:     `/users`,
            category: "Users",
          })
        );

        setResults(items);
        setCursor(-1);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError("Search failed. Please try again.");
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [debouncedQuery]);

  // ── Filter nav pages client-side (instant, no API needed) ──────────────
  const navMatches = useMemo(() => {
    if (!debouncedQuery) return NAV_PAGES;
    const q = debouncedQuery.toLowerCase();
    return NAV_PAGES.filter((p) => p.label.toLowerCase().includes(q));
  }, [debouncedQuery]);

  // ── Build flat list: nav pages first, then API results ─────────────────
  const allItems = useMemo(() => {
    if (!debouncedQuery) return navMatches;
    return [...navMatches, ...results];
  }, [debouncedQuery, navMatches, results]);

  // ── Group items by category ─────────────────────────────────────────────
  const grouped = useMemo(() => {
    const map = new Map();
    allItems.forEach((item) => {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category).push(item);
    });
    return map;
  }, [allItems]);

  // ── Navigate to result ──────────────────────────────────────────────────
  const navigate = useCallback((href) => {
    setIsOpen(false);
    setQuery("");
    router.push(href);
  }, [router]);

  // ── Keyboard handler ────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, allItems.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter" && cursor >= 0 && allItems[cursor]) {
      e.preventDefault();
      navigate(allItems[cursor].href);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setQuery("");
      inputRef.current?.blur();
    }
  }, [isOpen, cursor, allItems, navigate]);

  // Scroll active item into view
  useEffect(() => {
    if (cursor < 0 || !listRef.current) return;
    const active = listRef.current.querySelector("[data-active='true']");
    active?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  // Global Cmd/Ctrl+K shortcut
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Build flat index for keyboard cursor mapping
  const flatIndex = useMemo(() => {
    const idx = [];
    grouped.forEach((items) => items.forEach((item) => idx.push(item.id)));
    return idx;
  }, [grouped]);

  const showDropdown = isOpen && (debouncedQuery || !debouncedQuery);

  return (
    <div ref={containerRef} className="relative w-full max-w-md" onKeyDown={handleKeyDown}>
      {/* ── Input ──────────────────────────────────────────────────────────── */}
      <div className="relative">
        <FiSearch
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-faint)]"
          size={16}
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          className="app-focus h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] pl-10 pr-10 text-sm text-[var(--color-text)] placeholder:text-[var(--color-muted)]"
          placeholder="Search Command Center…"
          aria-label="Global search"
          aria-haspopup="listbox"
          aria-expanded={showDropdown}
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
          {loading && (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)]" />
          )}
          {query && !loading && (
            <button
              type="button"
              onClick={() => { setQuery(""); setIsOpen(false); inputRef.current?.focus(); }}
              className="text-[var(--color-faint)] hover:text-[var(--color-muted)] transition-colors"
              aria-label="Clear search"
            >
              <FiX size={14} />
            </button>
          )}
          {!query && (
            <kbd className="hidden rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-faint)] sm:inline">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* ── Dropdown ───────────────────────────────────────────────────────── */}
      {showDropdown && (
        <div
          className="absolute left-0 right-0 top-full z-[500] mt-2 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-popover)]"
          role="listbox"
          aria-label="Search results"
        >
          {/* Error state */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-red-500">
              <FiAlertCircle size={14} />
              {error}
            </div>
          )}

          {/* Empty query — show all nav pages as quick links */}
          {!debouncedQuery && !error && (
            <div ref={listRef} className="max-h-[360px] overflow-y-auto py-2">
              <div className="px-3 pb-1 pt-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-faint)]">Quick Navigation</p>
              </div>
              {NAV_PAGES.map((item, i) => {
                const meta = CATEGORY_META.Pages;
                const Icon = meta.icon;
                const isActive = i === cursor;
                return (
                  <button
                    key={item.id}
                    type="button"
                    data-active={isActive}
                    onClick={() => navigate(item.href)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                      isActive
                        ? "bg-[var(--color-surface-hover)] text-[var(--color-primary)]"
                        : "text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
                    }`}
                  >
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${meta.bg} ${meta.color}`}>
                      <Icon size={13} />
                    </span>
                    <span className="flex-1 font-medium">{item.label}</span>
                    <FiArrowRight size={12} className="text-[var(--color-faint)]" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Query results */}
          {debouncedQuery && !error && (
            <div ref={listRef} className="max-h-[420px] overflow-y-auto py-2">
              {allItems.length === 0 && !loading && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm font-semibold text-[var(--color-muted)]">No results for &ldquo;{debouncedQuery}&rdquo;</p>
                  <p className="mt-1 text-xs text-[var(--color-faint)]">Try a different keyword</p>
                </div>
              )}

              {Array.from(grouped.entries()).map(([category, items]) => {
                const meta = CATEGORY_META[category] || CATEGORY_META.Pages;
                const CatIcon = meta.icon;
                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 px-3 pb-1 pt-3">
                      <CatIcon size={11} className={meta.color} />
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${meta.color}`}>
                        {category}
                      </p>
                    </div>
                    {items.map((item) => {
                      const globalIdx = flatIndex.indexOf(item.id);
                      const isActive  = globalIdx === cursor;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          data-active={isActive}
                          onClick={() => navigate(item.href)}
                          className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                            isActive
                              ? "bg-[var(--color-surface-hover)] text-[var(--color-primary)]"
                              : "text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]"
                          }`}
                        >
                          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${meta.bg} ${meta.color}`}>
                            <CatIcon size={13} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">{item.label}</span>
                            {item.sub && (
                              <span className="block truncate text-[11px] text-[var(--color-muted)] capitalize">{item.sub}</span>
                            )}
                          </span>
                          <FiArrowRight size={12} className="shrink-0 text-[var(--color-faint)]" />
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-2">
            <div className="flex items-center gap-4 text-[10px] text-[var(--color-faint)]">
              <span><kbd className="font-mono">↑↓</kbd> navigate</span>
              <span><kbd className="font-mono">↵</kbd> open</span>
              <span><kbd className="font-mono">Esc</kbd> close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
