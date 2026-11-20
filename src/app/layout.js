import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "./store/provider";
import { Toaster } from "../components/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Iris Monde",
  description: "Iris Monde Workspace",
  // The installable-app pieces. The manifest itself is app/manifest.js;
  // iOS reads these instead of it.
  icons: { apple: "/apple-touch-icon.png" },
  appleWebApp: { title: "Iris Monde", statusBarStyle: "default" },
};

// Colours the installed app's title bar to match the brand.
export const viewport = {
  themeColor: "#01114c",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`} suppressHydrationWarning>
        <ReduxProvider>
          {children}
          <Toaster />
        </ReduxProvider>
      </body>
    </html>
  );
}
