// Web app manifest — what makes the workspace installable as a desktop or
// home-screen app. Served by Next at /manifest.webmanifest and linked from
// every page automatically.
export default function manifest() {
  return {
    id: "/",
    name: "Iris Monde Workspace",
    short_name: "Iris Monde",
    description: "Compliance reporting, evidence, approvals and contracts for your organisation.",
    // The launcher, not /login: it sends a saved session straight to the right
    // home (dashboard, member area or operator console), and anyone else to
    // sign in. /login itself would ask for a password on every launch.
    start_url: "/app",
    scope: "/",
    display: "standalone",
    background_color: "#01114c",
    theme_color: "#01114c",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
