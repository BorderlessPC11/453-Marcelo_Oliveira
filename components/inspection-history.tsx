"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format, isToday, isYesterday } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Clock,
  Camera,
  Mic,
  Users,
  FileText,
  Pen,
  Copy,
  AlertTriangle,
  Activity,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { getInspection } from "@/lib/store"
import type { Inspection, HistoryEntry } from "@/lib/types"

interface InspectionHistoryProps {
  id: string
}

function getActionIcon(acao: string) {
  const lower = acao.toLowerCase()
  if (lower.includes("foto")) return Camera
  if (lower.includes("voz") || lower.includes("audio")) return Mic
  if (lower.includes("participante")) return Users
  if (lower.includes("assinatura")) return Pen
  if (lower.includes("duplica")) return Copy
  if (lower.includes("nr-15") || lower.includes("nr15")) return AlertTriangle
  if (lower.includes("status")) return Activity
  return FileText
}

function getActionColor(acao: string) {
  const lower = acao.toLowerCase()
  if (lower.includes("foto")) return "bg-amber-500/10 text-amber-600"
  if (lower.includes("voz")) return "bg-primary/10 text-primary"
  if (lower.includes("participante")) return "bg-emerald-500/10 text-emerald-600"
  if (lower.includes("assinatura")) return "bg-indigo-500/10 text-indigo-600"
  if (lower.includes("duplica")) return "bg-secondary text-secondary-foreground"
  if (lower.includes("status")) return "bg-primary/10 text-primary"
  if (lower.includes("removid")) return "bg-destructive/10 text-destructive"
  if (lower.includes("criad")) return "bg-accent/10 text-accent"
  return "bg-muted text-muted-foreground"
}

function formatTimestamp(ts: string): string {
  const date = new Date(ts)
  if (isToday(date)) return `Hoje, ${format(date, "HH:mm")}`
  if (isYesterday(date)) return `Ontem, ${format(date, "HH:mm")}`
  return format(date, "dd/MM/yyyy 'as' HH:mm")
}

function groupByDate(
  entries: HistoryEntry[]
): { date: string; label: string; items: HistoryEntry[] }[] {
  const groups: Record<string, HistoryEntry[]> = {}

  for (const entry of entries) {
    const dateKey = format(new Date(entry.timestamp), "yyyy-MM-dd")
    if (!groups[dateKey]) groups[dateKey] = []
    groups[dateKey].push(entry)
  }

  return Object.entries(groups).map(([dateKey, items]) => {
    const date = new Date(dateKey + "T12:00:00")
    let label: string
    if (isToday(date)) label = "Hoje"
    else if (isYesterday(date)) label = "Ontem"
    else label = format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    return { date: dateKey, label, items }
  })
}

export function InspectionHistory({ id }: InspectionHistoryProps) {
  const router = useRouter()
  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setInspection(getInspection(id) || null)
  }, [id])

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
        <p className="text-lg font-medium text-foreground">
          Vistoria não encontrada
        </p>
        <Button onClick={() => router.push("/vistorias")}>
          Voltar para lista
        </Button>
      </div>
    )
  }

  const entries = inspection.historico || []
  const groups = groupByDate(entries)

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      {/* Summary Card */}
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Clock className="h-6 w-6 text-primary" />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {inspection.titulo}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {entries.length} registro{entries.length !== 1 ? "s" : ""} de
              atividade
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Criada em{" "}
              {format(new Date(inspection.criadoEm), "dd/MM/yyyy 'as' HH:mm")}
            </p>
          </div>
        </CardContent>
      </Card>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </span>
            <p className="font-medium text-foreground">
              Nenhuma atividade registrada
            </p>
            <p className="text-sm text-muted-foreground">
              As acoes realizadas nesta vistoria aparecerao aqui
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <div key={group.date}>
              {/* Date header */}
              <div className="flex items-center gap-3 mb-3">
                <Badge
                  variant="outline"
                  className="bg-transparent text-xs font-semibold"
                >
                  {group.label}
                </Badge>
                <Separator className="flex-1" />
              </div>

              {/* Timeline */}
              <div className="relative flex flex-col gap-0">
                {/* Timeline line */}
                <div className="absolute left-[19px] top-4 bottom-4 w-px bg-border" />

                {group.items.map((entry, idx) => {
                  const Icon = getActionIcon(entry.acao)
                  const colorClass = getActionColor(entry.acao)

                  return (
                    <div
                      key={entry.id}
                      className="relative flex items-start gap-3 py-2"
                    >
                      {/* Timeline dot */}
                      <span
                        className={cn(
                          "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                          colorClass
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-1.5">
                        <p className="text-sm text-foreground leading-snug">
                          {entry.acao}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatTimestamp(entry.timestamp)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
