import { io } from "socket.io-client";

// Next.js only exposes NEXT_PUBLIC_* vars to browser code — BACKEND_URL alone
// is server-only and silently falls back to localhost here otherwise.
const backendUrl = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:5000"
).replace(/\/api\/v1$/, "");

export const socket = io(backendUrl, {
  autoConnect: true,
});
