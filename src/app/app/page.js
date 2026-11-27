"use client";

/**
 * Launch screen for the installed desktop / home-screen app.
 *
 * The manifest opens here rather than at /login, because the login page does
 * not forward someone who is already signed in — the installed app would have
 * asked for a password every time it opened. This sends a saved session
 * straight to the right home, and anyone else to sign in. An expired token is
 * handled by the API layer's refresh-on-401, as it is for a reopened tab.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { homeRouteFor } from "../utils/homeRoute";

const readJson = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export default function AppLauncher() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
    const user = token ? readJson("user") : null;
    router.replace(homeRouteFor(user, readJson("workspace")));
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#01114c]">
      <img src="/icon-192.png" alt="Iris Monde" className="h-16 w-16 animate-pulse rounded-[7px] object-contain" />
    </div>
  );
}
