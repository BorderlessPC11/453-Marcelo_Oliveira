import React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import { BottomNav } from "@/components/bottom-nav"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "Vistorias App",
  description: "Aplicativo para vistorias tecnicas em campo",
}

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="mx-auto min-h-screen max-w-lg bg-background pb-24">
          {children}
        </div>
        <BottomNav />
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  )
}
