"use client"

import { Check, X, AlertTriangle, ChevronDown, Shield, Activity, Beaker } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { NR15Anexo, AvaliacaoNR15, AgenteAvaliado } from "@/lib/nr15-data"
import { calcularProgressoAvaliacao } from "@/lib/nr15-data"
import { useState } from "react"

interface NR15AnexoCardProps {
  anexo: NR15Anexo
  avaliacao: AvaliacaoNR15
  onChange: (avaliacao: AvaliacaoNR15) => void
}

export function NR15AnexoCard({ anexo, avaliacao, onChange }: NR15AnexoCardProps) {
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set())
  const progresso = calcularProgressoAvaliacao(avaliacao)

  function handleAplicaChange(aplica: boolean) {
    onChange({ ...avaliacao, aplica })
  }

  function handleFieldChange(field: keyof AvaliacaoNR15, value: string) {
    onChange({ ...avaliacao, [field]: value })
  }

  function handleAgenteChange(agenteId: string, updates: Partial<AgenteAvaliado>) {
    const agentesAvaliados = avaliacao.agentesAvaliados.map((ag) =>
      ag.agenteId === agenteId ? { ...ag, ...updates } : ag
    )
    onChange({ ...avaliacao, agentesAvaliados })
  }

  function toggleAgentExpand(agenteId: string) {
    setExpandedAgents((prev) => {
      const next = new Set(prev)
      if (next.has(agenteId)) next.delete(agenteId)
      else next.add(agenteId)
      return next
    })
  }

  const isNotApplicable = avaliacao.aplica === false
  const isApplicable = avaliacao.aplica === true
  const isUnevaluated = avaliacao.aplica === null

  return (
    <Card className={cn(
      "transition-all",
      isNotApplicable && "opacity-60",
      isApplicable && "ring-1 ring-primary/20",
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <span className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
            isApplicable ? "bg-primary text-primary-foreground" :
            isNotApplicable ? "bg-muted text-muted-foreground" :
            "bg-secondary text-secondary-foreground"
          )}>
            {anexo.numero}
          </span>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-foreground leading-tight">
              {anexo.titulo}
            </h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {anexo.descricao}
            </p>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className="text-xs bg-transparent">
                {anexo.tipo === "quantitativo" ? (
                  <><Activity className="mr-1 h-3 w-3" />Quantitativo</>
                ) : (
                  <><Beaker className="mr-1 h-3 w-3" />Qualitativo</>
                )}
              </Badge>
              {anexo.grauInsalubridade.map((g) => (
                <Badge
                  key={g}
                  variant="outline"
                  className={cn("text-xs bg-transparent",
                    g.includes("Maximo") && "border-destructive/40 text-destructive",
                    g.includes("Medio") && "border-amber-500/40 text-amber-600",
                    g.includes("Minimo") && "border-emerald-500/40 text-emerald-600",
                  )}
                >
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  {g}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* APLICA / NÃO APLICA buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            type="button"
            variant={isApplicable ? "default" : "outline"}
            size="sm"
            className={cn(
              "flex-1 h-11 text-sm font-medium",
              isApplicable
                ? "bg-primary text-primary-foreground"
                : "bg-transparent hover:bg-primary/5"
            )}
            onClick={() => handleAplicaChange(true)}
          >
            <Check className="mr-1.5 h-4 w-4" />
            Aplica
          </Button>
          <Button
            type="button"
            variant={isNotApplicable ? "default" : "outline"}
            size="sm"
            className={cn(
              "flex-1 h-11 text-sm font-medium",
              isNotApplicable
                ? "bg-muted text-muted-foreground"
                : "bg-transparent hover:bg-muted/50"
            )}
            onClick={() => handleAplicaChange(false)}
          >
            <X className="mr-1.5 h-4 w-4" />
            Não Aplica
          </Button>
        </div>

        {/* Progress bar - only show when applicable */}
        {isApplicable && (
          <div className="mt-3 flex items-center gap-3">
            <Progress value={progresso} className="h-2 flex-1" />
            <span className="text-xs font-medium text-muted-foreground w-10 text-right">
              {progresso}%
            </span>
          </div>
        )}
      </CardHeader>

      {/* Expanded content when applicable */}
      {isApplicable && (
        <CardContent className="flex flex-col gap-5 pt-0">
          <Separator />

          {/* Local e Atividades */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">
                Local da Avaliação
              </Label>
              <Input
                placeholder="Descreva o local avaliado (setor, área, departamento)"
                value={avaliacao.localAvaliacao}
                onChange={(e) => handleFieldChange("localAvaliacao", e.target.value)}
                className="h-11 text-sm"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">
                Atividades Desenvolvidas
              </Label>
              <Textarea
                placeholder="Descreva as atividades exercidas no local que envolvem exposição ao agente"
                value={avaliacao.atividadesDescritas}
                onChange={(e) => handleFieldChange("atividadesDescritas", e.target.value)}
                rows={3}
                className="text-sm resize-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">
                <Shield className="inline mr-1.5 h-3.5 w-3.5" />
                EPIs Utilizados
              </Label>
              <Textarea
                placeholder="Liste os EPIs fornecidos e utilizados (ex: protetor auricular, mascara PFF2)"
                value={avaliacao.episUtilizados}
                onChange={(e) => handleFieldChange("episUtilizados", e.target.value)}
                rows={2}
                className="text-sm resize-none"
              />
            </div>

            {anexo.tipo === "quantitativo" && (
              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium">
                  <Activity className="inline mr-1.5 h-3.5 w-3.5" />
                  Medicoes Realizadas
                </Label>
                <Textarea
                  placeholder="Descreva o instrumento, metodologia e resultados das medições"
                  value={avaliacao.medicoes}
                  onChange={(e) => handleFieldChange("medicoes", e.target.value)}
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label className="text-sm font-medium">
                Tempo de Exposição
              </Label>
              <Input
                placeholder="Ex: 6 horas/dia, intermitente, eventual"
                value={avaliacao.tempoExposicao}
                onChange={(e) => handleFieldChange("tempoExposicao", e.target.value)}
                className="h-11 text-sm"
              />
            </div>
          </div>

          {/* Agentes */}
          {anexo.agentes.length > 0 && (
            <div className="flex flex-col gap-3">
              <h5 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Beaker className="h-4 w-4 text-primary" />
                Agentes ({anexo.agentes.length})
              </h5>
              {anexo.agentes.map((agente) => {
                const agenteAv = avaliacao.agentesAvaliados.find(
                  (a) => a.agenteId === agente.id
                )
                if (!agenteAv) return null
                const isExpanded = expandedAgents.has(agente.id)

                return (
                  <Collapsible
                    key={agente.id}
                    open={isExpanded}
                    onOpenChange={() => toggleAgentExpand(agente.id)}
                  >
                    <div className="rounded-lg border border-border">
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors rounded-t-lg"
                        >
                          <div className={cn(
                            "h-2.5 w-2.5 rounded-full shrink-0",
                            agenteAv.identificado ? "bg-amber-500" : "bg-muted-foreground/30"
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {agente.nome}
                            </p>
                            {agente.limiteToleranciaTWA && (
                              <p className="text-xs text-muted-foreground">
                                LT: {agente.limiteToleranciaTWA}
                                {agente.limiteToleranciaSTEL && ` | STEL: ${agente.limiteToleranciaSTEL}`}
                              </p>
                            )}
                          </div>
                          {agente.grau && (
                            <Badge variant="outline" className={cn("text-xs shrink-0 bg-transparent",
                              agente.grau.includes("Maximo") && "border-destructive/40 text-destructive",
                              agente.grau.includes("Medio") && "border-amber-500/40 text-amber-600",
                              agente.grau.includes("Minimo") && "border-emerald-500/40 text-emerald-600",
                            )}>
                              {agente.grau}
                            </Badge>
                          )}
                          <ChevronDown className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform shrink-0",
                            isExpanded && "rotate-180"
                          )} />
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-t border-border p-3 flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`ident-${agente.id}`} className="text-sm">
                              Agente identificado no local?
                            </Label>
                            <Switch
                              id={`ident-${agente.id}`}
                              checked={agenteAv.identificado}
                              onCheckedChange={(checked) =>
                                handleAgenteChange(agente.id, { identificado: checked })
                              }
                            />
                          </div>

                          {agenteAv.identificado && (
                            <>
                              {anexo.tipo === "quantitativo" && (
                                <div className="flex flex-col gap-2">
                                  <Label className="text-sm">
                                    Valor Medido {agente.unidade && `(${agente.unidade})`}
                                  </Label>
                                  <Input
                                    placeholder={`Ex: ${agente.limiteToleranciaTWA || "valor"}`}
                                    value={agenteAv.valorMedido}
                                    onChange={(e) =>
                                      handleAgenteChange(agente.id, { valorMedido: e.target.value })
                                    }
                                    className="h-10 text-sm"
                                  />
                                </div>
                              )}

                              {anexo.tipo === "quantitativo" && (
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm">Acima do Limite de Tolerancia?</Label>
                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      variant={agenteAv.acimaDoLimite === true ? "default" : "outline"}
                                      size="sm"
                                      className={cn(
                                        "h-8 text-xs px-3",
                                        agenteAv.acimaDoLimite === true
                                          ? "bg-destructive text-destructive-foreground"
                                          : "bg-transparent"
                                      )}
                                      onClick={() =>
                                        handleAgenteChange(agente.id, { acimaDoLimite: true })
                                      }
                                    >
                                      Sim
                                    </Button>
                                    <Button
                                      type="button"
                                      variant={agenteAv.acimaDoLimite === false ? "default" : "outline"}
                                      size="sm"
                                      className={cn(
                                        "h-8 text-xs px-3",
                                        agenteAv.acimaDoLimite === false
                                          ? "bg-accent text-accent-foreground"
                                          : "bg-transparent"
                                      )}
                                      onClick={() =>
                                        handleAgenteChange(agente.id, { acimaDoLimite: false })
                                      }
                                    >
                                      Nao
                                    </Button>
                                  </div>
                                </div>
                              )}

                              <Separator />

                              <div className="flex items-center justify-between">
                                <Label className="text-sm">EPI Fornecido?</Label>
                                <Switch
                                  checked={agenteAv.epiFornecido}
                                  onCheckedChange={(checked) =>
                                    handleAgenteChange(agente.id, { epiFornecido: checked })
                                  }
                                />
                              </div>

                              <div className="flex items-center justify-between">
                                <Label className="text-sm">EPI Utilizado?</Label>
                                <Switch
                                  checked={agenteAv.epiUtilizado}
                                  onCheckedChange={(checked) =>
                                    handleAgenteChange(agente.id, { epiUtilizado: checked })
                                  }
                                />
                              </div>

                              {(agenteAv.epiFornecido || agenteAv.epiUtilizado) && (
                                <div className="flex flex-col gap-2">
                                  <Label className="text-sm">Descricao do EPI</Label>
                                  <Input
                                    placeholder="Ex: Protetor auricular tipo concha 3M"
                                    value={agenteAv.descricaoEPI}
                                    onChange={(e) =>
                                      handleAgenteChange(agente.id, { descricaoEPI: e.target.value })
                                    }
                                    className="h-10 text-sm"
                                  />
                                </div>
                              )}

                              <div className="flex flex-col gap-2">
                                <Label className="text-sm">Observacoes do Agente</Label>
                                <Textarea
                                  placeholder="Observacoes especificas sobre este agente"
                                  value={agenteAv.observacoes}
                                  onChange={(e) =>
                                    handleAgenteChange(agente.id, { observacoes: e.target.value })
                                  }
                                  rows={2}
                                  className="text-sm resize-none"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                )
              })}
            </div>
          )}

          {/* Conclusao */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">Conclusao</Label>
            <Textarea
              placeholder="Conclusão técnica sobre a exposição ao(s) agente(s) deste anexo"
              value={avaliacao.conclusao}
              onChange={(e) => handleFieldChange("conclusao", e.target.value)}
              rows={3}
              className="text-sm resize-none"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-sm font-medium">Observacoes</Label>
            <Textarea
              placeholder="Observacoes adicionais"
              value={avaliacao.observacoes}
              onChange={(e) => handleFieldChange("observacoes", e.target.value)}
              rows={2}
              className="text-sm resize-none"
            />
          </div>
        </CardContent>
      )}
    </Card>
  )
}
