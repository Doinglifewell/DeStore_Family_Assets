import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BRAND } from "@/lib/config";
import { Tracking } from "@/components/Tracking";

/* Inter, self-hosted by Next at build time: no request to Google Fonts from
   the visitor's phone, and no shift in the page when it arrives. */
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });

export const metadata: Metadata = {
  title: `${BRAND} · Towing in Darwin`,
  description: "Broken down in Darwin? Fast local towing. Local operators, price agreed up front. Call us and we'll get a truck to you.",
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF8F2" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1320" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" className={inter.variable}>
      <body>
        {children}
        <Tracking />
      </body>
    </html>
  );
}
