"use client"

import { useEffect, useState } from "react"
import { Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    // Detectar iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIos(ios)

    // Listener para evento beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === "accepted") {
        console.log("App instalado com sucesso!")
      }
      
      setDeferredPrompt(null)
      setShowPrompt(false)
    } catch (error) {
      console.error("Erro ao instalar:", error)
    }
  }

  if (!showPrompt && !isIos) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white px-4 py-3 flex items-center justify-between gap-3 max-w-lg mx-auto">
      <div className="flex items-center gap-2 flex-1">
        <Download className="h-5 w-5 shrink-0" />
        <div className="flex-1 min-w-0">
          {isIos ? (
            <p className="text-sm">
              Toque em <strong>Compartilhar</strong> → <strong>Na tela inicial</strong> para instalar
            </p>
          ) : (
            <p className="text-sm">Instale nosso app para melhor experiência</p>
          )}
        </div>
      </div>

      {!isIos && deferredPrompt && (
        <Button
          size="sm"
          variant="secondary"
          onClick={handleInstall}
          className="shrink-0 h-8 text-xs"
        >
          Instalar
        </Button>
      )}

      <button
        onClick={() => setShowPrompt(false)}
        className="shrink-0 text-white hover:opacity-80 transition-opacity"
        aria-label="Fechar"
      >
        <X className="h-5 w-5" />
      </button>
    </div>
  )
}
