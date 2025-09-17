import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter'
});

export const metadata: Metadata = {
  title: "Tasoko Package Management System",
  description: "Complete package management solution with Tasoko integration",
  keywords: "package management, shipping, logistics, tasoko, tracking",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <div id="root" className="min-h-screen bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  );
}