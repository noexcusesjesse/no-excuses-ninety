import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { PreviewBanner } from "@/components/preview-banner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LoadLine 30",
  description:
    "Daily check-in, HOME environments, and tracking for LoadLine 30.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <PreviewBanner />
        {children}
      </body>
    </html>
  );
}