"use client"

import React from "react"

import { useRef, useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { Eraser, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { updateParticipantSignature } from "@/lib/store"

interface SignaturePadProps {
  inspectionId: string
  participantId: string
  participantName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

export function SignaturePad({
  inspectionId,
  participantId,
  participantName,
  open,
  onOpenChange,
  onSaved,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasContent, setHasContent] = useState(false)

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return
    const dpr = window.devicePixelRatio || 1
    const rect = parent.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = 200 * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = "200px"
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, rect.width, 200)
    ctx.strokeStyle = "#1a1a2e"
    ctx.lineWidth = 2.5
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    setHasContent(false)
  }, [])

  useEffect(() => {
    if (open) {
      // Delay to wait for dialog to render
      const timer = setTimeout(initCanvas, 100)
      return () => clearTimeout(timer)
    }
  }, [open, initCanvas])

  function getPos(e: React.TouchEvent | React.MouseEvent) {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    }
  }

  function startDrawing(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!ctx) return
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    setIsDrawing(true)
    setHasContent(true)
  }

  function draw(e: React.TouchEvent | React.MouseEvent) {
    e.preventDefault()
    if (!isDrawing) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!ctx) return
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  function stopDrawing() {
    setIsDrawing(false)
  }

  function clearCanvas() {
    initCanvas()
  }

  function saveSignature() {
    const canvas = canvasRef.current
    if (!canvas || !hasContent) {
      toast.error("Desenhe a assinatura antes de salvar")
      return
    }
    const dataUrl = canvas.toDataURL("image/png")
    updateParticipantSignature(inspectionId, participantId, dataUrl)
    toast.success("Assinatura salva com sucesso!")
    onOpenChange(false)
    onSaved()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assinatura - {participantName}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Desenhe a assinatura na area abaixo usando o dedo ou caneta.
          </p>
          <div className="rounded-lg border-2 border-dashed border-border overflow-hidden bg-card">
            <canvas
              ref={canvasRef}
              className="w-full touch-none cursor-crosshair"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={clearCanvas}
              className="flex-1 h-12 text-base bg-transparent"
            >
              <Eraser className="mr-2 h-4 w-4" />
              Limpar
            </Button>
            <Button
              onClick={saveSignature}
              disabled={!hasContent}
              className="flex-1 h-12 text-base font-semibold"
            >
              <Check className="mr-2 h-4 w-4" />
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
