// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import 'bootstrap/dist/css/bootstrap.min.css';
import InstallBootstrap from "./components/installBootstrap";
import AuthHeader from "./components/AuthHeader"; // ← Separate client component

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Paperless Events",
  description: "Beautiful digital invitations with QR codes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <InstallBootstrap />
        
        {/* Client component handling auth UI */}
        <AuthHeader />

        <main>{children}</main>
      </body>
    </html>
  );
}