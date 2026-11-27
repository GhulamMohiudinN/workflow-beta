import { io } from "socket.io-client";

// Next.js only exposes NEXT_PUBLIC_* vars to browser code — BACKEND_URL alone
// is server-only and silently falls back to localhost here otherwise.
const backendUrl = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:5000"
).replace(/\/api\/v1$/, "");

let socket = null;

/**
 * The live-update connection, opened on first use and only when signed in.
 *
 * This used to connect the moment any page loaded, with no credentials, and
 * retry forever. On Vercel the backend cannot hold a socket at all, so every
 * page kept hammering a server that would never answer. Now it presents the
 * login token (the server refuses connections without one), gives up after a
 * few attempts, and the notification bell falls back to polling.
 */
export function getSocket() {
  if (typeof window === "undefined") return null;
  if (socket) return socket;

  const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
  if (!token) return null;

  socket = io(backendUrl, {
    auth: { token },
    transports: ["websocket"],
    reconnectionAttempts: 3,
  });
  // A refused or unreachable socket is expected on serverless hosting.
  socket.on("connect_error", () => {});
  return socket;
}

/** Closes the connection — on sign-out, so the next account gets a fresh one. */
export function disconnectSocket() {
  if (socket) socket.disconnect();
  socket = null;
}
