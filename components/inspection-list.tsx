"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { ChevronRight, ClipboardList, ClipboardPlus, MapPin, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/status-badge"
import { getInspections, deleteInspection } from "@/lib/store"
import type { Inspection } from "@/lib/types"
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

export function InspectionList() {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [search, setSearch] = useState("")
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

  const filtered = inspections.filter(
    (i) =>
      i.titulo.toLowerCase().includes(search.toLowerCase()) ||
      i.endereco.toLowerCase().includes(search.toLowerCase()) ||
      i.responsavel.toLowerCase().includes(search.toLowerCase())
  )

  function handleDelete(id: string) {
    deleteInspection(id)
    setInspections(getInspections())
    toast.success("Vistoria removida")
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar vistorias..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-12 pl-10 text-base"
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <ClipboardList className="h-6 w-6 text-muted-foreground" />
            </span>
            <div>
              <p className="font-medium text-foreground">
                {search ? "Nenhum resultado" : "Nenhuma vistoria"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {search
                  ? "Tente buscar com outros termos"
                  : "Crie sua primeira vistoria para comecar"}
              </p>
            </div>
            {!search && (
              <Button asChild className="mt-2">
                <Link href="/vistorias/nova">
                  <ClipboardPlus className="mr-2 h-4 w-4" />
                  Nova Vistoria
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">
            {filtered.length} vistoria{filtered.length !== 1 ? "s" : ""} encontrada{filtered.length !== 1 ? "s" : ""}
          </p>
          {filtered.map((inspection) => (
            <Card key={inspection.id} className="transition-colors hover:bg-muted/50">
              <CardContent className="flex items-center gap-3 p-4">
                <Link href={`/vistorias/${inspection.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {inspection.titulo}
                    </p>
                    <StatusBadge status={inspection.status} />
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                    <p className="text-xs text-muted-foreground truncate">
                      {inspection.endereco || "Sem endereco"}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(inspection.criadoEm), "dd/MM/yyyy 'as' HH:mm")} | {inspection.participantes.length} participante{inspection.participantes.length !== 1 ? "s" : ""}
                  </p>
                </Link>
                <div className="flex items-center gap-1 shrink-0">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remover</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover vistoria?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. A vistoria e todos os dados associados serão removidos.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(inspection.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Link href={`/vistorias/${inspection.id}`}>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
