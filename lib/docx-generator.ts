/**
 * DOCX Generator - Gera documentos Word a partir de dados de inspeção
 * 
 * Este arquivo contém toda a lógica para:
 * 1. Baixar um template DOCX do servidor
 * 2. Substituir placeholders pelos dados reais
 * 3. Gerar um novo DOCX com os dados preenchidos
 * 4. Converter para PDF se necessário
 */

import type { Inspection } from "./types"
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
 * Converte DOCX para PDF usando jsPDF
 * 
 * Nota: conversão DOCX→PDF é complexa. Solução recomendada:
 * 1. Client: Usar jsPDF mas precisa converter manualmente para imagem
 * 2. Server: Usar libreoffice comandos ou API externa
 * 3. Alternativa: Gerar PDF diretamente sem DOCX intermediário
 */
export async function convertDocxParaPdf(_docxBlob: Blob): Promise<Blob> {
  // Por enquanto, apenas retorna aviso
  throw new Error(
    "Conversão DOCX→PDF ainda não implementada. " +
    "Use jsPDF para gerar PDF diretamente ou implemente servidor de conversão."
  )
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
`
}
