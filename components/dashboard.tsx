"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  ClipboardPlus,
  ClipboardList,
  Clock,
  CheckCircle2,
  FileText,
  ChevronRight,
  MapPin,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { getInspections } from "@/lib/store"
import type { Inspection } from "@/lib/types"

export function Dashboard() {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setInspections(getInspections())
  }, [])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  const total = inspections.length
  const emAndamento = inspections.filter((i) => i.status === "em_andamento").length
  const concluidas = inspections.filter((i) => i.status === "concluida").length
  const rascunhos = inspections.filter((i) => i.status === "rascunho").length
  const recentes = inspections.slice(0, 5)

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      {/* Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-foreground text-balance">
          Painel de Vistorias
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/vistorias/nova">
          <Card className="border-primary/20 bg-primary/5 transition-colors hover:bg-primary/10">
            <CardContent className="flex items-center gap-3 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <ClipboardPlus className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Nova Vistoria</p>
                <p className="text-xs text-muted-foreground">Iniciar agora</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/vistorias">
          <Card className="transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center gap-3 p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                <ClipboardList className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Ver Todas</p>
                <p className="text-xs text-muted-foreground">{total} vistorias</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="flex flex-col items-center gap-1 p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </span>
            <span className="text-2xl font-bold text-foreground">{rascunhos}</span>
            <span className="text-xs text-muted-foreground text-center">Rascunhos</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-4 w-4 text-primary" />
            </span>
            <span className="text-2xl font-bold text-foreground">{emAndamento}</span>
            <span className="text-xs text-muted-foreground text-center">Em andamento</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center gap-1 p-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
              <CheckCircle2 className="h-4 w-4 text-accent" />
            </span>
            <span className="text-2xl font-bold text-foreground">{concluidas}</span>
            <span className="text-xs text-muted-foreground text-center">Concluídas</span>
          </CardContent>
        </Card>
      </div>

      {/* Recent Inspections */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-foreground">Recentes</h3>
          {total > 0 && (
            <Link href="/vistorias" className="text-sm font-medium text-primary hover:underline">
              Ver todas
            </Link>
          )}
        </div>
        {recentes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <ClipboardList className="h-6 w-6 text-muted-foreground" />
              </span>
              <div>
                <p className="font-medium text-foreground">Nenhuma vistoria ainda</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Crie sua primeira vistoria para começar
                </p>
              </div>
              <Button asChild className="mt-2">
                <Link href="/vistorias/nova">
                  <ClipboardPlus className="mr-2 h-4 w-4" />
                  Nova Vistoria
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {recentes.map((inspection) => (
              <Link key={inspection.id} href={`/vistorias/${inspection.id}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {inspection.titulo}
                        </p>
                        <StatusBadge status={inspection.status} />
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                        <p className="text-xs text-muted-foreground truncate">
                          {inspection.condominio ? `${inspection.condominio} - Torre ${inspection.torre}` : "Sem condomínio"}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(inspection.criadoEm), "dd/MM/yyyy 'às' HH:mm")}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
