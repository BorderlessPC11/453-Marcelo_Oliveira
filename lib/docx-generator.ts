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
import ImageModule from "open-docxtemplater-image-module"

const AUTO_SECTION_FOTOS = [
  "<w:p><w:r><w:t>Fotos</w:t></w:r></w:p>",
  "<w:p><w:r><w:t>{#fotos}</w:t></w:r></w:p>",
  "<w:p><w:r><w:t>{%foto}</w:t></w:r></w:p>",
  "<w:p><w:r><w:t>{legenda}</w:t></w:r></w:p>",
  "<w:p><w:r><w:t>{/fotos}</w:t></w:r></w:p>",
].join("")

const AUTO_SECTION_ASSINATURAS = [
  "<w:p><w:r><w:t>Assinaturas</w:t></w:r></w:p>",
  "<w:p><w:r><w:t>{#assinaturas}</w:t></w:r></w:p>",
  "<w:p><w:r><w:t>{nome} - {cargo} - {empresa}</w:t></w:r></w:p>",
  "<w:p><w:r><w:t>{%assinatura}</w:t></w:r></w:p>",
  "<w:p><w:r><w:t>{/assinaturas}</w:t></w:r></w:p>",
].join("")

function injetarSecoesAutomaticas(templateXml: string): string {
  const hasFotos = templateXml.includes("{#fotos}")
  const hasAssinaturas = templateXml.includes("{#assinaturas}")

  if (hasFotos && hasAssinaturas) {
    return templateXml
  }

  let insertIndex = templateXml.lastIndexOf("</w:body>")
  if (insertIndex === -1) {
    return templateXml
  }

  const sectPrIndex = templateXml.indexOf("<w:sectPr")
  if (sectPrIndex !== -1 && sectPrIndex < insertIndex) {
    insertIndex = sectPrIndex
  }

  let injection = ""
  if (!hasFotos) {
    injection += AUTO_SECTION_FOTOS
  }
  if (!hasAssinaturas) {
    injection += AUTO_SECTION_ASSINATURAS
  }

  return (
    templateXml.slice(0, insertIndex) +
    injection +
    templateXml.slice(insertIndex)
  )
}

function criarTemplateBasicoComImagens(): PizZip {
  const wordXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document 
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>
    <w:p><w:r><w:t>{titulo}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Condomínio: {condominio}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Torre: {torre}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Local: {local}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Data da Vistoria: {dataVistoria}</w:t></w:r></w:p>
    <w:p><w:r><w:t>Horário: {horarioInicio} ate {horarioFim}</w:t></w:r></w:p>

    <w:p><w:r><w:t>Participantes ({totalParticipantes})</w:t></w:r></w:p>
    <w:p><w:r><w:t>{participantes}</w:t></w:r></w:p>

    <w:p><w:r><w:t>Fotos</w:t></w:r></w:p>
    <w:p><w:r><w:t>{#fotos}</w:t></w:r></w:p>
    <w:p><w:r><w:t>{%foto}</w:t></w:r></w:p>
    <w:p><w:r><w:t>{legenda}</w:t></w:r></w:p>
    <w:p><w:r><w:t>{/fotos}</w:t></w:r></w:p>

    <w:p><w:r><w:t>Assinaturas</w:t></w:r></w:p>
    <w:p><w:r><w:t>{#assinaturas}</w:t></w:r></w:p>
    <w:p><w:r><w:t>{nome} - {cargo} - {empresa}</w:t></w:r></w:p>
    <w:p><w:r><w:t>{%assinatura}</w:t></w:r></w:p>
    <w:p><w:r><w:t>{/assinaturas}</w:t></w:r></w:p>
  </w:body>
</w:document>`

  const zip = new PizZip()
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`
  )

  zip.folder("_rels")
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  )

  zip.file("word/document.xml", wordXml)

  zip.file(
    "word/styles.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
        <w:sz w:val="22"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:qFormat/>
  </w:style>
</w:styles>`
  )

  zip.folder("word/_rels")
  zip.file(
    "word/_rels/document.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
  )

  return zip
}

function patchScopeManagerGetValue(scopeManager: any): void {
  if (!scopeManager || scopeManager.__patchedGetValue) {
    return
  }

  const originalGetValue = scopeManager.getValue?.bind(scopeManager)
  if (!originalGetValue) {
    return
  }

  scopeManager.getValue = (
    tag: string,
    meta?: { part?: { lIndex: number; offset: number } }
  ) => {
    if (!meta || !meta.part) {
      return originalGetValue(tag, { part: { lIndex: 0, offset: 0 } })
    }
    return originalGetValue(tag, meta)
  }

  scopeManager.__patchedGetValue = true
}

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

function normalizeImageDataUrl(value: string | undefined, mimeType: string): string {
  if (!value) {
    return ""
  }

  if (value.startsWith("data:image/")) {
    return value
  }

  if (value.startsWith("data:")) {
    return value
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return ""
  }

  return `data:${mimeType};base64,${trimmed}`
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
 * Valida um anexo NR-15 específico quando está marcado como aplicável
 * 
 * Se um anexo tem aplica=true, seus campos de dados tornam-se obrigatórios:
 * - localAvaliacao: onde foi realizada a avaliação
 * - atividadesDescritas: quais atividades foram observadas
 * - epicUtilizados: EPIs encontrados
 * - agentesAvaliados: pelo menos um agente deve estar marcado como identificado
 * 
 * @param avaliacao Os dados da avaliação do anexo
 * @param numeroAnexo Número do anexo NR-15 para mensagens de erro
 * @returns Array com erros encontrados
 */
function validarAnexoNR15(avaliacao: any, numeroAnexo: number): string[] {
  const erros: string[] = []

  // Se o anexo NÃO foi avaliado, não há validação necessária
  if (avaliacao.aplica === null || avaliacao.aplica === false) {
    return erros
  }

  // Se aplicável (aplica === true), validar campos obrigatórios
  // Campo 1: Descrição do local onde foi feita a avaliação
  if (!avaliacao.localAvaliacao?.trim()) {
    erros.push(`[Anexo ${numeroAnexo}] Local da avaliação não preenchido`)
  }

  // Campo 2: Descrever quais atividades foram observadas
  if (!avaliacao.atividadesDescritas?.trim()) {
    erros.push(`[Anexo ${numeroAnexo}] Atividades descritas não preenchidas`)
  }

  // Campo 3: EPIs identificados no local
  if (!avaliacao.episUtilizados?.trim()) {
    erros.push(`[Anexo ${numeroAnexo}] EPIs utilizados não preenchidos`)
  }

  // Campo 4: Pelo menos um agente deve estar avaliado
  const agentesIdentificados = avaliacao.agentesAvaliados?.filter((a: any) => a.identificado === true) || []
  if (agentesIdentificados.length === 0) {
    erros.push(`[Anexo ${numeroAnexo}] Nenhum agente foi marcado como identificado`)
  }

  // Campo 5 (obrigatório se houver agentes identificados): Conclusão
  if (agentesIdentificados.length > 0 && !avaliacao.conclusao?.trim()) {
    erros.push(`[Anexo ${numeroAnexo}] Conclusão sobre os agentes identificados não preenchida`)
  }

  return erros
}

/**
 * Valida se todos os anexos NR-15 marcados como "APLICA" têm dados completos
 * 
 * Esta é uma validação de negócio importante: nós não permitimos gerar
 * um documento se um anexo foi avaliado (aplica=true) mas não tem dados completos
 * 
 * @param inspection A vistoria com as avaliações NR-15
 * @returns Array com todos os erros encontrados em todos os anexos
 */
function validarTodosAnexosAplicaveis(inspection: Inspection): string[] {
  const erros: string[] = []

  // Se não houver avaliações NR-15, não há o que validar
  if (!inspection.avaliacoesNR15 || inspection.avaliacoesNR15.length === 0) {
    return erros
  }

  // Verificar cada anexo avaliado
  inspection.avaliacoesNR15.forEach((avaliacao) => {
    // Para cada anexo, validar seus campos se estiver marcado como aplicável
    const errosAnexo = validarAnexoNR15(avaliacao, avaliacao.anexoNumero)
    erros.push(...errosAnexo)
  })

  return erros
}

/**
 * Valida se os dados da inspeção estão preenchidos minimamente
 * Retorna array com erros encontrados
 * 
 * VALIDAÇÕES CRÍTICAS:
 * 1. Dados básicos obrigatórios (títhulo, endereço, responsável, data)
 * 2. Pelo menos um participante deve estar registrado
 * 3. Todos os anexos NR-15 "aplicáveis" devem ter dados completos
 * 4. Se houver fotos, todas devem ter legendas
 * 
 * Esta é a função de "guarda" antes de gerar o documento.
 * Se retornar erros, o documento não deve ser gerado.
 */
function validarDados(inspection: Inspection): string[] {
  const erros: string[] = []

  // VALIDAÇÃO 1: Dados básicos obrigatórios
  if (!inspection.titulo?.trim()) {
    erros.push("❌ Título da vistoria não preenchido")
  }
  if (!inspection.local?.trim()) {
    erros.push("❌ Local não preenchido")
  }
  if (!inspection.condominio?.trim()) {
    erros.push("❌ Condomínio não preenchido")
  }
  if (!inspection.torre?.trim()) {
    erros.push("❌ Torre não preenchida")
  }
  if (!inspection.dataVistoria) {
    erros.push("❌ Data da vistoria não preenchida")
  }
  if (!inspection.horarioInicio) {
    erros.push("❌ Horário de início não preenchido")
  }
  if (!inspection.horarioFim) {
    erros.push("❌ Horário de término não preenchido")
  }
  if (inspection.horarioInicio && inspection.horarioFim && inspection.horarioFim <= inspection.horarioInicio) {
    erros.push("❌ Horário de término deve ser posterior ao início")
  }

  // VALIDAÇÃO 2: Deve haver pelo menos um participante
  if (!inspection.participantes || inspection.participantes.length === 0) {
    erros.push("❌ Nenhum participante registrado. Adicione pelo menos um participante")
  }

  // VALIDAÇÃO 3: Se houver participantes, verificar quem já assinou e quem falta
  if (inspection.participantes && inspection.participantes.length > 0) {
    const semAssinadura = inspection.participantes.filter((p) => !p.assinatura).length
    if (semAssinadura > 0) {
      // Esta é um AVISO, não erro crítico
      // Mas registramos para mostrar ao usuário
      erros.push(`⚠️ ${semAssinadura} participante(s) ainda não assinaram o documento`)
    }
  }

  // VALIDAÇÃO 4: Validar campos NR-15 obrigatórios
  // Isto valida TODOS os anexos marcados como aplicáveis
  const errosNR15 = validarTodosAnexosAplicaveis(inspection)
  if (errosNR15.length > 0) {
    erros.push(...errosNR15)
  }

  // VALIDAÇÃO 5: Se houver fotos, verificar legendas
  if (inspection.fotos && inspection.fotos.length > 0) {
    const fotosSemusLegenda = inspection.fotos.filter((f) => !f.legenda?.trim())
    if (fotosSemusLegenda.length > 0) {
      erros.push(`⚠️ ${fotosSemusLegenda.length} foto(s) não têm legenda`)
    }
  }

  return erros
}

/**
 * Verifica a integridade do template DOCX
 * 
 * Valida que:
 * 1. O arquivo existe em /public/templates/vistoria-template.docx
 * 2. O arquivo é um ZIP válido (DOCX = ZIP)
 * 3. Contém a estrutura básica de um DOCX (pasta word/, document.xml, etc)
 * 4. Contém placeholders esperados no documento
 * 
 * Esta função vai ajudar a debugar problemas com o template
 * 
 * @returns Promise com resultado da validação
 */
export async function verificarTemplateIntegridade(): Promise<{
  isValid: boolean
  mensagem: string
  detalhes: string[]
}> {
  const detalhes: string[] = []
  let isValid = true

  try {
    // PASSO 1: Verificar se arquivo existe
    detalhes.push("1️⃣ Verificando se template existe em /public/templates/vistoria-template.docx")
    const resposta = await fetch("/templates/vistoria-template.docx")

    if (!resposta.ok) {
      detalhes.push(`   ❌ Arquivo não encontrado (HTTP ${resposta.status})`)
      return {
        isValid: false,
        mensagem: "Template não encontrado",
        detalhes,
      }
    }
    detalhes.push("   ✅ Arquivo existe e é acessível")

    // PASSO 2: Tentar converter para ZIP
    detalhes.push("2️⃣ Tentando descompactar como ZIP (DOCX é um arquivo ZIP)")
    const arrayBuffer = await resposta.arrayBuffer()

    try {
      const zip = new PizZip(arrayBuffer)
      detalhes.push("   ✅ Arquivo é um ZIP válido")

      // PASSO 3: Verficar estrutura interna
      detalhes.push("3️⃣ Verificando estrutura interna do DOCX")

      // Um DOCX válido deve ter word/document.xml
      const documentXml = zip.file("word/document.xml")
      if (!documentXml) {
        detalhes.push("   ⚠️ Arquivo não contém word/document.xml (pode estar corrompido)")
        isValid = false
      } else {
        detalhes.push("   ✅ Contém word/document.xml")

        // PASSO 4: Procurar por placeholders esperados
        detalhes.push("4️⃣ Procurando por placeholders esperados")
        const xmlContent = documentXml.asText()

        const placeholdersEsperados = [
          "titulo",
          "endereco",
          "responsavel",
          "dataVistoria",
          "participantes",
        ]

        const placeholdersEncontrados: string[] = []
        const placeholdersFaltando: string[] = []

        placeholdersEsperados.forEach((ph) => {
          // Procura por {nome} no documento
          if (xmlContent.includes(`{${ph}}`) || xmlContent.includes(`${ph}`)) {
            placeholdersEncontrados.push(ph)
          } else {
            placeholdersFaltando.push(ph)
          }
        })

        if (placeholdersEncontrados.length > 0) {
          detalhes.push(`   ✅ Placeholders encontrados: ${placeholdersEncontrados.join(", ")}`)
        }

        if (placeholdersFaltando.length > 0) {
          detalhes.push(`   ⚠️ Placeholders faltando: ${placeholdersFaltando.join(", ")}`)
          isValid = false
        }
      }

      // PASSO 5: Verificar pasta media (para imagens)
      detalhes.push("5️⃣ Verificando pasta media/ (para imagens e assinaturas)")
      const mediaFolder = zip.folder("word/media")
      if (mediaFolder) {
        detalhes.push("   ✅ Pasta word/media/ existe (pronta para receber imagens)")
      } else {
        detalhes.push("   ℹ️ Pasta word/media/ não existe (será criada automaticamente)")
      }
    } catch (erro) {
      detalhes.push(`   ❌ Erro ao descompactar: ${erro instanceof Error ? erro.message : "Desconhecido"}`)
      return {
        isValid: false,
        mensagem: "Erro ao validar template (arquivo corrompido?)",
        detalhes,
      }
    }
  } catch (erro) {
    detalhes.push(`❌ Erro geral: ${erro instanceof Error ? erro.message : "Desconhecido"}`)
    return {
      isValid: false,
      mensagem: "Erro ao validar template",
      detalhes,
    }
  }

  const mensagem = isValid
    ? "✅ Template válido e pronto para usar"
    : "⚠️ Template possui problemas. Veja detalhes acima"

  return {
    isValid,
    mensagem,
    detalhes,
  }
}

/**
 * Formata erros de validação de forma legível para o usuário
 * 
 * Mostra cada erro em uma linha com ícone apropriado
 * Erros críticos (❌) bloqueiam geração
 * Avisos (⚠️) permitem mas alertam o usuário
 * 
 * @param erros Array de mensagens de erro
 * @returns String formatada para mostrar ao usuário
 */
function formatarErrosValidacao(erros: string[]): string {
  if (erros.length === 0) {
    return "✅ Todos os dados estão corretos"
  }

  // Separar erros críticos de avisos
  const errosCriticos = erros.filter((e) => e.startsWith("❌"))
  const avisos = erros.filter((e) => e.startsWith("⚠️"))
  const informativos = erros.filter((e) => e.startsWith("ℹ️"))

  let mensagem = ""

  if (errosCriticos.length > 0) {
    mensagem += "🔴 ERROS BLOQUEADORES:\n"
    mensagem += errosCriticos.map((e) => `  ${e}`).join("\n")
    mensagem += "\n\nO documento NÃO pode ser gerado até resolver esses erros.\n"
  }

  if (avisos.length > 0) {
    mensagem += "\n⚠️ ATENÇÃO:\n"
    mensagem += avisos.map((e) => `  ${e}`).join("\n")
    mensagem += "\n\nO documento pode ser gerado, mas revise essas informações.\n"
  }

  if (informativos.length > 0) {
    mensagem += "\n📌 INFORMAÇÕES:\n"
    mensagem += informativos.map((e) => `  ${e}`).join("\n")
  }

  return mensagem
}
/**
 * Gera um documento DOCX a partir de uma inspeção
 * 
 * FLUXO COMPLETO:
 * 1. ✅ Validação crítica de dados essenciais (título, endereço, etc)
 * 2. ✅ Validação de participantes (pelo menos 1 obrigatório)
 * 3. ✅ Validação de anexos NR-15 (se aplica=true, dados completos)
 * 4. 🔄 Busca template DOCX do servidor
 * 5. 🔄 Descompacta template (DOCX é um arquivo ZIP)
 * 6. 🔄 Prepara dados com substituição de valores especiais
 * 7. 🔄 Substitui placeholders {chave} pelos valores reais
 * 8. 🔄 Renderiza document (aplica transformações do docxtemplater)
 * 9. 🔄 Recompacta como novo DOCX binário
 * 10. 📥 Retorna como Blob para download no navegador
 * 
 * VALIDAÇÕES BLOQUEADORAS (retornam erro):
 * - Dados básicos faltando (títular, endereço, responsável, data)
 * - Sem participantes registrados
 * - Anexos NR-15 marcados como "APLICA" mas sem dados completos
 * 
 * AVISOS (alertam mas permitem continuar):
 * - Participantes sem assinatura
 * - Fotos sem legenda
 * 
 * @param inspection Dados da vistoria para preencher no template
 * @returns Promise<Blob> Arquivo DOCX pronto para download
 * @throws Error com mensagem descritiva se houver problemas
 */
export async function gerarDocumento(inspection: Inspection): Promise<Blob> {
  // ╔═══════════════════════════════════════════════════════════════════════════╗
  // ║ ETAPA 1: VALIDAÇÃO CRÍTICA                                               ║
  // ╚═══════════════════════════════════════════════════════════════════════════╝
  
  const erros = validarDados(inspection)
  
  // Separar erros críticos de avisos
  const errosCriticos = erros.filter((e) => e.startsWith("❌"))
  
  // Se houver ERROS CRÍTICOS, não permitir geração
  if (errosCriticos.length > 0) {
    const mensagem = formatarErrosValidacao(erros)
    throw new Error(`Não é possível gerar o documento:\n\n${mensagem}`)
  }

  try {
    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║ ETAPA 2: BUSCAR TEMPLATE DO SERVIDOR                                     ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝
    
    // Fazer requisição HTTP para download do template
    // O arquivo está em /public/templates/vistoria-template.docx
    const resposta = await fetch("/templates/vistoria-template.docx")
    
    // Se resposta não for OK (200-299), significa arquivo não encontrado
    if (!resposta.ok) {
      throw new Error(
        `Template não encontrado (HTTP ${resposta.status}). ` +
        `Verifique se o arquivo existe em /public/templates/vistoria-template.docx. ` +
        `Use obterDescritvoTemplate() para ver como criar o template.`
      )
    }

    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║ ETAPA 3: DESCOMPACTAR TEMPLATE (DOCX = ZIP)                              ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝
    
    // Converter resposta HTTP em ArrayBuffer (dados binários brutos)
    const arrayBuffer = await resposta.arrayBuffer()

    // PizZip descompacta o arquivo DOCX
    // Um DOCX é um arquivo ZIP que contém:
    // - word/document.xml (conteúdo principal)
    // - word/styles.xml (estilos)
    // - [Content_Types].xml (metadados)
    // - word/media/ (pasta para imagens/assinaturas)
    // - etc.
    let zip = new PizZip(arrayBuffer)

    const documentXml = zip.file("word/document.xml")
    if (documentXml) {
      const xmlOriginal = documentXml.asText()
      console.log("📄 Verificando template...")
      console.log("  - Tem {#fotos}?", xmlOriginal.includes("{#fotos}"))
      console.log("  - Tem {#assinaturas}?", xmlOriginal.includes("{#assinaturas}"))
      console.log("  - Tem {%assinatura}?", xmlOriginal.includes("{%assinatura}"))
      console.log("  - Tem {%foto}?", xmlOriginal.includes("{%foto}"))
      
      const precisaFotos = (inspection.fotos?.length || 0) > 0
      const precisaAssinaturas =
        (inspection.participantes || []).some((p) => p.assinatura)

      const faltamFotos = precisaFotos && !xmlOriginal.includes("{#fotos}")
      const faltamAssinaturas =
        precisaAssinaturas && !xmlOriginal.includes("{#assinaturas}")

      if (faltamFotos || faltamAssinaturas) {
        zip = criarTemplateBasicoComImagens()
      }
    }

    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║ ETAPA 4: PREPARAR DADOS PARA SUBSTITUIÇÃO                                ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝
    
    // Docxtemplater procura por {nomeChave} no documento
    // e substitui pelos valores mapeados aqui
    const dados = {
      // ├─ INFORMAÇÕES BÁSICAS
      titulo: inspection.titulo,                           // {titulo}
      condominio: inspection.condominio,                   // {condominio}
      torre: inspection.torre,                             // {torre}
      local: inspection.local,                             // {local}
      dataVistoria: formatarData(inspection.dataVistoria), // {dataVistoria} - formato BR (DD/MM/YYYY)
      horarioInicio: inspection.horarioInicio,             // {horarioInicio}
      horarioFim: inspection.horarioFim,                   // {horarioFim}

      // ├─ PARTICIPANTES
      // {participantes} será uma string com cada participante em uma linha
      // Formato: "João Silva (Engenheiro) - ABC Ltda"
      participantes: formatarParticipantes(inspection),
      totalParticipantes: inspection.participantes?.length || 0, // {totalParticipantes}

      // ├─ ESTATÍSTICAS DE ASSINATURAS
      totalAssinaturas: obterEstatisticasAssinaturas(inspection).comAssinatura,
      assinaturasAusentes: obterEstatisticasAssinaturas(inspection).semAssinatura,

      // ├─ NR-15 (Segurança e Saúde do Trabalho)
      setoresAvaliados: inspection.setoresAvaliados || "Não preenchido",        // {setoresAvaliados}
      descricaoAtividades: inspection.descricaoAtividades || "Não preenchido", // {descricaoAtividades}
      epcsIdentificados: inspection.epcsIdentificados || "Não preenchido",     // {epcsIdentificados}
      nr15Observacoes: inspection.nr15Observacoes || "Sem observações",         // {nr15Observacoes}

      // ├─ STATUS DA VISTORIA
      // Transformar status técnico (rascunho/em_andamento/concluida) em texto legível
      status: inspection.status === "concluida" ? "CONCLUÍDA" : "EM ANDAMENTO", // {status}
      statusTexto:
        inspection.status === "concluida"
          ? "Vistoria concluída - Pronta para entrega"
          : "Vistoria em andamento - Dados não consolidados", // {statusTexto}

      // ├─ ESTATÍSTICAS DE FOTOS
      totalFotos: inspection.fotos?.length || 0, // {totalFotos}
      fotosComLegenda: inspection.fotos?.filter((f) => f.legenda?.trim()).length || 0,

      // Fallbacks para tags de imagem fora de loops
      foto: "",
      assinatura: "",

      // ├─ FOTOS (para loop no template)
      // {#fotos}{%foto}{legenda}{/fotos}
      fotos: (inspection.fotos || []).reduce((acc, f) => {
        const dataUrl = normalizeImageDataUrl(f.dataUrl, "image/jpeg")
        if (!dataUrl) {
          return acc
        }
        acc.push({
          foto: dataUrl, // Base64 da imagem
          legenda: f.legenda || "Sem legenda",
          data: formatarData(f.criadoEm),
        })
        return acc
      }, [] as Array<{ foto: string; legenda: string; data: string }>),

      // ├─ ASSINATURAS (para loop no template)
      // {#assinaturas}{nome}{cargo}{%assinatura}{/assinaturas}
      assinaturas: (inspection.participantes || []).reduce((acc, p) => {
        console.log("🔍 Processando participante:", p.nome, "Tem assinatura?", !!p.assinatura)
        const assinatura = normalizeImageDataUrl(p.assinatura, "image/png")
        console.log("✅ Assinatura normalizada:", assinatura ? `${assinatura.substring(0, 50)}...` : "VAZIO")
        if (!assinatura) {
          return acc
        }
        acc.push({
          nome: p.nome,
          cargo: p.cargo || "Sem cargo",
          empresa: p.empresa || "Sem empresa",
          assinatura, // Base64 da assinatura
        })
        return acc
      }, [] as Array<{ nome: string; cargo: string; empresa: string; assinatura: string }>),

      // ├─ DADOS DE AVALIAÇÃO NR-15 (para loops no template)
      // Se o template usar {#avaliacoes}{/avaliacoes}, cada avaliação será renderizada
      avaliacoes: inspection.avaliacoesNR15?.map((av) => ({
        anexoNumero: av.anexoNumero,
        aplica: av.aplica ? "Sim" : av.aplica === false ? "Não" : "Não avaliado",
        localAvaliacao: av.localAvaliacao || "-",
        atividadesDescritas: av.atividadesDescritas || "-",
        episUtilizados: av.episUtilizados || "-",
        agentesIdentificados: av.agentesAvaliados?.filter((a) => a.identificado).length || 0,
        conclusao: av.conclusao || "-",
        observacoes: av.observacoes || "-",
      })) || [],
    }

    console.log("📊 Dados preparados:")
    console.log("  - Total de fotos:", dados.fotos.length)
    console.log("  - Total de assinaturas:", dados.assinaturas.length)
    if (dados.assinaturas.length > 0) {
      console.log("  - Primeira assinatura:", dados.assinaturas[0].nome, dados.assinaturas[0].assinatura.substring(0, 50) + "...")
    }

    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║ ETAPA 5: CRIAR INSTÂNCIA DE DOCXTEMPLATER E CARREGAR DADOS                ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝
    
    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║ CONFIGURAR MÓDULO DE IMAGENS                                             ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝
    
    // Configurar o módulo de imagem para docxtemplater
    const imageOpts = {
      centered: false,
      getImage(tag: string | undefined | null) {
        console.log("🖼️ getImage chamado com tag:", typeof tag, tag ? `${String(tag).substring(0, 50)}...` : "null/undefined")
        if (!tag || typeof tag !== "string") {
          console.log("❌ Tag inválida (null, undefined ou não é string)")
          return null
        }
        if (!tag.startsWith("data:image/")) {
          console.log("❌ Tag não começa com 'data:image/':", tag.substring(0, 50))
          return null
        }
        console.log("✅ Tag válida, convertendo para buffer")
        // tag é a base64 da imagem
        return base64ToBuffer(tag)
      },
      getSize(img: Buffer | null, tag: string, tagName: string) {
        if (!img) {
          return [0, 0]
        }
        // Tamanho padrão para imagens em pontos (1 ponto = 1/72 polegada)
        // 400x300 pontos = aproximadamente 14cm x 10.5cm
        if (tagName === "assinatura") {
          // Assinaturas menores: 200x100 pontos
          return [200, 100]
        }
        // Fotos maiores: 400x300 pontos
        return [400, 300]
      },
    }

    // Docxtemplater parser o XML do document.xml
    // paragraphLoop=true: permite usar loops de parágrafos
    // linebreaks=true: converte \n em quebras de linha no DOCX
    const imageModule = new ImageModule(imageOpts)
    const originalRender = imageModule.render?.bind(imageModule)
    if (originalRender) {
      imageModule.render = (part: any, options: any) => {
        patchScopeManagerGetValue(options?.scopeManager)
        return originalRender(part, options)
      }
    }

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      modules: [imageModule],
      nullGetter: () => "",
    })

    patchScopeManagerGetValue((doc as any).scopeManager)

    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║ ETAPA 6: RENDERIZAR O DOCUMENTO                                          ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝
    
    // Renderizar = aplicar as transformações no XML
    // Substitui {chave} por valores, processa loops, etc.
    // render(data) substitui o método deprecated setData() + render()
    try {
      doc.render(dados)
    } catch (erro: any) {
      // Se houver erro, é provável que um placeholder não tenha correspondência
      console.error("❌ Erro ao renderizar documento:", erro)
      
      // Docxtemplater pode ter múltiplos erros
      if (erro.properties && erro.properties.errors) {
        console.error("📋 Detalhes dos erros:")
        erro.properties.errors.forEach((e: any, idx: number) => {
          console.error(`  ${idx + 1}. ${e.message}`)
          console.error(`     Tipo: ${e.name}`)
          if (e.properties) {
            console.error(`     Tag: ${e.properties.id || e.properties.key || 'N/A'}`)
            console.error(`     Linha: ${e.properties.lineNumber || 'N/A'}`)
          }
        })
      }
      
      throw new Error(
        `Erro ao gerar documento: ${erro.message}\n\n` +
        `Verifique se todos os placeholders do template existem nos dados. ` +
        `Use obterDescritvoTemplate() para ver os placeholders necessários.`
      )
    }

    // ╔═══════════════════════════════════════════════════════════════════════════╗
    // ║ ETAPA 7: COMPILAR E RETORNAR COMO BLOB                                    ║
    // ╚═══════════════════════════════════════════════════════════════════════════╝
    
    // Recompactar o ZIP com o conteúdo modificado
    // Retorna como Blob (arquivo em memória) com MIME type correto
    const docGerado = doc.getZip().generate({
      type: "blob",
      // MIME type oficial para documentos Word (.docx)
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    })

    return docGerado
  } catch (erro) {
    // Se chegou aqui, é um erro técnico (não de validação)
    if (erro instanceof Error) {
      throw erro
    }
    throw new Error(
      `Erro desconhecido ao gerar documento: ${erro}\n\n` +
      `Por favor, tente novamente. Se o erro persistir, contate o suporte.`
    )
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
  // Usar setTimeout para garantir que o click foi processado
  setTimeout(() => {
    if (link.parentNode) {
      link.parentNode.removeChild(link)
    }
    URL.revokeObjectURL(url)
  }, 100)
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
    adicionarTexto(`Condomínio: ${inspection.condominio}`, 10, false, 2)
    adicionarTexto(`Torre: ${inspection.torre}`, 10, false, 2)
    adicionarTexto(`Local: ${inspection.local}`, 10, false, 2)
    adicionarTexto(`Data da Vistoria: ${formatarData(inspection.dataVistoria)}`, 10, false, 2)
    adicionarTexto(`Horário: ${inspection.horarioInicio} até ${inspection.horarioFim}`, 10, false, 2)
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

--- INSPEÇÃO ---
Condomínio: {condominio}
Torre: {torre}
Local: {local}
Data: {dataVistoria}
Horário: {horarioInicio} até {horarioFim}
Status: {statusTexto}

--- PARTICIPANTES ---
{participantes}
Total: {totalParticipantes}

--- ATIVIDADES ---
Setores Avaliados: {setoresAvaliados}
Descrição Atividades: {descricaoAtividades}
EPCs Identificados: {epcsIdentificados}

--- FOTOS ---
Total de Fotos: {totalFotos}

Para incluir fotos em loop (uma por uma):
{#fotos}
{%foto}
Legenda: {legenda}
Data: {data}
{/fotos}

--- ASSINATURAS ---
Para incluir assinaturas em loop:
{#assinaturas}
Nome: {nome}
Cargo: {cargo}
Empresa: {empresa}
{%assinatura}
{/assinaturas}

--- AVALIAÇÕES NR-15 ---
Para incluir avaliações NR-15:
{#avaliacoes}
Anexo {anexoNumero}: {aplica}
Local: {localAvaliacao}
Atividades: {atividadesDescritas}
EPIs: {episUtilizados}
Agentes Identificados: {agentesIdentificados}
Conclusão: {conclusao}
{/avaliacoes}

--- OBSERVAÇÕES ---
{nr15Observacoes}
{observacoes}

--- RODAPÉ ---
Documento gerado em: {dataGeracao}
Status: {status}

4. Salve como "vistoria-template.docx"
5. Coloque em /public/templates/vistoria-template.docx

AJUDA - Como adicionar imagens no template:
- Use {%foto} para inserir imagens de fotos (% é importante!)
- Use {%assinatura} para inserir assinaturas digitais
- As imagens devem estar dentro de um loop {#fotos}...{/fotos} ou {#assinaturas}...{/assinaturas}
- O placeholder com % será substituído pela imagem real
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
