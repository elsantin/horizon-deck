import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Horizon",
  description: "Análisis estratégico de empleos e IA Conversacional",
};

import ConvexClientProvider from "@/components/ConvexClientProvider";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={inter.className}>
        <ConvexClientProvider>
          {children}
          <Toaster theme="dark" position="bottom-right" />
        </ConvexClientProvider>
      </body>
    </html>
  );
}
