"use client"

import React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createInspection } from "@/lib/store"
import { Save } from "lucide-react"

interface FormErrors {
  titulo?: string
  dataVistoria?: string
  horarioInicio?: string
  horarioFim?: string
  local?: string
  condominio?: string
  torre?: string
}

export function NewInspectionForm() {
  const router = useRouter()
  const [titulo, setTitulo] = useState("")
  const [dataVistoria, setDataVistoria] = useState("")
  const [horarioInicio, setHorarioInicio] = useState("")
  const [horarioFim, setHorarioFim] = useState("")
  const [local, setLocal] = useState("")
  const [condominio, setCondominio] = useState("")
  const [torre, setTorre] = useState("")
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  function validate(): boolean {
    const newErrors: FormErrors = {}
    if (!titulo.trim()) newErrors.titulo = "Título é obrigatório"
    if (!dataVistoria) newErrors.dataVistoria = "Data é obrigatória"
    if (!horarioInicio) newErrors.horarioInicio = "Horário de início é obrigatório"
    if (!horarioFim) newErrors.horarioFim = "Horário de término é obrigatório"
    if (!local.trim()) newErrors.local = "Local é obrigatório"
    if (!condominio.trim()) newErrors.condominio = "Condomínio é obrigatório"
    if (!torre.trim()) newErrors.torre = "Torre é obrigatória"
    
    // Validar horários
    if (horarioInicio && horarioFim && horarioFim <= horarioInicio) {
      newErrors.horarioFim = "Horário de término deve ser após o início"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    setSubmitting(true)
    try {
      const inspection = createInspection({
        titulo: titulo.trim(),
        local: local.trim(),
        condominio: condominio.trim(),
        torre: torre.trim(),
        dataVistoria,
        horarioInicio,
        horarioFim,
      })
      toast.success("Vistoria criada com sucesso!")
      router.push(`/vistorias/${inspection.id}`)
    } catch {
      toast.error("Erro ao criar vistoria")
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 py-6">
      <Card>
        <CardContent className="flex flex-col gap-5 p-5">
          {/* IDENTIFICAÇÃO */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Identificação</h3>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="titulo" className="text-sm font-medium">
                Título <span className="text-destructive">*</span>
              </Label>
              <Input
                id="titulo"
                placeholder="Ex: Vistoria Apartamento 302"
                value={titulo}
                onChange={(e) => {
                  setTitulo(e.target.value)
                  if (errors.titulo) setErrors((p) => ({ ...p, titulo: undefined }))
                }}
                className={`h-12 text-base ${errors.titulo ? "border-destructive" : ""}`}
                aria-invalid={!!errors.titulo}
              />
              {errors.titulo && (
                <p className="text-xs text-destructive">{errors.titulo}</p>
              )}
            </div>
          </div>

          {/* ENDEREÇO */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Endereço</h3>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="condominio" className="text-sm font-medium">
                Condomínio <span className="text-destructive">*</span>
              </Label>
              <Input
                id="condominio"
                placeholder="Ex: Condomínio Praia Mar"
                value={condominio}
                onChange={(e) => {
                  setCondominio(e.target.value)
                  if (errors.condominio) setErrors((p) => ({ ...p, condominio: undefined }))
                }}
                className={`h-12 text-base ${errors.condominio ? "border-destructive" : ""}`}
                aria-invalid={!!errors.condominio}
              />
              {errors.condominio && (
                <p className="text-xs text-destructive">{errors.condominio}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="torre" className="text-sm font-medium">
                Torre <span className="text-destructive">*</span>
              </Label>
              <Input
                id="torre"
                placeholder="Ex: Torre A"
                value={torre}
                onChange={(e) => {
                  setTorre(e.target.value)
                  if (errors.torre) setErrors((p) => ({ ...p, torre: undefined }))
                }}
                className={`h-12 text-base ${errors.torre ? "border-destructive" : ""}`}
                aria-invalid={!!errors.torre}
              />
              {errors.torre && (
                <p className="text-xs text-destructive">{errors.torre}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="local" className="text-sm font-medium">
                Local <span className="text-destructive">*</span>
              </Label>
              <Input
                id="local"
                placeholder="Ex: Rua das Flores, 100"
                value={local}
                onChange={(e) => {
                  setLocal(e.target.value)
                  if (errors.local) setErrors((p) => ({ ...p, local: undefined }))
                }}
                className={`h-12 text-base ${errors.local ? "border-destructive" : ""}`}
                aria-invalid={!!errors.local}
              />
              {errors.local && (
                <p className="text-xs text-destructive">{errors.local}</p>
              )}
            </div>
          </div>

          {/* DATAS E HORÁRIOS */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">Datas e Horários</h3>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="data" className="text-sm font-medium">
                Data <span className="text-destructive">*</span>
              </Label>
              <Input
                id="data"
                type="date"
                value={dataVistoria}
                onChange={(e) => {
                  setDataVistoria(e.target.value)
                  if (errors.dataVistoria) setErrors((p) => ({ ...p, dataVistoria: undefined }))
                }}
                className={`h-12 text-base ${errors.dataVistoria ? "border-destructive" : ""}`}
                aria-invalid={!!errors.dataVistoria}
              />
              {errors.dataVistoria && (
                <p className="text-xs text-destructive">{errors.dataVistoria}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label htmlFor="horarioInicio" className="text-sm font-medium">
                  Início <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="horarioInicio"
                  type="time"
                  value={horarioInicio}
                  onChange={(e) => {
                    setHorarioInicio(e.target.value)
                    if (errors.horarioInicio) setErrors((p) => ({ ...p, horarioInicio: undefined }))
                  }}
                  className={`h-12 text-base ${errors.horarioInicio ? "border-destructive" : ""}`}
                  aria-invalid={!!errors.horarioInicio}
                />
                {errors.horarioInicio && (
                  <p className="text-xs text-destructive">{errors.horarioInicio}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="horarioFim" className="text-sm font-medium">
                  Término <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="horarioFim"
                  type="time"
                  value={horarioFim}
                  onChange={(e) => {
                    setHorarioFim(e.target.value)
                    if (errors.horarioFim) setErrors((p) => ({ ...p, horarioFim: undefined }))
                  }}
                  className={`h-12 text-base ${errors.horarioFim ? "border-destructive" : ""}`}
                  aria-invalid={!!errors.horarioFim}
                />
                {errors.horarioFim && (
                  <p className="text-xs text-destructive">{errors.horarioFim}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        type="submit"
        size="lg"
        disabled={submitting}
        className="h-14 text-base font-semibold"
      >
        <Save className="mr-2 h-5 w-5" />
        {submitting ? "Salvando..." : "Criar Vistoria"}
      </Button>
    </form>
  )
}
