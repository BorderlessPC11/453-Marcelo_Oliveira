"use client"

import React from "react"

import { useState, useRef, useCallback } from "react"
import { toast } from "sonner"
import {
  Camera,
  ImagePlus,
  Trash2,
  X,
  Pencil,
  Check,
  ZoomIn,
  ImageIcon,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { addPhoto, removePhoto, updatePhotoCaption } from "@/lib/store"
import type { InspectionPhoto } from "@/lib/types"

interface PhotoGalleryProps {
  inspectionId: string
  photos: InspectionPhoto[]
  onUpdated: () => void
}

export function PhotoGallery({
  inspectionId,
  photos,
  onUpdated,
}: PhotoGalleryProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [previewPhoto, setPreviewPhoto] = useState<InspectionPhoto | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editCaption, setEditCaption] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const processFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Selecione apenas imagens")
        return
      }

      // Max 2MB for localStorage
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Imagem muito grande (max 2MB)")
        return
      }

      setIsProcessing(true)
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string

        // Resize if needed
        const img = new window.Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          let { width, height } = img
          const maxDim = 1200

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width)
              width = maxDim
            } else {
              width = Math.round((width * maxDim) / height)
              height = maxDim
            }
          }

          const canvas = document.createElement("canvas")
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext("2d")
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height)
            const resizedDataUrl = canvas.toDataURL("image/jpeg", 0.8)
            addPhoto(inspectionId, {
              dataUrl: resizedDataUrl,
              legenda: "",
              campo: "geral",
            })
            toast.success("Foto adicionada")
            onUpdated()
          }
          setIsProcessing(false)
        }
        img.onerror = () => {
          // Fallback: use original
          addPhoto(inspectionId, {
            dataUrl,
            legenda: "",
            campo: "geral",
          })
          toast.success("Foto adicionada")
          onUpdated()
          setIsProcessing(false)
        }
        img.src = dataUrl
      }
      reader.onerror = () => {
        toast.error("Erro ao ler arquivo")
        setIsProcessing(false)
      }
      reader.readAsDataURL(file)
    },
    [inspectionId, onUpdated]
  )

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(processFile)
    e.target.value = ""
  }

  function handleRemove(photoId: string) {
    removePhoto(inspectionId, photoId)
    toast.success("Foto removida")
    onUpdated()
  }

  function startEditCaption(photo: InspectionPhoto) {
    setEditingId(photo.id)
    setEditCaption(photo.legenda)
  }

  function saveCaption(photoId: string) {
    updatePhotoCaption(inspectionId, photoId, editCaption.trim())
    setEditingId(null)
    setEditCaption("")
    toast.success("Legenda atualizada")
    onUpdated()
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">
                Fotos ({photos.length})
              </CardTitle>
            </div>
            {photos.length > 0 && (
              <Badge variant="outline" className="bg-transparent text-xs">
                {photos.length} foto{photos.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Upload buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-14 flex-col gap-1 bg-transparent"
              onClick={() => cameraInputRef.current?.click()}
              disabled={isProcessing}
            >
              <Camera className="h-5 w-5" />
              <span className="text-xs">Camera</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-14 flex-col gap-1 bg-transparent"
              onClick={() => galleryInputRef.current?.click()}
              disabled={isProcessing}
            >
              <ImagePlus className="h-5 w-5" />
              <span className="text-xs">Galeria</span>
            </Button>
          </div>

          {/* Hidden file inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
            aria-label="Capturar foto com camera"
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
            aria-label="Selecionar fotos da galeria"
          />

          {/* Processing indicator */}
          {isProcessing && (
            <div className="flex items-center gap-3 rounded-lg border border-border p-3 bg-muted/50">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm text-muted-foreground">
                Processando imagem...
              </span>
            </div>
          )}

          {/* Photo grid */}
          {photos.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative rounded-lg border border-border overflow-hidden bg-muted"
                >
                  {/* Image */}
                  <button
                    type="button"
                    className="block w-full aspect-square"
                    onClick={() => setPreviewPhoto(photo)}
                    aria-label={`Ver foto${photo.legenda ? `: ${photo.legenda}` : ""}`}
                  >
                    <img
                      src={photo.dataUrl || "/placeholder.svg"}
                      alt={photo.legenda || "Foto da vistoria"}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-foreground/0 opacity-0 group-hover:bg-foreground/10 group-hover:opacity-100 transition-all">
                      <ZoomIn className="h-6 w-6 text-card" />
                    </span>
                  </button>

                  {/* Actions overlay */}
                  <div className="absolute top-1.5 right-1.5 flex gap-1">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-7 w-7 bg-card/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Remover foto</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover foto?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acao nao pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleRemove(photo.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  {/* Caption */}
                  <div className="p-2">
                    {editingId === photo.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={editCaption}
                          onChange={(e) => setEditCaption(e.target.value)}
                          placeholder="Legenda..."
                          className="h-7 text-xs"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveCaption(photo.id)
                            if (e.key === "Escape") setEditingId(null)
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 shrink-0"
                          onClick={() => saveCaption(photo.id)}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="flex items-center gap-1 w-full text-left"
                        onClick={() => startEditCaption(photo)}
                      >
                        <span className="text-xs text-muted-foreground truncate flex-1">
                          {photo.legenda || "Adicionar legenda..."}
                        </span>
                        <Pencil className="h-3 w-3 text-muted-foreground shrink-0" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {photos.length === 0 && !isProcessing && (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Camera className="h-5 w-5 text-muted-foreground" />
              </span>
              <p className="text-sm text-muted-foreground">
                Nenhuma foto registrada
              </p>
              <p className="text-xs text-muted-foreground">
                Use a camera ou selecione da galeria
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog
        open={!!previewPhoto}
        onOpenChange={() => setPreviewPhoto(null)}
      >
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-sm">
              {previewPhoto?.legenda || "Foto da vistoria"}
            </DialogTitle>
          </DialogHeader>
          {previewPhoto && (
            <div className="px-4 pb-4">
              <img
                src={previewPhoto.dataUrl || "/placeholder.svg"}
                alt={previewPhoto.legenda || "Foto da vistoria"}
                className="w-full rounded-lg"
              />
              {previewPhoto.legenda && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {previewPhoto.legenda}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
