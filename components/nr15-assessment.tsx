"use client"

import React from "react"

import { useEffect, useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { toast } from "sonner"
import {
  Save,
  CheckCircle2,
  Clock,
  FileText,
  Shield,
  Activity,
  Beaker,
  Info,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"
import { NR15AnexoCard } from "@/components/nr15-anexo-card"
import { useAutosave } from "@/hooks/use-autosave"
import { getInspection, updateInspectionNR15 } from "@/lib/store"
import type { Inspection } from "@/lib/types"
import {
  NR15_ANEXOS,
  CATEGORIAS_RISCO,
  criarAvaliacaoVazia,
  calcularProgressoAvaliacao,
} from "@/lib/nr15-data"
import type { AvaliacaoNR15 } from "@/lib/nr15-data"

interface NR15AssessmentProps {
  id: string
}

export function NR15Assessment({ id }: NR15AssessmentProps) {
  const router = useRouter()
  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("visao-geral")

  // NR-15 form state
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoNR15[]>([])
  const [nr15Observacoes, setNr15Observacoes] = useState("")
  const [setoresAvaliados, setSetoresAvaliados] = useState("")
  const [descricaoAtividades, setDescricaoAtividades] = useState("")
  const [epcsIdentificados, setEpcsIdentificados] = useState("")

  // Load inspection data
  useEffect(() => {
    setMounted(true)
    const data = getInspection(id)
    if (data) {
      setInspection(data)
      // Initialize avaliacoes - merge existing with any new anexos
      const existing = data.avaliacoesNR15 || []
      const merged = NR15_ANEXOS.map((anexo) => {
        const found = existing.find((a) => a.anexoNumero === anexo.numero)
        return found || criarAvaliacaoVazia(anexo.numero)
      })
      setAvaliacoes(merged)
      setNr15Observacoes(data.nr15Observacoes || "")
      setSetoresAvaliados(data.setoresAvaliados || "")
      setDescricaoAtividades(data.descricaoAtividades || "")
      setEpcsIdentificados(data.epcsIdentificados || "")
    }
  }, [id])

  // Autosave data
  const autosaveData = useMemo(
    () => ({
      avaliacoesNR15: avaliacoes,
      nr15Observacoes,
      setoresAvaliados,
      descricaoAtividades,
      epcsIdentificados,
    }),
    [avaliacoes, nr15Observacoes, setoresAvaliados, descricaoAtividades, epcsIdentificados]
  )

  const handleSave = useCallback(
    (data: typeof autosaveData) => {
      updateInspectionNR15(id, data)
    },
    [id]
  )

  const { lastSaved, isSaving, saveNow } = useAutosave({
    data: autosaveData,
    onSave: handleSave,
    interval: 3000,
    enabled: mounted && !!inspection,
  })

  // Handle avaliacao change
  function handleAvaliacaoChange(index: number, updated: AvaliacaoNR15) {
    setAvaliacoes((prev) => {
      const next = [...prev]
      next[index] = updated
      return next
    })
  }

  // Calculate overall progress
  const progressoGeral = useMemo(() => {
    if (avaliacoes.length === 0) return 0
    const avaliados = avaliacoes.filter((a) => a.aplica !== null).length
    return Math.round((avaliados / avaliacoes.length) * 100)
  }, [avaliacoes])

  // Stats
  const stats = useMemo(() => {
    const aplicaveis = avaliacoes.filter((a) => a.aplica === true)
    const naoAplicaveis = avaliacoes.filter((a) => a.aplica === false)
    const pendentes = avaliacoes.filter((a) => a.aplica === null)
    const preenchimentoAplicaveis = aplicaveis.length > 0
      ? Math.round(aplicaveis.reduce((sum, a) => sum + calcularProgressoAvaliacao(a), 0) / aplicaveis.length)
      : 0
    return {
      total: avaliacoes.length,
      aplicaveis: aplicaveis.length,
      naoAplicaveis: naoAplicaveis.length,
      pendentes: pendentes.length,
      preenchimentoAplicaveis,
    }
  }, [avaliacoes])

  // Categorias com progresso
  const categoriasComProgresso = useMemo(() => {
    return CATEGORIAS_RISCO.map((cat) => {
      const catAvaliacoes = avaliacoes.filter((a) =>
        cat.anexos.includes(a.anexoNumero)
      )
      const avaliados = catAvaliacoes.filter((a) => a.aplica !== null).length
      const progresso = catAvaliacoes.length > 0
        ? Math.round((avaliados / catAvaliacoes.length) * 100)
        : 0
      return { ...cat, progresso, total: catAvaliacoes.length, avaliados }
    })
  }, [avaliacoes])

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

  const categoryIcons: Record<string, React.ElementType> = {
    fisicos: Activity,
    quimicos: Beaker,
    biologicos: Shield,
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      {/* Autosave indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            "h-2 w-2 rounded-full transition-colors",
            isSaving ? "bg-amber-500 animate-pulse" : "bg-accent"
          )} />
          <span className="text-xs text-muted-foreground">
            {isSaving
              ? "Salvando..."
              : lastSaved
                ? `Salvo as ${format(lastSaved, "HH:mm:ss")}`
                : "Autosave ativo"}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            saveNow()
            toast.success("Dados salvos manualmente")
          }}
          className="h-8 text-xs text-muted-foreground"
        >
          <Save className="mr-1 h-3.5 w-3.5" />
          Salvar
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-auto min-w-full">
            <TabsTrigger value="visao-geral" className="text-xs">
              <FileText className="mr-1.5 h-3.5 w-3.5" />
              Geral
            </TabsTrigger>
            {CATEGORIAS_RISCO.map((cat) => {
              const CatIcon = categoryIcons[cat.id] || Activity
              return (
                <TabsTrigger key={cat.id} value={cat.id} className="text-xs">
                  <CatIcon className="mr-1.5 h-3.5 w-3.5" />
                  {cat.label}
                </TabsTrigger>
              )
            })}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Tab: Visao Geral */}
        <TabsContent value="visao-geral" className="flex flex-col gap-4 mt-4">
          {/* Progress Overview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Progresso da Avaliação NR-15
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <Progress value={progressoGeral} className="h-3 flex-1" />
                <span className="text-sm font-semibold text-foreground w-12 text-right">
                  {progressoGeral}%
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 p-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xl font-bold text-foreground">{stats.pendentes}</span>
                  <span className="text-xs text-muted-foreground text-center">Pendentes</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-lg bg-primary/5 p-3">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-xl font-bold text-foreground">{stats.aplicaveis}</span>
                  <span className="text-xs text-muted-foreground text-center">Aplicáveis</span>
                </div>
                <div className="flex flex-col items-center gap-1 rounded-lg bg-secondary p-3">
                  <FileText className="h-4 w-4 text-secondary-foreground" />
                  <span className="text-xl font-bold text-foreground">{stats.naoAplicaveis}</span>
                  <span className="text-xs text-muted-foreground text-center">N/A</span>
                </div>
              </div>

              {stats.aplicaveis > 0 && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">
                    Preenchimento dos aplicáveis
                  </span>
                  <div className="flex items-center gap-3">
                    <Progress value={stats.preenchimentoAplicaveis} className="h-2 flex-1" />
                    <span className="text-xs font-medium text-muted-foreground w-10 text-right">
                      {stats.preenchimentoAplicaveis}%
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Progress */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Progresso por Categoria</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {categoriasComProgresso.map((cat) => {
                const CatIcon = categoryIcons[cat.id] || Activity
                return (
                  <button
                    type="button"
                    key={cat.id}
                    className="flex items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/50"
                    onClick={() => setActiveTab(cat.id)}
                  >
                    <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", cat.bgCor)}>
                      <CatIcon className={cn("h-5 w-5", cat.cor)} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground">
                          Riscos {cat.label}
                        </p>
                        <Badge variant="outline" className="text-xs bg-transparent">
                          {cat.avaliados}/{cat.total}
                        </Badge>
                      </div>
                      <Progress value={cat.progresso} className="h-1.5 mt-2" />
                    </div>
                  </button>
                )
              })}
            </CardContent>
          </Card>

          {/* General Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informacoes Gerais</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">Setores Avaliados</Label>
                <Textarea
                  placeholder="Liste todos os setores/areas inspecionados"
                  value={setoresAvaliados}
                  onChange={(e) => setSetoresAvaliados(e.target.value)}
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">Descricao Geral das Atividades</Label>
                <Textarea
                  placeholder="Descreva o processo produtivo e as atividades desenvolvidas"
                  value={descricaoAtividades}
                  onChange={(e) => setDescricaoAtividades(e.target.value)}
                  rows={4}
                  className="text-sm resize-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">
                  <Shield className="inline mr-1.5 h-3.5 w-3.5" />
                  EPCs Identificados
                </Label>
                <Textarea
                  placeholder="Liste os Equipamentos de Protecao Coletiva existentes"
                  value={epcsIdentificados}
                  onChange={(e) => setEpcsIdentificados(e.target.value)}
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">Observacoes Gerais NR-15</Label>
                <Textarea
                  placeholder="Observacoes gerais sobre a avaliacao NR-15"
                  value={nr15Observacoes}
                  onChange={(e) => setNr15Observacoes(e.target.value)}
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tabs: Categorias de Riscos */}
        {CATEGORIAS_RISCO.map((categoria) => {
          const CatIcon = categoryIcons[categoria.id] || Activity
          const catAnexos = NR15_ANEXOS.filter((a) => categoria.anexos.includes(a.numero))

          return (
            <TabsContent key={categoria.id} value={categoria.id} className="flex flex-col gap-4 mt-4">
              {/* Category header */}
              <Card className={cn("border-l-4", 
                categoria.id === "fisicos" && "border-l-primary",
                categoria.id === "quimicos" && "border-l-amber-500",
                categoria.id === "biologicos" && "border-l-emerald-500",
              )}>
                <CardContent className="flex items-center gap-3 p-4">
                  <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-lg", categoria.bgCor)}>
                    <CatIcon className={cn("h-5 w-5", categoria.cor)} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">
                      Riscos {categoria.label}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {catAnexos.length} anexo{catAnexos.length !== 1 ? "s" : ""} para avaliar
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-transparent text-xs">
                    {categoriasComProgresso.find((c) => c.id === categoria.id)?.avaliados || 0}/
                    {catAnexos.length}
                  </Badge>
                </CardContent>
              </Card>

              {/* Accordion for anexos */}
              <Accordion type="multiple" className="flex flex-col gap-3">
                {catAnexos.map((anexo) => {
                  const avalIndex = avaliacoes.findIndex(
                    (a) => a.anexoNumero === anexo.numero
                  )
                  const aval = avaliacoes[avalIndex]
                  if (!aval) return null
                  const progresso = calcularProgressoAvaliacao(aval)

                  return (
                    <AccordionItem
                      key={anexo.numero}
                      value={`anexo-${anexo.numero}`}
                      className="border-none"
                    >
                      <AccordionTrigger className="px-4 py-3 rounded-lg border border-border bg-card hover:bg-muted/50 hover:no-underline [&[data-state=open]]:rounded-b-none">
                        <div className="flex items-center gap-3 text-left flex-1 min-w-0 mr-2">
                          <span className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-bold",
                            aval.aplica === true ? "bg-primary text-primary-foreground" :
                            aval.aplica === false ? "bg-muted text-muted-foreground" :
                            "bg-secondary text-secondary-foreground"
                          )}>
                            {anexo.numero}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {anexo.titulo}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {aval.aplica === null && (
                                <Badge variant="outline" className="text-xs bg-transparent">Pendente</Badge>
                              )}
                              {aval.aplica === true && (
                                <Badge className="text-xs bg-primary/15 text-primary border-0">
                                  Aplica - {progresso}%
                                </Badge>
                              )}
                              {aval.aplica === false && (
                                <Badge variant="outline" className="text-xs bg-transparent text-muted-foreground">
                                  N/A
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="border border-t-0 border-border rounded-b-lg p-0">
                        <div className="p-3">
                          <NR15AnexoCard
                            anexo={anexo}
                            avaliacao={aval}
                            onChange={(updated) => handleAvaliacaoChange(avalIndex, updated)}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
