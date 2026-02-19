"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { toast } from "sonner"
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  Trash2,
  Pencil,
  Check,
  Clock,
  Volume2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
import { cn } from "@/lib/utils"
import {
  addVoiceNote,
  removeVoiceNote,
  updateVoiceTranscription,
} from "@/lib/store"
import type { VoiceNote } from "@/lib/types"

interface VoiceRecorderProps {
  inspectionId: string
  voiceNotes: VoiceNote[]
  campo: string
  campoLabel: string
  onUpdated: () => void
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function VoiceRecorder({
  inspectionId,
  voiceNotes,
  campo,
  campoLabel,
  onUpdated,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [playProgress, setPlayProgress] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTranscription, setEditTranscription] = useState("")
  const [isSupported, setIsSupported] = useState(true)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<ReturnType<typeof setInterval>>()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const playTimerRef = useRef<ReturnType<typeof setInterval>>()

  const fieldNotes = voiceNotes.filter((n) => n.campo === campo)

  useEffect(() => {
    setIsSupported(
      typeof window !== "undefined" &&
        "mediaDevices" in navigator &&
        "MediaRecorder" in window
    )
  }, [])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4",
      })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType,
        })

        // Convert blob to data URL
        const reader = new FileReader()
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string
          addVoiceNote(inspectionId, {
            dataUrl,
            duracao: recordingDuration,
            transcricao: "",
            campo,
          })
          toast.success("Nota de voz gravada")
          onUpdated()
        }
        reader.readAsDataURL(blob)

        // Stop all tracks
        stream.getTracks().forEach((t) => t.stop())
      }

      mediaRecorder.start(100)
      setIsRecording(true)
      setRecordingDuration(0)

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1)
      }, 1000)
    } catch {
      toast.error("Permissão de microfone negada")
    }
  }, [inspectionId, campo, recordingDuration, onUpdated])

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop()
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
    }
    setIsRecording(false)
  }

  function playNote(note: VoiceNote) {
    if (playingId === note.id) {
      // Pause
      audioRef.current?.pause()
      setPlayingId(null)
      if (playTimerRef.current) clearInterval(playTimerRef.current)
      return
    }

    // Stop previous
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    if (playTimerRef.current) clearInterval(playTimerRef.current)

    const audio = new Audio(note.dataUrl)
    audioRef.current = audio
    setPlayingId(note.id)
    setPlayProgress(0)

    audio.onended = () => {
      setPlayingId(null)
      setPlayProgress(0)
      if (playTimerRef.current) clearInterval(playTimerRef.current)
    }

    audio.play()

    playTimerRef.current = setInterval(() => {
      if (audio.duration) {
        setPlayProgress((audio.currentTime / audio.duration) * 100)
      }
    }, 100)
  }

  function handleRemove(noteId: string) {
    if (playingId === noteId) {
      audioRef.current?.pause()
      setPlayingId(null)
    }
    removeVoiceNote(inspectionId, noteId)
    toast.success("Nota de voz removida")
    onUpdated()
  }

  function startEditTranscription(note: VoiceNote) {
    setEditingId(note.id)
    setEditTranscription(note.transcricao)
  }

  function saveTranscription(noteId: string) {
    updateVoiceTranscription(inspectionId, noteId, editTranscription.trim())
    setEditingId(null)
    setEditTranscription("")
    toast.success("Transcricao salva")
    onUpdated()
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop()
      }
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
      if (playTimerRef.current) clearInterval(playTimerRef.current)
      audioRef.current?.pause()
    }
  }, [])

  if (!isSupported) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">
              Notas de Voz - {campoLabel}
            </CardTitle>
          </div>
          {fieldNotes.length > 0 && (
            <Badge variant="outline" className="bg-transparent text-xs">
              {fieldNotes.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Record button */}
        {isRecording ? (
          <div className="flex items-center gap-4 rounded-lg border-2 border-destructive/30 bg-destructive/5 p-4">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-destructive/20" />
              <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-destructive">
                <Mic className="h-5 w-5 text-destructive-foreground" />
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                Gravando...
              </p>
              <p className="text-lg font-bold text-destructive tabular-nums">
                {formatDuration(recordingDuration)}
              </p>
            </div>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-12 w-12 rounded-full"
              onClick={stopRecording}
              aria-label="Parar gravacao"
            >
              <Square className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            className="h-14 gap-3 bg-transparent"
            onClick={startRecording}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Mic className="h-4 w-4 text-primary" />
            </span>
            <span className="text-sm font-medium">Gravar nota de voz</span>
          </Button>
        )}

        {/* Voice notes list */}
        {fieldNotes.length > 0 && (
          <div className="flex flex-col gap-3">
            {fieldNotes.map((note, idx) => (
              <div
                key={note.id}
                className="rounded-lg border border-border p-3 flex flex-col gap-3"
              >
                {/* Player row */}
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                    onClick={() => playNote(note)}
                    aria-label={playingId === note.id ? "Pausar" : "Reproduzir"}
                  >
                    {playingId === note.id ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4 ml-0.5" />
                    )}
                  </Button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">
                        Nota {idx + 1}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDuration(note.duracao)}
                      </span>
                    </div>
                    <Progress
                      value={playingId === note.id ? playProgress : 0}
                      className="h-1.5 mt-1.5"
                    />
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remover</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Remover nota de voz?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemove(note.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {/* Transcription */}
                <div className="flex flex-col gap-1.5">
                  {editingId === note.id ? (
                    <div className="flex flex-col gap-2">
                      <Textarea
                        value={editTranscription}
                        onChange={(e) =>
                          setEditTranscription(e.target.value)
                        }
                        placeholder="Digite a transcricao do audio..."
                        rows={3}
                        className="text-sm resize-none"
                        autoFocus
                      />
                      <div className="flex gap-2 justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => setEditingId(null)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => saveTranscription(note.id)}
                        >
                          <Check className="mr-1 h-3 w-3" />
                          Salvar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="flex items-start gap-2 text-left rounded-md p-2 -m-2 hover:bg-muted/50 transition-colors"
                      onClick={() => startEditTranscription(note)}
                    >
                      <Pencil className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                      <span className="text-xs text-muted-foreground leading-relaxed">
                        {note.transcricao || "Toque para adicionar transcricao..."}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {fieldNotes.length === 0 && !isRecording && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Grave notas de voz para documentar observacoes
          </p>
        )}
      </CardContent>
    </Card>
  )
}
