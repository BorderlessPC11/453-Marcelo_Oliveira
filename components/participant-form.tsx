"use client"

import React from "react"

import { useState } from "react"
import { toast } from "sonner"
import { UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { addParticipant } from "@/lib/store"

interface ParticipantFormProps {
  inspectionId: string
  onAdded: () => void
}

interface FormErrors {
  nome?: string
  cargo?: string
  empresa?: string
  email?: string
}

export function ParticipantForm({ inspectionId, onAdded }: ParticipantFormProps) {
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState("")
  const [cargo, setCargo] = useState("")
  const [empresa, setEmpresa] = useState("")
  const [email, setEmail] = useState("")
  const [errors, setErrors] = useState<FormErrors>({})

  function validate(): boolean {
    const newErrors: FormErrors = {}
    if (!nome.trim()) newErrors.nome = "Nome e obrigatorio"
    if (!cargo.trim()) newErrors.cargo = "Cargo e obrigatorio"
    if (!empresa.trim()) newErrors.empresa = "Empresa e obrigatoria"
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "E-mail invalido"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    addParticipant(inspectionId, {
      nome: nome.trim(),
      cargo: cargo.trim(),
      empresa: empresa.trim(),
      email: email.trim(),
    })

    toast.success("Participante adicionado")
    setNome("")
    setCargo("")
    setEmpresa("")
    setEmail("")
    setErrors({})
    setOpen(false)
    onAdded()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-12 text-base w-full bg-transparent">
          <UserPlus className="mr-2 h-5 w-5" />
          Adicionar Participante
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Participante</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="p-nome" className="text-sm font-medium">
              Nome <span className="text-destructive">*</span>
            </Label>
            <Input
              id="p-nome"
              placeholder="Nome completo"
              value={nome}
              onChange={(e) => {
                setNome(e.target.value)
                if (errors.nome) setErrors((p) => ({ ...p, nome: undefined }))
              }}
              className={`h-12 text-base ${errors.nome ? "border-destructive" : ""}`}
              aria-invalid={!!errors.nome}
            />
            {errors.nome && <p className="text-xs text-destructive">{errors.nome}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="p-cargo" className="text-sm font-medium">
              Cargo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="p-cargo"
              placeholder="Ex: Engenheiro, Proprietario"
              value={cargo}
              onChange={(e) => {
                setCargo(e.target.value)
                if (errors.cargo) setErrors((p) => ({ ...p, cargo: undefined }))
              }}
              className={`h-12 text-base ${errors.cargo ? "border-destructive" : ""}`}
              aria-invalid={!!errors.cargo}
            />
            {errors.cargo && <p className="text-xs text-destructive">{errors.cargo}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="p-empresa" className="text-sm font-medium">
              Empresa <span className="text-destructive">*</span>
            </Label>
            <Input
              id="p-empresa"
              placeholder="Nome da empresa"
              value={empresa}
              onChange={(e) => {
                setEmpresa(e.target.value)
                if (errors.empresa) setErrors((p) => ({ ...p, empresa: undefined }))
              }}
              className={`h-12 text-base ${errors.empresa ? "border-destructive" : ""}`}
              aria-invalid={!!errors.empresa}
            />
            {errors.empresa && <p className="text-xs text-destructive">{errors.empresa}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="p-email" className="text-sm font-medium">
              E-mail
            </Label>
            <Input
              id="p-email"
              type="email"
              placeholder="email@exemplo.com (opcional)"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errors.email) setErrors((p) => ({ ...p, email: undefined }))
              }}
              className={`h-12 text-base ${errors.email ? "border-destructive" : ""}`}
              aria-invalid={!!errors.email}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <Button type="submit" size="lg" className="h-12 text-base font-semibold mt-2">
            <UserPlus className="mr-2 h-5 w-5" />
            Adicionar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
