import type { Metadata } from "next";
import { Inter, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Medivault - Your Secure Health Vault",
  description: "Secure, fast, and modern medical record management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${outfit.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FBFBFF] font-sans overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-900">
        <Navbar />
        <main className="flex-1 flex flex-col pt-20">
          {children}
        </main>
      </body>
    </html>
  );
}

