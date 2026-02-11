"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { FileText, Eye, Download, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { getInspection } from "@/lib/store"
import type { Inspection } from "@/lib/types"

interface DocumentGenerationProps {
  id: string
}

export function DocumentGeneration({ id }: DocumentGenerationProps) {
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
        <p className="text-lg font-medium text-foreground">Vistoria nao encontrada</p>
        <Button onClick={() => router.push("/vistorias")}>Voltar para lista</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Geracao de Documento</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-foreground">{inspection.titulo}</span>
            <span className="text-xs text-muted-foreground">{inspection.tipo}</span>
          </div>

          <Separator />

          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3">
            <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Info className="h-4 w-4 text-primary" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Em construcao</p>
              <p className="text-xs text-muted-foreground mt-1">
                Esta tela prepara a geracao do documento tecnico. Em breve voce podera visualizar e exportar.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="outline" className="h-12 bg-transparent" disabled>
              <Eye className="mr-2 h-4 w-4" />
              Visualizar
            </Button>
            <Button type="button" className="h-12" disabled>
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>

          <Button asChild variant="ghost" className="h-11 text-sm">
            <Link href={`/vistorias/${id}`}>Voltar para detalhes</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
