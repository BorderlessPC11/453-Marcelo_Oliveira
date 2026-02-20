"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { FileText, Eye, Download, Info, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getInspection } from "@/lib/store"
import { gerarDocumento, gerarPdf, fazerDownloadDocumento, obterDescritvoTemplate, verificarTemplateIntegridade } from "@/lib/docx-generator"
import { validarInspecaoParaDocumento } from "@/lib/validation"
import type { Inspection } from "@/lib/types"

interface DocumentGenerationProps {
  id: string
}

export function DocumentGeneration({ id }: DocumentGenerationProps) {
  const router = useRouter()
  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [mounted, setMounted] = useState(false)
  const [gerando, setGerando] = useState(false)
  const [validacao, setValidacao] = useState<any>(null)
  const [checandoTemplate, setChecandoTemplate] = useState(false)
  const [templateOK, setTemplateOK] = useState<boolean | null>(null)

  /**
   * EFFECT 1: Carregar inspeção quando componente monta
   * 
   * Busca os dados da vistoria usando ID do parâmetro de rota
   */
  useEffect(() => {
    setMounted(true)
    const data = getInspection(id)
    setInspection(data || null)
  }, [id])

  /**
   * EFFECT 2: Validar inspeção quando dados carregam
   * 
   * Executa validação completa (dados, participantes, NR-15, etc)
   * Armazena resultado para mostrar feedback ao usuário
   */
  useEffect(() => {
    if (inspection) {
      // Chamar validação unificada de validação.ts
      const resultado = validarInspecaoParaDocumento(inspection)
      setValidacao(resultado)
    }
  }, [inspection])

  /**
   * EFFECT 3: Verificar integridade do template na primeira montagem
   * 
   * Valida se o arquivo DOCX template existe e está correto
   * Mostra avisos se houver problemas
   */
  useEffect(() => {
    if (!mounted) return

    const verificar = async () => {
      setChecandoTemplate(true)
      try {
        const resultado = await verificarTemplateIntegridade()
        setTemplateOK(resultado.isValid)

        if (!resultado.isValid) {
          console.warn("Template com problemas:", resultado.detalhes)
          toast.warning("Template DOCX pode estar com problemas. Geração pode falhar.", {
            description: resultado.detalhes.slice(0, 3).join("\n"),
            duration: 5000,
          })
        }
      } catch (erro) {
        console.error("Erro ao verificar template:", erro)
        setTemplateOK(false)
      } finally {
        setChecandoTemplate(false)
      }
    }

    verificar()
  }, [mounted])

  /**
   * Função para gerar o documento DOCX
   * 
   * Passos:
   * 1. Validar inspeção (erros críticos bloqueiam)
   * 2. Mostrar indicador de carregamento
   * 3. Chamar gerarDocumento() que faz todas as transformações
   * 4. Se sucesso: fazer download automático
   * 5. Se erro: mostrar mensagem descritiva
   */
  const handleExportar = async () => {
    if (!inspection) {
      toast.error("Vistoria não encontrada")
      return
    }

    // Se há erros críticos, não gerar
    if (!validacao?.isValid) {
      toast.error("Não é possível gerar documento", {
        description: "Existem campos obrigatórios não preenchidos. Revise e tente novamente.",
        duration: 5000,
      })
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
      toast.error("Erro ao gerar documento", {
        description: mensagem,
        duration: 5000,
      })
    } finally {
      setGerando(false)
    }
  }

  /**
   * Função para visualizar o documento (abre em nova aba)
   * 
   * Passos:
   * 1. Validar inspeção e erros críticos
   * 2. Gerar o PDF em memória
   * 3. Criar URL temporária do Blob
   * 4. Abrir em nova aba do navegador
   */
  const handleVisualizar = async () => {
    if (!inspection) {
      toast.error("Vistoria não encontrada")
      return
    }

    if (!validacao?.isValid) {
      toast.error("Não é possível gerar documento", {
        description: "Existem campos obrigatórios não preenchidos.",
      })
      return
    }

    setGerando(true)
    try {
      // Gerar o PDF para visualização no navegador
      const pdfBlob = await gerarPdf(inspection)

      // Criar URL temporária do blob (arquivo em memória do navegador)
      const url = URL.createObjectURL(pdfBlob)

      // Abrir em nova aba
      const novaAba = window.open(url, "_blank", "noopener,noreferrer")
      if (!novaAba) {
        toast.warning("Não foi possível abrir a visualização", {
          description: "Seu navegador bloqueou a nova aba. Permita pop-ups e tente novamente.",
        })
      }

      // Liberar a URL após algum tempo para evitar vazamento de memória
      setTimeout(() => URL.revokeObjectURL(url), 60_000)

      toast.success("PDF aberto em nova aba!")
    } catch (erro) {
      console.error("Erro ao visualizar documento:", erro)
      const mensagem = erro instanceof Error ? erro.message : "Erro desconhecido"
      toast.error("Erro ao visualizar", { description: mensagem })
    } finally {
      setGerando(false)
    }
  }

  /**
   * Função para exportar em PDF
   * 
   * Usa jsPDF para gerar PDF (melhor para offline)
   * Menos formatação que DOCX mas funciona sem template
   */
  const handleExportarPdf = async () => {
    if (!inspection) {
      toast.error("Vistoria não encontrada")
      return
    }

    if (!validacao?.isValid) {
      toast.error("Não é possível gerar documento", {
        description: "Existem campos obrigatórios não preenchidos.",
      })
      return
    }

    setGerando(true)
    try {
      // Gerar o PDF
      const pdfBlob = await gerarPdf(inspection)

      // Criar nome do arquivo
      const dataFormatada = inspection.dataVistoria.split("-").reverse().join("-")
      const nomeArquivo = `Vistoria_${inspection.titulo}_${dataFormatada}.pdf`

      // Fazer download
      fazerDownloadDocumento(pdfBlob, nomeArquivo)

      toast.success("PDF exportado com sucesso!")
    } catch (erro) {
      console.error("Erro ao exportar PDF:", erro)
      const mensagem = erro instanceof Error ? erro.message : "Erro desconhecido"
      toast.error("Erro ao gerar PDF", { description: mensagem })
    } finally {
      setGerando(false)
    }
  }

  /**
   * Mostra instruções de como criar o template DOCX
   * 
   * Útil se usuário quer customizar o template
   */
  const handleMostrarInstrucoes = () => {
    const instrucoes = obterDescritvoTemplate()
    // Copiar para clipboard
    navigator.clipboard.writeText(instrucoes)
    toast.success("Instruções copiadas para clipboard!", {
      description: "Cole em um arquivo de texto para referência.",
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
      {/* ╔═══════════════════════════════════════════════════════════════════╗ */}
      {/* ║ SEÇÃO 1: VERIFICAÇÃO DE TEMPLATE                                 ║ */}
      {/* ╚═══════════════════════════════════════════════════════════════════╝ */}

      {checandoTemplate && (
        <Alert>
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertDescription>Verificando integridade do template...</AlertDescription>
        </Alert>
      )}

      {templateOK === false && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Template DOCX pode estar corrompido. A geração pode falhar. 
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-2 h-auto p-0"
              onClick={handleMostrarInstrucoes}
            >
              Ver instruções
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* ╔═══════════════════════════════════════════════════════════════════╗ */}
      {/* ║ SEÇÃO 2: RESULTADO DA VALIDAÇÃO                                  ║ */}
      {/* ╚═══════════════════════════════════════════════════════════════════╝ */}

      {validacao && (
        <Card
          className={
            validacao.isValid
              ? "border-green-200 bg-green-50"
              : "border-red-200 bg-red-50"
          }
        >
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              {validacao.isValid ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <CardTitle className={validacao.isValid ? "text-green-900" : "text-red-900"}>
                {validacao.isValid
                  ? "✅ Pronto para gerar documento"
                  : "❌ Documento não pode ser gerado"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p
              className={
                validacao.isValid
                  ? "text-sm text-green-800 whitespace-pre-wrap"
                  : "text-sm text-red-800 whitespace-pre-wrap"
              }
            >
              {validacao.mensagemFormatada}
            </p>
          </CardContent>
        </Card>
      )}

      {/* ╔═══════════════════════════════════════════════════════════════════╗ */}
      {/* ║ SEÇÃO 3: BOTÕES DE AÇÃO                                          ║ */}
      {/* ╚═══════════════════════════════════════════════════════════════════╝ */}

      <div className="grid grid-cols-1 gap-3 pt-4">
        {/* Botão: Exportar DOCX */}
        <Button
          onClick={handleExportar}
          disabled={
            gerando || !validacao?.isValid || (templateOK === false)
          }
          className="h-12 text-base"
        >
          {gerando ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Download className="mr-2 h-5 w-5" />
          )}
          Exportar como DOCX
        </Button>

        {/* Botão: Visualizar */}
        <Button
          onClick={handleVisualizar}
          disabled={
            gerando || !validacao?.isValid || (templateOK === false)
          }
          variant="outline"
          className="h-12 text-base"
        >
          {gerando ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Eye className="mr-2 h-5 w-5" />
          )}
          Visualizar
        </Button>

        {/* Botão: Exportar PDF */}
        <Button
          onClick={handleExportarPdf}
          disabled={gerando || !validacao?.isValid}
          variant="outline"
          className="h-12 text-base"
        >
          {gerando ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <FileText className="mr-2 h-5 w-5" />
          )}
          Exportar como PDF
        </Button>
      </div>

      <Separator className="my-4" />

      {/* ╔═══════════════════════════════════════════════════════════════════╗ */}
      {/* ║ SEÇÃO 4: RESUMO DA VISTORIA                                      ║ */}
      {/* ╚═══════════════════════════════════════════════════════════════════╝ */}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Resumo da Vistoria
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Título:</span>
              <p className="text-foreground">{inspection.titulo}</p>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Data:</span>
              <p className="text-foreground">
                {new Date(inspection.dataVistoria).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Condomínio:</span>
            <p className="text-foreground">{inspection.condominio}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Torre:</span>
            <p className="text-foreground">{inspection.torre}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Local:</span>
            <p className="text-foreground">{inspection.local}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-2 text-center">
            <div className="rounded-lg bg-muted p-2">
              <p className="text-sm font-medium">
                {inspection.participantes?.length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Participantes</p>
            </div>
            <div className="rounded-lg bg-muted p-2">
              <p className="text-sm font-medium">{inspection.fotos?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Fotos</p>
            </div>
            <div className="rounded-lg bg-muted p-2">
              <p className="text-sm font-medium">
                {inspection.avaliacoesNR15?.filter((a) => a.aplica === true).length || 0}
              </p>
              <p className="text-xs text-muted-foreground">Anexos NR-15</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
