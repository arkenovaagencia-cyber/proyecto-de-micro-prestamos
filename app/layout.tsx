import type { Metadata } from "next";
import { Inter, Fraunces, Space_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });
const mono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Plataforma de Micropréstamos",
  description: "Solicita, gestiona y da seguimiento a préstamos desde un solo lugar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${fraunces.variable} ${mono.variable} font-sans bg-black text-gray-900`}>
        {children}
      </body>
    </html>
  );
}
