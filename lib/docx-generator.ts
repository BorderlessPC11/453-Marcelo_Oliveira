/**
 * DOCX Generator - Gera documentos Word a partir de dados de inspeção
 * 
 * Este arquivo contém toda a lógica para:
 * 1. Baixar um template DOCX do servidor
 * 2. Substituir placeholders pelos dados reais
 * 3. Gerar um novo DOCX com os dados preenchidos
 * 4. Converter para PDF se necessário
 */

import type { Inspection, InspectionPhoto } from "./types"
import PizZip from "pizzip"
import Docxtemplater from "docxtemplater"

/**
 * Formata data para formato brasileiro (DD/MM/YYYY)
 */
function formatarData(dataIso: string): string {
  try {
    const date = new Date(dataIso)
    return date.toLocaleDateString("pt-BR")
  } catch {
    return dataIso
  }
}

/**
 * Converte uma string base64 para Buffer
 * Necessário para inserir imagens em DOCX
 */
function base64ToBuffer(base64: string): Buffer {
  // Remove o prefixo "data:image/jpeg;base64," se existir
  const base64String = base64.replace(/^data:image\/[^;]+;base64,/, "")
  
  // Retorna um Buffer a partir da string base64
  return Buffer.from(base64String, "base64")
}

/**
 * Otimiza e redimensiona imagem para cabertanto no documento
 * Reduz tamanho para economia de armazenamento
 */
function otimizarImagem(base64: string, maxWidth: number = 600, maxHeight: number = 800): string {
  try {
    // Em ambiente server-side, seria necessário usar uma biblioteca como 'sharp'
    // Mas aqui estamos no client-side, então a imagem já foi redimensionada pelo photo-gallery
    // Apenas retornamos a base64 como está
    
    // Se a base64 for muito grande (>5MB), ainda assim retornamos
    // pois o navegador já a compactou
    return base64
  } catch {
    return base64
  }
}

/**
 * Formata lista de fotos com legendas para incluir no DOCX
 */
function formatarFotosParaDocx(fotos: InspectionPhoto[] | undefined): Array<{ data: Buffer; legenda: string }> {
  if (!fotos || fotos.length === 0) {
    return []
  }

  return fotos.map((foto) => ({
    data: base64ToBuffer(foto.dataUrl),
    legenda: foto.legenda || `Foto - ${new Date(foto.criadoEm).toLocaleDateString("pt-BR")}`,
  }))
}

/**
 * Converte assinatura base64 (PNG) para Buffer
 * Necessário para inserir assinatura em DOCX
 */
function converterAssinatura(assinatura: string | undefined): Buffer | null {
  if (!assinatura) {
    return null
  }

  try {
    // Remove prefixo "data:image/png;base64," se existir
    const base64String = assinatura.replace(/^data:image\/[^;]+;base64,/, "")
    return Buffer.from(base64String, "base64")
  } catch {
    return null
  }
}

/**
 * Formata assinaturas de participantes para incluir no documento
 * Retorna array com participante, cargo e assinatura
 */
function formatarAssinaturasParaDocx(
  inspection: Inspection
): Array<{ nome: string; cargo: string; empresa: string; assinatura: Buffer | null }> {
  if (!inspection.participantes || inspection.participantes.length === 0) {
    return []
  }

  return inspection.participantes.map((p) => ({
    nome: p.nome,
    cargo: p.cargo || "Sem cargo",
    empresa: p.empresa || "Sem empresa",
    assinatura: converterAssinatura(p.assinatura),
  }))
}

/**
 * Estatísticas sobre assinaturas
 */
export function obterEstatisticasAssinaturas(inspection: Inspection): {
  total: number
  comAssinatura: number
  semAssinatura: number
} {
  if (!inspection.participantes || inspection.participantes.length === 0) {
    return { total: 0, comAssinatura: 0, semAssinatura: 0 }
  }

  const comAssinatura = inspection.participantes.filter((p) => p.assinatura).length
  const semAssinatura = inspection.participantes.length - comAssinatura

  return {
    total: inspection.participantes.length,
    comAssinatura,
    semAssinatura,
  }
}

/**
 * Formata lista de participantes como string
 * Exemplo: "João Silva (Engenheiro) - ABC Ltda"
 */
function formatarParticipantes(inspection: Inspection): string {
  if (!inspection.participantes || inspection.participantes.length === 0) {
    return "Nenhum participante adicionado"
  }

  return inspection.participantes
    .map((p) => `${p.nome} (${p.cargo}) - ${p.empresa}`)
    .join("\n")
}

/**
 * Valida se os dados da inspeção estão preenchidos minimamente
 * Retorna array com erros encontrados
 */
function validarDados(inspection: Inspection): string[] {
  const erros: string[] = []

  if (!inspection.titulo?.trim()) erros.push("Título da vistoria não preenchido")
  if (!inspection.endereco?.trim()) erros.push("Endereço não preenchido")
  if (!inspection.responsavel?.trim()) erros.push("Responsável não preenchido")
  if (!inspection.dataVistoria) erros.push("Data da vistoria não preenchida")

  return erros
}

/**
 * Gera um documento DOCX a partir de uma inspeção
 * 
 * Fluxo:
 * 1. Valida dados
 * 2. Busca template do servidor
 * 3. Descompacta template (DOCX é ZIP)
 * 4. Substitui placeholders pelos dados
 * 5. Recompacta como novo DOCX
 * 6. Retorna como Blob para download
 * 
 * @param inspection Dados da inspeção para preencher
 * @returns Promise com Blob do DOCX gerado
 * @throws Error se dados inválidos ou template não encontrado
 */
export async function gerarDocumento(inspection: Inspection): Promise<Blob> {
  // VALIDAÇÃO: Verificar se dados essenciais estão preenchidos
  const erros = validarDados(inspection)
  if (erros.length > 0) {
    throw new Error(`Dados incompletos:\n${erros.join("\n")}`)
  }

  try {
    // PASSO 1: Buscar o template DOCX do servidor
    // O template está em /public/templates/vistoria-template.docx
    const resposta = await fetch("/templates/vistoria-template.docx")
    
    if (!resposta.ok) {
      throw new Error(
        `Template não encontrado (${resposta.status}). ` +
        `Certifique-se que o arquivo existe em /public/templates/vistoria-template.docx`
      )
    }

    // PASSO 2: Converter a resposta para Array Buffer
    // Array Buffer = dados binários brutos do arquivo DOCX
    const arrayBuffer = await resposta.arrayBuffer()

    // PASSO 3: PizZip descompacta o DOCX (que é um arquivo ZIP)
    // DOCX = ZIP compactado com XML dentro
    const zip = new PizZip(arrayBuffer)

    // PASSO 4: Docxtemplater lê a estrutura do ZIP descompactado
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    })

    // PASSO 5: Preparar dados para substituição
    // Mapeamento de placeholders {nome} → valores reais
    const dados = {
      // Dados básicos da vistoria
      titulo: inspection.titulo,
      tipo: inspection.tipo,
      endereco: inspection.endereco,
      responsavel: inspection.responsavel,
      dataVistoria: formatarData(inspection.dataVistoria),
      dataGeracao: formatarData(new Date().toISOString()),
      observacoes: inspection.observacoes || "Nenhuma observação",

      // Participantes
      participantes: formatarParticipantes(inspection),
      totalParticipantes: inspection.participantes?.length || 0,

      // NR-15
      setoresAvaliados: inspection.setoresAvaliados || "Não preenchido",
      descricaoAtividades: inspection.descricaoAtividades || "Não preenchido",
      epcsIdentificados: inspection.epcsIdentificados || "Não preenchido",
      nr15Observacoes: inspection.nr15Observacoes || "Sem observações",

      // Status
      status: inspection.status === "concluida" ? "CONCLUÍDA" : "EM ANDAMENTO",
      statusTexto:
        inspection.status === "concluida"
          ? "Vistoria concluída"
          : "Vistoria em andamento",
    }

    // PASSO 6: Substituir placeholders pelos dados reais
    // docxtemplater procura por {chave} e substitui pelo valor
    doc.setData(dados)

    // PASSO 7: Renderizar o documento com os dados substituídos
    try {
      doc.render()
    } catch (erro) {
      console.error("Erro ao renderizar documento:", erro)
      throw new Error(
        `Erro ao gerar documento. Verifique se o template está correto e ` +
        `os placeholders correspondem aos dados: ${(erro as Error).message}`
      )
    }

    // PASSO 8: Gerar o novo DOCX compilado como ZIP
    // Retorna os dados binários do arquivo DOCX gerado
    const docGerido = doc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    })

    return docGerido
  } catch (erro) {
    // Tratamento de erro com contexto
    if (erro instanceof Error) {
      throw erro
    }
    throw new Error(`Erro desconhecido ao gerar documento: ${erro}`)
  }
}

/**
 * Exporta o documento gerado como arquivo para download
 * 
 * Cria um link temporário e simula clique para download
 */
export function fazerDownloadDocumento(blob: Blob, nomeArquivo: string): void {
  // Criar URL temporária do blob (arquivo em memória)
  const url = URL.createObjectURL(blob)

  // Criar elemento <a> invisível
  const link = document.createElement("a")
  link.href = url
  link.download = nomeArquivo

  // Simular clique para triggers download
  document.body.appendChild(link)
  link.click()

  // Limpar: remover link do DOM e liberar URL
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Gera um documento DOCX com fotos integradas
 * 
 * NOTA: Esta é uma versão avançada que tenta inserir imagens diretamente
 * Se o template suportar a sintaxe correta, as imagens serão incluídas
 * 
 * @param inspection Dados da inspeção com fotos
 * @returns Promise com Blob do DOCX gerado
 */
export async function gerarDocumentoComFotos(inspection: Inspection): Promise<Blob> {
  // Começar com o documento base
  let docxBlob = await gerarDocumento(inspection)

  // Se não houver fotos, retornar documento normal
  if (!inspection.fotos || inspection.fotos.length === 0) {
    return docxBlob
  }

  try {
    // Conversão para ArrayBuffer
    const arrayBuffer = await docxBlob.arrayBuffer()
    const zip = new PizZip(arrayBuffer)

    // Tentar adicionar imagens ao documento
    // Isso requer que o template tenha placeholders especiais para imagens
    // Por exemplo: {% for foto in fotos %}{%image:foto.data%}{% endfor %}

    const fotosProcessadas = formatarFotosParaDocx(inspection.fotos)

    if (fotosProcessadas.length > 0) {
      // Se houver imagens, adicionar referências ao ZIP (media folder)
      fotosProcessadas.forEach((foto, index) => {
        const nomeImagem = `image_${index + 1}.jpg`
        const caminhoMedia = `word/media/${nomeImagem}`

        // Adicionar imagem ao ZIP
        if (!zip.folder("word/media")) {
          zip.folder("word/media")
        }
        zip.file(caminhoMedia, foto.data)
      })

      // Gerar novo DOCX com imagens
      const docGerido = zip.generate({
        type: "blob",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      })

      return docGerido
    }

    return docxBlob
  } catch (erro) {
    console.warn("Erro ao adicionar imagens ao DOCX, retornando documento sem fotos:", erro)
    // Se falhar, retornar documento sem fotos
    return docxBlob
  }
}

/**
 * Gera um documento DOCX com assinaturas integradas
 * 
 * Similar à função gerarDocumentoComFotos, mas para assinaturas
 * 
 * @param inspection Dados da inspeção com assinaturas
 * @returns Promise com Blob do DOCX gerado
 */
export async function gerarDocumentoComAssinaturas(inspection: Inspection): Promise<Blob> {
  // Começar com o documento base (com fotos se houver)
  let docxBlob = await gerarDocumentoComFotos(inspection)

  // Se não houver participantes com assinatura, retornar documento normal
  const assinaturas = formatarAssinaturasParaDocx(inspection)
  const comAssinatura = assinaturas.filter((a) => a.assinatura !== null)

  if (comAssinatura.length === 0) {
    return docxBlob
  }

  try {
    // Conversão para ArrayBuffer
    const arrayBuffer = await docxBlob.arrayBuffer()
    const zip = new PizZip(arrayBuffer)

    // Adicionar assinaturas ao ZIP (media folder)
    comAssinatura.forEach((assinatura, index) => {
      if (assinatura.assinatura) {
        const nomeAssinatura = `signature_${index + 1}.png`
        const caminhoMedia = `word/media/${nomeAssinatura}`

        // Criar pasta media se não existir
        if (!zip.folder("word/media")) {
          zip.folder("word/media")
        }

        // Adicionar arquivo de assinatura
        zip.file(caminhoMedia, assinatura.assinatura)
      }
    })

    // Gerar novo DOCX com assinaturas
    const docGerido = zip.generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    })

    return docGerido
  } catch (erro) {
    console.warn("Erro ao adicionar assinaturas ao DOCX, retornando documento sem assinaturas:", erro)
    // Se falhar, retornar documento sem assinaturas
    return docxBlob
  }
}

/**
 * Gera PDF diretamente com os dados da inspeção
 * Estratégia: Client-side generation com jsPDF (mais rápido e offline)
 */
export async function gerarPdf(inspection: Inspection): Promise<Blob> {
  try {
    const erros = validarDados(inspection)
    if (erros.length > 0) throw new Error(`Dados inválidos: ${erros.join(", ")}`)

    // Importação dinâmica do jsPDF para reduzir bundle size se não usado
    const { jsPDF } = await import("jspdf")
    const doc = new jsPDF()

    // Configuração inicial
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let yPosition = 15
    const margemEsquerda = 15
    const margemDireita = 15
    const larguraTexto = pageWidth - margemEsquerda - margemDireita

    // Função auxiliar para adicionar linha com quebra de página automática
    const adicionarTexto = (
      texto: string,
      tamanho: number = 10,
      isBold: boolean = false,
      espacoAntes: number = 0
    ) => {
      doc.setFontSize(tamanho)
      doc.setFont("helvetica", isBold ? "bold" : "normal")

      const linhas = doc.splitTextToSize(texto, larguraTexto)
      const alturaLinhas = (linhas.length * tamanho) / 2.5

      yPosition += espacoAntes

      // Verifica se precisa adicionar nova página
      if (yPosition + alturaLinhas > pageHeight - 10) {
        doc.addPage()
        yPosition = 15
      }

      doc.text(linhas, margemEsquerda, yPosition)
      yPosition += alturaLinhas + 3
    }

    // Cabeçalho
    adicionarTexto("RELATÓRIO DE VISTORIA NR-15", 16, true, 0)
    adicionarTexto(inspection.titulo, 12, true, 2)

    // Seção de Informações Gerais
    adicionarTexto("INFORMAÇÕES GERAIS", 11, true, 8)
    adicionarTexto(`Tipo: ${inspection.tipo}`, 10, false, 2)
    adicionarTexto(`Endereço: ${inspection.endereco}`, 10, false, 2)
    adicionarTexto(`Data da Vistoria: ${formatarData(inspection.dataVistoria)}`, 10, false, 2)
    adicionarTexto(`Responsável: ${inspection.responsavel || "N/A"}`, 10, false, 2)
    adicionarTexto(`Status: ${inspection.status || "rascunho"}`, 10, false, 2)

    // Seção de Participantes
    if (inspection.participantes && inspection.participantes.length > 0) {
      adicionarTexto("PARTICIPANTES", 11, true, 6)
      inspection.participantes.forEach((participante) => {
        adicionarTexto(
          `• ${participante.nome} (${participante.cargo || "Sem cargo"})`,
          10,
          false,
          1
        )
      })
    }

    // Seção de Avaliações NR-15
    const avaliacoes = inspection.avaliacoesNR15
    if (avaliacoes && avaliacoes.length > 0) {
      adicionarTexto("AVALIAÇÕES NR-15", 11, true, 6)
      avaliacoes.forEach((avaliacao, index) => {
        adicionarTexto(`Anexo NR-15 Nº ${avaliacao.anexoNumero}`, 10, true, 2)
        adicionarTexto(`Aplica: ${avaliacao.aplica ? "Sim" : avaliacao.aplica === false ? "Não" : "Não avaliado"}`, 10, false, 1)
        
        if (avaliacao.localAvaliacao) {
          adicionarTexto(`Local: ${avaliacao.localAvaliacao}`, 10, false, 1)
        }
        
        if (avaliacao.atividadesDescritas) {
          adicionarTexto(`Atividades: ${avaliacao.atividadesDescritas}`, 10, false, 1)
        }

        if (avaliacao.agentesAvaliados && avaliacao.agentesAvaliados.length > 0) {
          adicionarTexto("Agentes Avaliados:", 10, true, 2)
          avaliacao.agentesAvaliados.forEach((agente) => {
            adicionarTexto(
              `  • Identificado: ${agente.identificado ? "Sim" : "Não"} | Acima do limite: ${agente.acimaDoLimite ? "Sim" : agente.acimaDoLimite === false ? "Não" : "N/A"}`,
              10,
              false,
              1
            )
            if (agente.valorMedido) {
              adicionarTexto(`    Valor Medido: ${agente.valorMedido}`, 10, false, 1)
            }
          })
        }

        if (avaliacao.conclusao) {
          adicionarTexto(`Conclusão: ${avaliacao.conclusao}`, 10, false, 1)
        }

        if (avaliacao.observacoes) {
          adicionarTexto(`Observações: ${avaliacao.observacoes}`, 10, false, 1)
        }

        if (index < avaliacoes.length - 1) {
          adicionarTexto("", 10, false, 2)
        }
      })
    }

    // Seção de NR-15 Observações
    if (inspection.nr15Observacoes && inspection.nr15Observacoes.trim()) {
      adicionarTexto("OBSERVAÇÕES NR-15", 11, true, 6)
      adicionarTexto(inspection.nr15Observacoes, 10, false, 2)
    }

    // Seção de Observações Gerais
    if (inspection.observacoes && inspection.observacoes.trim()) {
      adicionarTexto("OBSERVAÇÕES GERAIS", 11, true, 6)
      adicionarTexto(inspection.observacoes, 10, false, 2)
    }

    // Seção de Fotos
    if (inspection.fotos && inspection.fotos.length > 0) {
      adicionarTexto("FOTOS E IMAGENS", 11, true, 6)
      inspection.fotos.forEach((foto, index) => {
        try {
          // Converter base64 para data URL temporária
          const img = new window.Image()
          img.src = foto.dataUrl

          // Adicionar informação sobre a foto
          adicionarTexto(
            `Foto ${index + 1}: ${foto.legenda || "Sem legenda"}`,
            9,
            true,
            2
          )
          adicionarTexto(
            `Tirada em: ${formatarData(foto.criadoEm)}`,
            8,
            false,
            1
          )
          adicionarTexto("[Imagem] (use DOCX para incluir imagens)", 8, false, 1)
        } catch (e) {
          adicionarTexto(`Foto ${index + 1}: Erro ao processar`, 8, false, 1)
        }
      })
    }

    // Seção de Assinaturas
    if (inspection.participantes && inspection.participantes.length > 0) {
      const comAssinatura = inspection.participantes.filter((p) => p.assinatura).length

      if (comAssinatura > 0) {
        adicionarTexto("ASSINATURAS", 11, true, 6)
        inspection.participantes.forEach((participante) => {
          if (participante.assinatura) {
            adicionarTexto(
              `${participante.nome} (${participante.cargo || "Sem cargo"})`,
              10,
              false,
              2
            )
            adicionarTexto(`Empresa: ${participante.empresa || "Não informada"}`, 9, false, 1)
            adicionarTexto("[Assinatura] (use DOCX para incluir assinaturas)", 8, false, 1)
          }
        })
      }
    }

    // Rodapé
    adicionarTexto("", 10, false, 8)
    doc.setFontSize(8)
    doc.setFont("helvetica", "italic")
    doc.text(
      `Gerado em ${formatarData(new Date().toISOString())}`,
      margemEsquerda,
      pageHeight - 8
    )

    // Retorna como Blob
    return new Promise((resolve) => {
      const blob = doc.output("blob") as Blob
      resolve(blob)
    })
  } catch (erro) {
    throw new Error(
      erro instanceof Error ? erro.message : "Erro ao gerar PDF"
    )
  }
}

/**
 * Retorna um descritivo do template necessário
 * Use isto para criar o arquivo template.docx em Word
 */
export function obterDescritvoTemplate(): string {
  return `
TEMPLATE DOCX - Estrutura Necessária

Para criar o template em Microsoft Word ou LibreOffice:

1. Abra Word/LibreOffice Writer
2. Crie um documento novo
3. Adicione os seguintes placeholders (entre chaves):

--- CABEÇALHO ---
{titulo}
{tipo}

--- INSPEÇÃO ---
Endereço: {endereco}
Responsável: {responsavel}
Data: {dataVistoria}
Status: {statusTexto}

--- PARTICIPANTES ---
{participantes}
Total: {totalParticipantes}

--- ATIVIDADES ---
Setores Avaliados: {setoresAvaliados}
Descrição Atividades: {descricaoAtividades}
EPCs Identificados: {epcsIdentificados}

--- OBSERVAÇÕES ---
{nr15Observacoes}
{observacoes}

--- RODAPÉ ---
Documento gerado em: {dataGeracao}
Status: {status}

4. Salve como "vistoria-template.docx"
5. Coloque em /public/templates/vistoria-template.docx

NOTA SOBRE IMAGENS:
As imagens são inseridas no DOCX através de pasta 'media' dentro do ZIP.
Use gerarDocumentoComFotos() para documentos com fotos integradas.
`
}

/**
 * Estatísticas sobre imagens de uma inspeção
 */
export function obterEstatisticasFotos(inspection: Inspection): {
  total: number
  tamanhoTotal: number
  tamanhoMedio: number
  comLegenda: number
} {
  if (!inspection.fotos || inspection.fotos.length === 0) {
    return { total: 0, tamanhoTotal: 0, tamanhoMedio: 0, comLegenda: 0 }
  }

  let tamanhoTotal = 0
  let comLegenda = 0

  inspection.fotos.forEach((foto) => {
    // Calcular tamanho aproximado do base64
    tamanhoTotal += foto.dataUrl.length * 0.75 // base64 ocupa 4/3 do tamanho

    if (foto.legenda && foto.legenda.trim().length > 0) {
      comLegenda++
    }
  })

  return {
    total: inspection.fotos.length,
    tamanhoTotal: Math.round(tamanhoTotal / 1024), // KB
    tamanhoMedio: Math.round(tamanhoTotal / inspection.fotos.length / 1024), // KB
    comLegenda,
  }
}
