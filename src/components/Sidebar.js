"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiLogOut, FiX } from "react-icons/fi";
import { Badge } from "./Badge";
import { Button } from "./Button";
import workspaceAPI from "../app/api/workspaceAPI";

const formatGb = (bytes) => (bytes / (1024 ** 3)).toFixed(1);

const groupNavigation = (navigation) => {
  const management = new Set(["Users", "Settings", "Activity Logs", "Reports"]);
  return navigation.reduce(
    (groups, item) => {
      groups[management.has(item.name) ? "management" : "main"].push(item);
      return groups;
    },
    { main: [], management: [] },
  );
};

export const Sidebar = ({
  isOpen,
  onClose,
  navigation = [],
  workspace,

}) => {
  const groups = groupNavigation(navigation);
  const [storage, setStorage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    workspaceAPI
      .getWorkspaceOverview()
      .then((res) => {
        if (!cancelled && res?.storage) setStorage(res.storage);
      })
      .catch(() => {}); // sidebar chrome — fail silently, keep prior state
    return () => {
      cancelled = true;
    };
  }, []);

  const renderItem = (item) => {
    const Icon = item.icon;
    return (
      <Link
        key={item.name}
        href={item.href || "#"}
        onClick={onClose}
        className={`group flex h-10 w-full min-w-0 items-center gap-3 border-r-2 px-4 text-sm font-semibold transition ${
          item.current
            ? "border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]"
            : "border-transparent text-[var(--color-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
        }`}
      >
        {Icon && <Icon size={17} className="shrink-0" />}
        <span className="truncate">{item.name}</span>
      </Link>
    );
  };

  return (
    <>
      {isOpen && (
        <button
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          onClick={onClose}
          type="button"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-64 max-w-64 flex-col overflow-hidden border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-[var(--color-border)] px-4">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
            <img src="/logo.png" alt="Iris Monde" className="h-9 w-9 shrink-0 rounded-[7px] object-contain" />
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[var(--color-text)]">
                Iris Monde
              </p>
              <p className="truncate text-[10px] font-semibold uppercase text-[var(--color-muted)]">
                {workspace?.name || "Workspace"}
              </p>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 lg:hidden"
            aria-label="Close navigation"
          >
            <FiX size={18} />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4">
          <div className="mb-5">
            <p className="mb-2 px-4 text-[10px] font-bold uppercase text-[var(--color-muted)]">
              Main Menu
            </p>
            <div className="space-y-1 overflow-x-hidden">{groups.main.map(renderItem)}</div>
          </div>

          {groups.management.length > 0 && (
            <div>
              <p className="mb-2 px-4 text-[10px] font-bold uppercase text-[var(--color-muted)]">
                Management
              </p>
              <div className="space-y-1 overflow-x-hidden">{groups.management.map(renderItem)}</div>
            </div>
          )}
        </nav>

        {storage && (
          <div className="space-y-4 border-t border-[var(--color-border)] p-4">
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-bold text-blue-950">Storage Usage</p>
                <Badge size="sm" variant="primary">
                  {storage.percent}%
                </Badge>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-blue-100">
                <div
                  className="h-full rounded-full bg-[var(--color-primary)]"
                  style={{ width: `${Math.max(storage.percent, storage.usedBytes > 0 ? 2 : 0)}%` }}
                />
              </div>
              <p className="mt-2 text-[10px] font-medium text-blue-700">
                {formatGb(storage.usedBytes)} GB of {formatGb(storage.limitBytes)} GB used
              </p>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default Sidebar;
