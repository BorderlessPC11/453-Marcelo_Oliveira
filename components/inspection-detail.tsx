"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { toast } from "sonner"
import Link from "next/link"
import {
  MapPin,
  Calendar,
  User,
  FileText,
  Users,
  Pen,
  Trash2,
  CheckCircle2,
  Clock,
  Building2,
  Mail,
  ImageIcon,
  AlertTriangle,
  ChevronRight,
  Activity,
  Beaker,
  Shield,
  Copy,
  History,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { StatusBadge } from "@/components/status-badge"
import { ParticipantForm } from "@/components/participant-form"
import { SignaturePad } from "@/components/signature-pad"
import { PhotoGallery } from "@/components/photo-gallery"
import { VoiceRecorder } from "@/components/voice-recorder"
import {
  getInspection,
  updateInspection,
  removeParticipant,
  duplicateInspection,
} from "@/lib/store"
import type { Inspection, InspectionStatus } from "@/lib/types"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface InspectionDetailProps {
  id: string
}

export function InspectionDetail({ id }: InspectionDetailProps) {
  const router = useRouter()
  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [mounted, setMounted] = useState(false)
  const [signaturePadOpen, setSignaturePadOpen] = useState(false)
  const [selectedParticipantId, setSelectedParticipantId] = useState("")
  const [selectedParticipantName, setSelectedParticipantName] = useState("")

  const reload = useCallback(() => {
    const data = getInspection(id)
    setInspection(data || null)
  }, [id])

  useEffect(() => {
    setMounted(true)
    reload()
  }, [reload])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!inspection) {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-20 text-center">
        <p className="text-lg font-medium text-foreground">Vistoria não encontrada</p>
        <Button onClick={() => router.push("/vistorias")}>Voltar para lista</Button>
      </div>
    )
  }

  function handleStatusChange(status: InspectionStatus) {
    updateInspection(id, { status })
    reload()
    toast.success("Status atualizado")
  }

  function handleRemoveParticipant(participantId: string) {
    removeParticipant(id, participantId)
    reload()
    toast.success("Participante removido")
  }

  function openSignaturePad(participantId: string, participantName: string) {
    setSelectedParticipantId(participantId)
    setSelectedParticipantName(participantName)
    setSignaturePadOpen(true)
  }

  function handleDuplicate() {
    const dup = duplicateInspection(id)
    if (dup) {
      toast.success("Vistoria duplicada com sucesso!")
      router.push(`/vistorias/${dup.id}`)
    } else {
      toast.error("Erro ao duplicar vistoria")
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      {/* Status & Info */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg">{inspection.titulo}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{inspection.tipo}</p>
            </div>
            <StatusBadge status={inspection.status} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-foreground">{inspection.endereco}</span>
          </div>
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-foreground">{inspection.responsavel}</span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-foreground">
              {format(new Date(inspection.dataVistoria + "T12:00:00"), "dd/MM/yyyy")}
            </span>
          </div>
          {inspection.observacoes && (
            <div className="flex items-start gap-3">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <span className="text-sm text-foreground">{inspection.observacoes}</span>
            </div>
          )}

          <Separator className="my-1" />

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">Alterar status</label>
            <Select
              value={inspection.status}
              onValueChange={(v) => handleStatusChange(v as InspectionStatus)}
            >
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rascunho" className="py-3">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Rascunho
                  </span>
                </SelectItem>
                <SelectItem value="em_andamento" className="py-3">
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Em andamento
                  </span>
                </SelectItem>
                <SelectItem value="concluida" className="py-3">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Concluída
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* NR-15 Assessment Access */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-4">
          <Link href={`/vistorias/${id}/nr15`} className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <AlertTriangle className="h-6 w-6 text-primary" />
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground">
                Avaliação NR-15
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Insalubridade - Riscos Físicos, Químicos, Biológicos
              </p>
              {inspection.avaliacoesNR15 && inspection.avaliacoesNR15.length > 0 && (() => {
                const avaliados = inspection.avaliacoesNR15.filter(
                  (a) => a.aplica !== null
                ).length
                const total = inspection.avaliacoesNR15.length
                const pct = Math.round((avaliados / total) * 100)
                return (
                  <div className="flex items-center gap-2 mt-2">
                    <Progress value={pct} className="h-1.5 flex-1" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {avaliados}/{total}
                    </span>
                  </div>
                )
              })()}
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
          </Link>
        </CardContent>
      </Card>

      {/* Photos */}
      <PhotoGallery
        inspectionId={id}
        photos={inspection.fotos || []}
        onUpdated={reload}
      />

      {/* Voice Notes */}
      <VoiceRecorder
        inspectionId={id}
        voiceNotes={inspection.notasVoz || []}
        campo="observacoes"
        campoLabel="Observacoes"
        onUpdated={reload}
      />

      {/* Participants */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">
              Participantes ({inspection.participantes.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {inspection.participantes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum participante adicionado
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {inspection.participantes.map((p) => (
                <div
                  key={p.id}
                  className="flex items-start gap-3 rounded-lg border border-border p-3"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {p.nome
                      .split(" ")
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{p.nome}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground truncate">
                        {p.cargo} - {p.empresa}
                      </p>
                    </div>
                    {p.email && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                      </div>
                    )}
                    {p.assinatura ? (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-1 text-xs font-medium text-accent">
                          <CheckCircle2 className="h-3 w-3" />
                          Assinado
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => openSignaturePad(p.id, p.nome)}
                        >
                          <Pen className="mr-1 h-3 w-3" />
                          Reassinar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 h-9 text-xs bg-transparent"
                        onClick={() => openSignaturePad(p.id, p.nome)}
                      >
                        <Pen className="mr-1 h-3 w-3" />
                        Coletar Assinatura
                      </Button>
                    )}
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remover participante</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover participante?</AlertDialogTitle>
                        <AlertDialogDescription>
                          {p.nome} sera removido desta vistoria. Esta acao nao pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemoveParticipant(p.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}

          <ParticipantForm inspectionId={id} onAdded={reload} />
        </CardContent>
      </Card>

      {/* Signatures Preview */}
      {inspection.participantes.some((p) => p.assinatura) && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Assinaturas Coletadas</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {inspection.participantes
              .filter((p) => p.assinatura)
              .map((p) => (
                <div key={p.id} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-medium text-foreground mb-2">{p.nome}</p>
                  <div className="rounded-md border border-border bg-card overflow-hidden">
                    <img
                      src={p.assinatura || "/placeholder.svg"}
                      alt={`Assinatura de ${p.nome}`}
                      className="w-full h-auto"
                    />
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      <SignaturePad
        inspectionId={id}
        participantId={selectedParticipantId}
        participantName={selectedParticipantName}
        open={signaturePadOpen}
        onOpenChange={setSignaturePadOpen}
        onSaved={reload}
      />

      {/* Actions */}
      <div className="grid grid-cols-3 gap-3">
        <Button
          variant="outline"
          className="h-12 gap-2 bg-transparent"
          onClick={handleDuplicate}
        >
          <Copy className="h-4 w-4" />
          <span className="text-sm">Duplicar</span>
        </Button>
        <Button
          variant="outline"
          className="h-12 gap-2 bg-transparent"
          asChild
        >
          <Link href={`/vistorias/${id}/documento`}>
            <FileText className="h-4 w-4" />
            <span className="text-sm">Documento</span>
          </Link>
        </Button>
        <Button
          variant="outline"
          className="h-12 gap-2 bg-transparent"
          asChild
        >
          <Link href={`/vistorias/${id}/historico`}>
            <History className="h-4 w-4" />
            <span className="text-sm">Historico</span>
          </Link>
        </Button>
      </div>

      {/* Duplication origin badge */}
      {inspection.duplicadoDe && (
        <div className="flex items-center gap-2 rounded-lg border border-border p-3 bg-muted/30">
          <Copy className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            Duplicada a partir de outra vistoria
          </p>
        </div>
      )}
    </div>
  )
}
