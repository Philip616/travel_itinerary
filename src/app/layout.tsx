import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Travel Planner | 旅遊行程協同規劃",
  description: "輕量、省流量、多人即時協同旅遊規劃 PWA",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TravelPlanner",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" className="h-full antialiased font-sans">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-100">
        {children}
      </body>
    </html>
  );
}
