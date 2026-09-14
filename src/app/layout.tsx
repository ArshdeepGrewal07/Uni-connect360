import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";

const grotesk = localFont({
  src: "./fonts/space-grotesk.woff2",
  weight: "300 700",
  display: "swap",
  variable: "--font-space-grotesk",
});

const manrope = localFont({
  src: "./fonts/manrope.woff2",
  weight: "200 800",
  display: "swap",
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Quad — your campus, verified",
  description:
    "The verified-student campus companion: buddy finder, event meetups, campus map and the 48-hour safe chat system.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${grotesk.variable} ${manrope.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
