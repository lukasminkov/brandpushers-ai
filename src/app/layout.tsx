import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/ToastContext";
import { ConfirmProvider } from "@/components/ui/ConfirmDialog";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BrandPushers — Supercharge Your Brand Idea",
  description: "We build, launch & scale your brand — starting on TikTok. Apply to our incubator today.",
  icons: { icon: "/logo.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>
          <ConfirmProvider>
            {children}
          </ConfirmProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
