/**
 * VALIDATION.TS - Utilitários para validação de dados
 * 
 * Este arquivo centraliza toda a lógica de validação da aplicação
 * Separa a validação da geração de documento para reutilização em outros lugares
 */

import type { Inspection } from "./types"

/**
 * Resultado de uma validação
 * 
 * - isValid: se passou na validação (sem erros críticos)
 * - erros: lista de erros críticos (bloqueiam ação)
 * - avisos: lista de avisos (alertam mas permitem continuar)
 * - informativos: lista de informações úteis
 * - mensagemFormatada: mensagem pronta para mostrar ao usuário
 */
export interface ResultadoValidacao {
  isValid: boolean
  erros: string[]
  avisos: string[]
  informativos: string[]
  mensagemFormatada: string
}

/**
 * Formata erros/avisos de forma legível para o usuário
 * 
 * Agrupa por tipo e adiciona ícones/cores:
 * - ❌ Erros críticos (bloqueiam geração)
 * - ⚠️ Avisos (permitem mas alertam)
 * - ℹ️ Informativos (informação útil)
 * 
 * @param erros Lista de erros críticos
 * @param avisos Lista de avisos
 * @param informativos Lista de informativos
 * @returns String formatada para mostrar ao usuário
 */
export function formatarResultadoValidacao(
  erros: string[],
  avisos: string[],
  informativos: string[]
): string {
  let mensagem = ""

  if (erros.length === 0 && avisos.length === 0 && informativos.length === 0) {
    return "✅ Todos os dados estão corretos e o documento pode ser gerado"
  }

  if (erros.length > 0) {
    mensagem += "🔴 ERROS BLOQUEADORES\n"
    mensagem += "(O documento NÃO pode ser gerado até resolver esses problemas)\n\n"
    mensagem += erros.map((e) => `  ❌ ${e}`).join("\n")
    mensagem += "\n\n"
  }

  if (avisos.length > 0) {
    mensagem += "🟡 ATENÇÃO\n"
    mensagem += "(O documento pode ser gerado, mas revise essas informações)\n\n"
    mensagem += avisos.map((e) => `  ⚠️ ${e}`).join("\n")
    mensagem += "\n\n"
  }

  if (informativos.length > 0) {
    mensagem += "ℹ️ INFORMAÇÕES\n"
    mensagem += informativos.map((e) => `  📌 ${e}`).join("\n")
  }

  return mensagem.trim()
}

/**
 * Valida um anexo NR-15 específico quando está marcado como aplicável
 * 
 * Se `aplica === true`, os campos abaixo tornam-se OBRIGATÓRIOS:
 * - localAvaliacao: local onde foi realizada a avaliação
 * - atividadesDescritas: quais atividades foram observadas
 * - episUtilizados: EPIs encontrados/utilizados
 * - pelo menos um agente deve estar marcado como "identificado"
 * - conclusao: conclusão sobre a exposição aos agentes
 * 
 * Se `aplica === false`, os campos são ignorados (não aplicável)
 * Se `aplica === null`, não foi avaliado (sem validação)
 * 
 * @param avaliacao Os dados da avaliação do anexo
 * @param numeroAnexo Número do anexo (para mensagem)
 * @returns Array com erros encontrados (vazio = tudo OK)
 */
export function validarAnexoNR15(avaliacao: any, numeroAnexo: number): {
  erros: string[]
  avisos: string[]
} {
  const erros: string[] = []
  const avisos: string[] = []

  // Se não foi marcado como aplicável, não há validação
  if (avaliacao.aplica === null || avaliacao.aplica === false) {
    return { erros, avisos }
  }

  // ✓ Agora o anexo deve ser avaliado (aplica === true)

  // ERRO 1: Local da avaliação vazio
  if (!avaliacao.localAvaliacao?.trim()) {
    erros.push(
      `Anexo NR-15 ${numeroAnexo}: O campo "Local da Avaliação" é obrigatório quando o anexo é aplicável`
    )
  }

  // ERRO 2: Atividades descritas vazias
  if (!avaliacao.atividadesDescritas?.trim()) {
    erros.push(
      `Anexo NR-15 ${numeroAnexo}: O campo "Atividades Descritas" é obrigatório quando o anexo é aplicável`
    )
  }

  // ERRO 3: EPIs utilizados vazios
  if (!avaliacao.episUtilizados?.trim()) {
    erros.push(
      `Anexo NR-15 ${numeroAnexo}: O campo "EPIs Utilizados" é obrigatório quando o anexo é aplicável`
    )
  }

  // ERRO 4: Nenhum agente identificado
  const agentesIdentificados =
    avaliacao.agentesAvaliados?.filter((a: any) => a.identificado === true) || []
  if (agentesIdentificados.length === 0) {
    erros.push(
      `Anexo NR-15 ${numeroAnexo}: Nenhum agente foi marcado como "Identificado". ` +
        `Marque pelo menos um agente ou mude o anexo para "Não Aplica".`
    )
  }

  // ERRO 5: Se há agentes identificados, conclusão é obrigatória
  if (agentesIdentificados.length > 0 && !avaliacao.conclusao?.trim()) {
    erros.push(
      `Anexo NR-15 ${numeroAnexo}: O campo "Conclusão" é obrigatório quando agentes foram identificados`
    )
  }

  // AVISO: Se há medições, verificar se valores foram preenchidos
  if (avaliacao.agentesAvaliados && avaliacao.agentesAvaliados.length > 0) {
    const agentesSemedida = avaliacao.agentesAvaliados.filter(
      (a: any) => a.identificado && !a.valorMedido?.trim()
    )
    if (agentesSemedida.length > 0) {
      avisos.push(
        `Anexo NR-15 ${numeroAnexo}: ${agentesSemedida.length} agente(s) identificado(s) não têm valor medido. ` +
          `Considere adicionar as medições.`
      )
    }
  }

  // AVISO: Se há agentes, verificar se todos têm descrição de EPI
  if (agentesIdentificados.length > 0) {
    const agentesSemdescricaoEPI = agentesIdentificados.filter(
      (a: any) => !a.descricaoEPI?.trim()
    )
    if (agentesSemdescricaoEPI.length > 0) {
      avisos.push(
        `Anexo NR-15 ${numeroAnexo}: Alguns agentes identificados não têm descrição de EPI fornecido/utilizado`
      )
    }
  }

  return { erros, avisos }
}

/**
 * Valida todos os anexos NR-15 que foram marcados como aplicáveis
 * 
 * @param inspection A vistoria com as avaliações NR-15
 * @returns Erros e avisos de todos os anexos
 */
function validarTodosAnexosAplicaveis(
  inspection: Inspection
): { erros: string[]; avisos: string[] } {
  const errosTotal: string[] = []
  const avisosTotal: string[] = []

  if (!inspection.avaliacoesNR15 || inspection.avaliacoesNR15.length === 0) {
    return { erros: errosTotal, avisos: avisosTotal }
  }

  inspection.avaliacoesNR15.forEach((avaliacao) => {
    const { erros, avisos } = validarAnexoNR15(avaliacao, avaliacao.anexoNumero)
    errosTotal.push(...erros)
    avisosTotal.push(...avisos)
  })

  return { erros: errosTotal, avisos: avisosTotal }
}

/**
 * Valida dados da inspeção antes de gerar documento
 * 
 * VALIDAÇÕES CRÍTICAS (retornam erro):
 * 1. Dados básicos preenchidos (título, endereço, responsável, data)
 * 2. Pelo menos um participante registrado
 * 3. Anexos NR-15 aplicáveis com dados completos
 * 
 * AVISOS (alertam mas permitem continuar):
 * 1. Participantes sem assinatura
 * 2. Fotos sem legenda
 * 3. Agentes sem medições
 * 
 * @param inspection Dados da vistoria
 * @returns Resultado completo com erros, avisos e mensagem formatada
 */
export function validarInspecaoParaDocumento(inspection: Inspection): ResultadoValidacao {
  const erros: string[] = []
  const avisos: string[] = []
  const informativos: string[] = []

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDAÇÃO 1: Dados básicos obrigatórios
  // ═══════════════════════════════════════════════════════════════════════════

  if (!inspection.titulo?.trim()) {
    erros.push("Título da vistoria não foi preenchido")
  }

  if (!inspection.endereco?.trim()) {
    erros.push("Endereço da vistoria não foi preenchido")
  }

  if (!inspection.responsavel?.trim()) {
    erros.push("Responsável pela vistoria não foi preenchido")
  }

  if (!inspection.dataVistoria) {
    erros.push("Data da vistoria não foi preenchida")
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDAÇÃO 2: Participantes (deve haver pelo menos 1)
  // ═══════════════════════════════════════════════════════════════════════════

  if (!inspection.participantes || inspection.participantes.length === 0) {
    erros.push(
      "Nenhum participante foi registrado. Adicione pelo menos um participante à vistoria"
    )
  } else {
    // Contar quantos  participantes ainda não assinaram
    const semAssinadura = inspection.participantes.filter((p) => !p.assinatura).length

    if (semAssinadura > 0) {
      avisos.push(
        `${semAssinadura} participante(s) ainda não assinaram o documento. ` +
          `O documento pode ser gerado, mas considere solicitar as assinaturas.`
      )
    }

    informativos.push(`Total de participantes: ${inspection.participantes.length}`)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDAÇÃO 3: Anexos NR-15 aplicáveis com dados completos
  // ═══════════════════════════════════════════════════════════════════════════

  const { erros: errosNR15, avisos: avisosNR15 } = validarTodosAnexosAplicaveis(inspection)
  erros.push(...errosNR15)
  avisos.push(...avisosNR15)

  // Informação sobre quantos anexos foram avaliados
  if (inspection.avaliacoesNR15) {
    const aplicaveis = inspection.avaliacoesNR15.filter((a) => a.aplica === true).length
    const naoAplicaveis = inspection.avaliacoesNR15.filter((a) => a.aplica === false).length
    const naoAvaliados = inspection.avaliacoesNR15.filter((a) => a.aplica === null).length

    if (aplicaveis > 0) {
      informativos.push(`${aplicaveis} anexo(s) NR-15 marcado(s) como "Aplica"`)
    }
    if (naoAplicaveis > 0) {
      informativos.push(`${naoAplicaveis} anexo(s) NR-15 marcado(s) como "Não Aplica"`)
    }
    if (naoAvaliados > 0) {
      informativos.push(`${naoAvaliados} anexo(s) NR-15 ainda não avaliado(s)`)
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VALIDAÇÃO 4: Fotos (avisar se faltam legendas)
  // ═══════════════════════════════════════════════════════════════════════════

  if (inspection.fotos && inspection.fotos.length > 0) {
    const semLegenda = inspection.fotos.filter((f) => !f.legenda?.trim()).length

    if (semLegenda > 0) {
      avisos.push(
        `${semLegenda} foto(s) ainda não têm legenda. ` +
          `Considere adicionar legendas descritivas para melhor documentação.`
      )
    }

    informativos.push(`Total de fotos: ${inspection.fotos.length}`)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESULTADO FINAL
  // ═══════════════════════════════════════════════════════════════════════════

  const isValid = erros.length === 0

  return {
    isValid,
    erros,
    avisos,
    informativos,
    mensagemFormatada: formatarResultadoValidacao(erros, avisos, informativos),
  }
}
