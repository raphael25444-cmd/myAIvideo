import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VISIONAI — Your Imagination. Powered by AI.",
  description:
    "VISIONAI is a free, no-signup AI video generator. Turn text, images and videos into stunning AI-generated videos in seconds.",
  keywords: [
    "AI video generator",
    "text to video",
    "image to video",
    "AI video",
    "VisionAI",
    "no login AI",
  ],
  openGraph: {
    title: "VISIONAI — Your Imagination. Powered by AI.",
    description:
      "Generate stunning AI videos instantly. No account, no API keys, no setup.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${grotesk.variable}`}>
      <body className="bg-bg text-ink antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
