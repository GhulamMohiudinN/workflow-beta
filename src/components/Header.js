"use client";

import { useState } from "react";
import {
  FiBell,
  FiChevronDown,
  FiHelpCircle,
  FiLogOut,
  FiMenu,
  FiSettings,
  FiUser,
} from "react-icons/fi";
import { Avatar } from "./Badge";
import { Button } from "./Button";
import CommandSearch from "./CommandSearch";

export const Header = ({
  onMenuClick,
  user,
  workspace,
  onLogout,
  notifications = [],
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const displayName = user?.name || user?.email || "Alex Rivera";

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="h-9 w-9 p-0 lg:hidden"
            aria-label="Open navigation"
          >
            <FiMenu size={19} />
          </Button>

          <div className="relative hidden w-full max-w-md md:block">
            <CommandSearch />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen((value) => !value)}
              className="app-focus relative flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
              aria-label="Notifications"
            >
              <FiBell size={17} />
              {notifications.length > 0 && (
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--color-danger)]" />
              )}
            </button>

            {notificationsOpen && (
              <div className="app-card absolute right-0 mt-2 w-80 overflow-hidden shadow-[var(--shadow-popover)]">
                <div className="border-b border-[var(--color-border)] px-4 py-3">
                  <h3 className="text-sm font-bold">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification, index) => (
                      <div
                        key={`${notification.message}-${index}`}
                        className="border-b border-[var(--color-border)] px-4 py-3 last:border-0"
                      >
                        <p className="text-sm font-medium text-[var(--color-text)]">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-xs text-[var(--color-muted)]">
                          {notification.time}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="px-4 py-8 text-center text-sm text-[var(--color-muted)]">
                      No notifications
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            className="app-focus hidden h-9 w-9 items-center justify-center rounded-lg text-[var(--color-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] sm:flex"
            aria-label="Help"
          >
            <FiHelpCircle size={17} />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen((value) => !value)}
              className="app-focus flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-[var(--color-surface-hover)]"
            >
              <div className="hidden text-right sm:block">
                <p className="max-w-32 truncate text-xs font-bold text-[var(--color-text)]">
                  {displayName}
                </p>
                <p className="text-[10px] font-medium text-[var(--color-muted)]">
                  {workspace?.name || "Administrator"}
                </p>
              </div>
              <Avatar src={user?.profilePicture} name={displayName} size="sm" />
              <FiChevronDown size={14} className="text-[var(--color-muted)]" />
            </button>

            {userMenuOpen && (
              <div className="app-card absolute right-0 mt-2 w-56 overflow-hidden shadow-[var(--shadow-popover)]">
                <div className="border-b border-[var(--color-border)] px-4 py-3">
                  <p className="truncate text-sm font-bold">{displayName}</p>
                  <p className="truncate text-xs text-[var(--color-muted)]">
                    {user?.email || user?.role || "Workspace user"}
                  </p>
                </div>
                <button className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[var(--color-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]">
                  <FiUser size={15} /> Profile
                </button>
                <button className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[var(--color-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]">
                  <FiSettings size={15} /> Settings
                </button>
                <button
                  onClick={onLogout}
                  className="flex w-full items-center gap-2 border-t border-[var(--color-border)] px-4 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <FiLogOut size={15} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
