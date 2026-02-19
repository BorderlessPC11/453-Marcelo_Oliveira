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

const TIPOS_VISTORIA = [
  "Entrega de obra",
  "Recebimento de imóvel",
  "Vistoria cautelar",
  "Vistoria periódica",
  "Laudo técnico",
  "Outro",
]

interface FormErrors {
  titulo?: string
  tipo?: string
  endereco?: string
  responsavel?: string
  dataVistoria?: string
}

export function NewInspectionForm() {
  const router = useRouter()
  const [titulo, setTitulo] = useState("")
  const [tipo, setTipo] = useState("")
  const [endereco, setEndereco] = useState("")
  const [responsavel, setResponsavel] = useState("")
  const [dataVistoria, setDataVistoria] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  function validate(): boolean {
    const newErrors: FormErrors = {}
    if (!titulo.trim()) newErrors.titulo = "Título é obrigatório"
    if (!tipo) newErrors.tipo = "Selecione o tipo"
    if (!endereco.trim()) newErrors.endereco = "Endereço é obrigatório"
    if (!responsavel.trim()) newErrors.responsavel = "Responsável é obrigatório"
    if (!dataVistoria) newErrors.dataVistoria = "Data é obrigatória"
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
        tipo,
        endereco: endereco.trim(),
        responsavel: responsavel.trim(),
        dataVistoria,
        observacoes: observacoes.trim(),
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
          <div className="flex flex-col gap-2">
            <Label htmlFor="titulo" className="text-sm font-medium">
              Titulo da Vistoria <span className="text-destructive">*</span>
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="tipo" className="text-sm font-medium">
              Tipo <span className="text-destructive">*</span>
            </Label>
            <Select
              value={tipo}
              onValueChange={(v) => {
                setTipo(v)
                if (errors.tipo) setErrors((p) => ({ ...p, tipo: undefined }))
              }}
            >
              <SelectTrigger
                id="tipo"
                className={`h-12 text-base ${errors.tipo ? "border-destructive" : ""}`}
                aria-invalid={!!errors.tipo}
              >
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_VISTORIA.map((t) => (
                  <SelectItem key={t} value={t} className="text-base py-3">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.tipo && (
              <p className="text-xs text-destructive">{errors.tipo}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="endereco" className="text-sm font-medium">
              Endereco <span className="text-destructive">*</span>
            </Label>
            <Input
              id="endereco"
              placeholder="Endereco completo do local"
              value={endereco}
              onChange={(e) => {
                setEndereco(e.target.value)
                if (errors.endereco) setErrors((p) => ({ ...p, endereco: undefined }))
              }}
              className={`h-12 text-base ${errors.endereco ? "border-destructive" : ""}`}
              aria-invalid={!!errors.endereco}
            />
            {errors.endereco && (
              <p className="text-xs text-destructive">{errors.endereco}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="responsavel" className="text-sm font-medium">
              Responsavel <span className="text-destructive">*</span>
            </Label>
            <Input
              id="responsavel"
              placeholder="Nome do responsável técnico"
              value={responsavel}
              onChange={(e) => {
                setResponsavel(e.target.value)
                if (errors.responsavel) setErrors((p) => ({ ...p, responsavel: undefined }))
              }}
              className={`h-12 text-base ${errors.responsavel ? "border-destructive" : ""}`}
              aria-invalid={!!errors.responsavel}
            />
            {errors.responsavel && (
              <p className="text-xs text-destructive">{errors.responsavel}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="data" className="text-sm font-medium">
              Data da Vistoria <span className="text-destructive">*</span>
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="obs" className="text-sm font-medium">
              Observacoes
            </Label>
            <Textarea
              id="obs"
              placeholder="Observacoes adicionais (opcional)"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={4}
              className="text-base resize-none"
            />
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
