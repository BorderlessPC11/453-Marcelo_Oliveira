"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { FileText, Eye, Download, Info, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { getInspection } from "@/lib/store"
import { gerarDocumento, fazerDownloadDocumento, obterDescritvoTemplate } from "@/lib/docx-generator"
import type { Inspection } from "@/lib/types"

interface DocumentGenerationProps {
  id: string
}

export function DocumentGeneration({ id }: DocumentGenerationProps) {
  const router = useRouter()
  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [mounted, setMounted] = useState(false)
  const [gerando, setGerando] = useState(false)

  useEffect(() => {
    setMounted(true)
    setInspection(getInspection(id) || null)
  }, [id])

  /**
   * Função para gerar o documento DOCX
   * Passos:
   * 1. Verificar se inspeção está carregada
   * 2. Mostrar loading
   * 3. Chamar gerarDocumento() que faz toda a lógica
   * 4. Se sucesso: fazer download automático
   * 5. Se erro: mostrar toast de erro
   */
  const handleExportar = async () => {
    if (!inspection) {
      toast.error("Vistoria não encontrada")
      return
    }

    setGerando(true)
    try {
      // Gerar o documento DOCX
      const docxBlob = await gerarDocumento(inspection)

      // Criar nome do arquivo: "Vistoria_<titulo>_<data>.docx"
      const nomeArquivo = `Vistoria_${inspection.titulo.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.docx`

      // Fazer download
      fazerDownloadDocumento(docxBlob, nomeArquivo)

      toast.success("Documento exportado com sucesso!")
    } catch (erro) {
      console.error("Erro ao gerar documento:", erro)
      const mensagem = erro instanceof Error ? erro.message : "Erro desconhecido"
      toast.error(`Erro: ${mensagem}`)
    } finally {
      setGerando(false)
    }
  }

  /**
   * Função para visualizar o documento (abre em nova aba)
   * Passos:
   * 1. Validar que inspeção existe
   * 2. Gerar o DOCX
   * 3. Se sucesso: abrir URL do blob em nova aba
   * 4. Usuário pode ver, editar ou salvar
   */
  const handleVisualizar = async () => {
    if (!inspection) {
      toast.error("Vistoria não encontrada")
      return
    }

    setGerando(true)
    try {
      // Gerar o documento
      const docxBlob = await gerarDocumento(inspection)

      // Criar URL temporária
      const url = URL.createObjectURL(docxBlob)

      // Abrir em nova aba
      window.open(url, "_blank")

      toast.success("Documento aberto em nova aba!")
    } catch (erro) {
      console.error("Erro ao visualizar documento:", erro)
      const mensagem = erro instanceof Error ? erro.message : "Erro desconhecido"
      toast.error(`Erro: ${mensagem}`)
    } finally {
      setGerando(false)
    }
  }

  /**
   * Mostra instruções de como criar o template
   */
  const handleMostrarInstrucoes = () => {
    const instrucoes = obterDescritvoTemplate()
    toast.message("Instruções do Template", {
      description: instrucoes,
      duration: 10000,
    })
  }

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

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Geração de Documento</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-foreground">{inspection.titulo}</span>
            <span className="text-xs text-muted-foreground">{inspection.tipo}</span>
          </div>

          <Separator />

          {/* Status de template */}
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3">
            <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Como criar o template</p>
              <p className="text-xs text-muted-foreground mt-1">
                O template DOCX deve estar em /public/templates/vistoria-template.docx
              </p>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 mt-2 text-xs"
                onClick={handleMostrarInstrucoes}
              >
                Ver instruções →
              </Button>
            </div>
          </div>

          {/* Info sobre progresso */}
          <div className="flex flex-col gap-2 rounded-lg bg-accent/5 p-3">
            <p className="text-sm font-medium text-foreground">Dados da vistoria</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>✓ Título: {inspection.titulo}</li>
              <li>✓ Endereco: {inspection.endereco}</li>
              <li>✓ Responsável: {inspection.responsavel}</li>
              <li>✓ Data: {inspection.dataVistoria}</li>
              <li>
                {inspection.participantes && inspection.participantes.length > 0
                  ? `✓ Participantes: ${inspection.participantes.length}`
                  : "⚠ Nenhum participante adicionado"}
              </li>
            </ul>
          </div>

          {/* Botões de ação */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-12 bg-transparent"
              onClick={handleVisualizar}
              disabled={gerando}
            >
              {gerando ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Eye className="mr-2 h-4 w-4" />
              )}
              Visualizar
            </Button>
            <Button
              type="button"
              className="h-12"
              onClick={handleExportar}
              disabled={gerando}
            >
              {gerando ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
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
