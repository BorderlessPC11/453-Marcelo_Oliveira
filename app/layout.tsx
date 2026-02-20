import React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "sonner"
import { BottomNav } from "@/components/bottom-nav"
import PWAInstaller from "@/components/pwa-installer"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "Parecer Técnico NR-15",
  description: "Aplicativo para preenchimento de Parecer Técnico Pericial de Insalubridade em condomínios",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Parecer Técnico NR-15",
  },
  formatDetection: {
    telephone: false,
  },
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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#2563eb" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Parecer NR-15" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <PWAInstaller />
        <div className="mx-auto min-h-screen max-w-lg bg-background pb-24">
          {children}
        </div>
        <BottomNav />
        <Toaster position="top-center" richColors closeButton />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/service-worker.js')
                    .then((reg) => console.log('Service Worker registrado'))
                    .catch((err) => console.log('Erro ao registrar SW:', err))
                })
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
