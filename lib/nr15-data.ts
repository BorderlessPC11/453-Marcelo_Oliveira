// NR-15 - Atividades e Operacoes Insalubres
// Estrutura de dados dos anexos da NR-15

export interface NR15Anexo {
  numero: number
  titulo: string
  descricao: string
  tipo: "quantitativo" | "qualitativo"
  grauInsalubridade: string[]
  agentes: NR15Agente[]
}

export interface NR15Agente {
  id: string
  nome: string
  limiteToleranciaTWA?: string
  limiteToleranciaSTEL?: string
  unidade?: string
  grau?: string
  observacoes?: string
}

export interface AvaliacaoNR15 {
  anexoNumero: number
  aplica: boolean | null // null = nao avaliado
  agentesAvaliados: AgenteAvaliado[]
  localAvaliacao: string
  atividadesDescritas: string
  episUtilizados: string
  medicoes: string
  tempoExposicao: string
  conclusao: string
  observacoes: string
}

export interface AgenteAvaliado {
  agenteId: string
  identificado: boolean
  valorMedido: string
  acimaDoLimite: boolean | null
  epiFornecido: boolean
  epiUtilizado: boolean
  descricaoEPI: string
  observacoes: string
}

export const NR15_ANEXOS: NR15Anexo[] = [
  {
    numero: 1,
    titulo: "Limites de Tolerancia para Ruido Continuo ou Intermitente",
    descricao:
      "Estabelece os limites de tolerancia para ruido continuo ou intermitente em funcao do tempo de exposicao.",
    tipo: "quantitativo",
    grauInsalubridade: ["Medio (20%)"],
    agentes: [
      { id: "ruido-85", nome: "Ruido Continuo", limiteToleranciaTWA: "85 dB(A)", unidade: "dB(A)", grau: "Medio (20%)" },
    ],
  },
  {
    numero: 2,
    titulo: "Limites de Tolerancia para Ruidos de Impacto",
    descricao:
      "Estabelece os limites de tolerancia para ruidos de impacto (pico) em funcao da frequencia.",
    tipo: "quantitativo",
    grauInsalubridade: ["Medio (20%)"],
    agentes: [
      { id: "ruido-impacto", nome: "Ruido de Impacto", limiteToleranciaTWA: "130 dB(C) / 120 dB linear", unidade: "dB(C)", grau: "Medio (20%)" },
    ],
  },
  {
    numero: 3,
    titulo: "Limites de Tolerancia para Exposicao ao Calor",
    descricao:
      "Determina os limites de tolerancia para exposicao ao calor, considerando o tipo de atividade e o regime de trabalho.",
    tipo: "quantitativo",
    grauInsalubridade: ["Medio (20%)"],
    agentes: [
      { id: "calor-ibutg", nome: "Calor (IBUTG)", limiteToleranciaTWA: "Conforme Quadro 1", unidade: "IBUTG", grau: "Medio (20%)" },
    ],
  },
  {
    numero: 5,
    titulo: "Radiacoes Ionizantes",
    descricao:
      "Atividades ou operacoes com exposicao a radiacoes ionizantes conforme normas da CNEN.",
    tipo: "qualitativo",
    grauInsalubridade: ["Maximo (40%)"],
    agentes: [
      { id: "rad-ionizante", nome: "Radiacoes Ionizantes", grau: "Maximo (40%)" },
    ],
  },
  {
    numero: 6,
    titulo: "Trabalho sob Condicoes Hiperbaricas",
    descricao: "Trabalho sob ar comprimido e em submersao.",
    tipo: "qualitativo",
    grauInsalubridade: ["Maximo (40%)"],
    agentes: [
      { id: "hiperbaricas", nome: "Condicoes Hiperbaricas", grau: "Maximo (40%)" },
    ],
  },
  {
    numero: 7,
    titulo: "Radiacoes Nao-Ionizantes",
    descricao:
      "Operacoes com geracao de radiacoes nao-ionizantes (micro-ondas, ultravioletas, laser).",
    tipo: "qualitativo",
    grauInsalubridade: ["Medio (20%)"],
    agentes: [
      { id: "micro-ondas", nome: "Micro-ondas", grau: "Medio (20%)" },
      { id: "ultravioleta", nome: "Ultravioleta", grau: "Medio (20%)" },
      { id: "laser", nome: "Laser", grau: "Medio (20%)" },
    ],
  },
  {
    numero: 8,
    titulo: "Vibracoes",
    descricao: "Operacoes e atividades com exposicao a vibracoes localizadas ou de corpo inteiro.",
    tipo: "quantitativo",
    grauInsalubridade: ["Medio (20%)"],
    agentes: [
      { id: "vibracao-mao", nome: "Vibracao mao-braco", limiteToleranciaTWA: "5 m/s2", unidade: "m/s2", grau: "Medio (20%)" },
      { id: "vibracao-corpo", nome: "Vibracao de corpo inteiro", limiteToleranciaTWA: "1,1 m/s2", unidade: "m/s2", grau: "Medio (20%)" },
    ],
  },
  {
    numero: 9,
    titulo: "Frio",
    descricao: "Trabalhos realizados em camaras frigorificas e similares.",
    tipo: "qualitativo",
    grauInsalubridade: ["Medio (20%)"],
    agentes: [
      { id: "frio", nome: "Frio", grau: "Medio (20%)" },
    ],
  },
  {
    numero: 10,
    titulo: "Umidade",
    descricao: "Trabalhos realizados em locais alagados ou encharcados.",
    tipo: "qualitativo",
    grauInsalubridade: ["Medio (20%)"],
    agentes: [
      { id: "umidade", nome: "Umidade", grau: "Medio (20%)" },
    ],
  },
  {
    numero: 11,
    titulo: "Agentes Quimicos - Limites de Tolerancia",
    descricao:
      "Tabela de limites de tolerancia para agentes quimicos com valores de concentracao maxima.",
    tipo: "quantitativo",
    grauInsalubridade: ["Minimo (10%)", "Medio (20%)", "Maximo (40%)"],
    agentes: [
      { id: "benzeno", nome: "Benzeno", limiteToleranciaTWA: "1 ppm", limiteToleranciaSTEL: "2,5 ppm", unidade: "ppm", grau: "Maximo (40%)" },
      { id: "tolueno", nome: "Tolueno", limiteToleranciaTWA: "78 ppm", limiteToleranciaSTEL: "156 ppm", unidade: "ppm", grau: "Medio (20%)" },
      { id: "xileno", nome: "Xileno", limiteToleranciaTWA: "78 ppm", limiteToleranciaSTEL: "156 ppm", unidade: "ppm", grau: "Medio (20%)" },
      { id: "amonia", nome: "Amonia", limiteToleranciaTWA: "20 ppm", limiteToleranciaSTEL: "30 ppm", unidade: "ppm", grau: "Medio (20%)" },
      { id: "cloro", nome: "Cloro", limiteToleranciaTWA: "0,8 ppm", limiteToleranciaSTEL: "1 ppm", unidade: "ppm", grau: "Maximo (40%)" },
      { id: "formaldeido", nome: "Formaldeido", limiteToleranciaTWA: "1,6 ppm", limiteToleranciaSTEL: "2,4 ppm", unidade: "ppm", grau: "Maximo (40%)" },
      { id: "acido-sulfurico", nome: "Acido Sulfurico", limiteToleranciaTWA: "1 mg/m3", unidade: "mg/m3", grau: "Medio (20%)" },
    ],
  },
  {
    numero: 12,
    titulo: "Poeiras Minerais - Asbesto",
    descricao:
      "Limites de tolerancia para poeiras minerais contendo asbesto (amianto).",
    tipo: "quantitativo",
    grauInsalubridade: ["Maximo (40%)"],
    agentes: [
      { id: "asbesto", nome: "Asbesto (Amianto)", limiteToleranciaTWA: "2,0 f/cm3", unidade: "f/cm3", grau: "Maximo (40%)" },
    ],
  },
  {
    numero: 13,
    titulo: "Agentes Quimicos (Avaliacao Qualitativa)",
    descricao:
      "Lista de agentes quimicos cuja insalubridade e caracterizada por avaliacao qualitativa (manipulacao, contato).",
    tipo: "qualitativo",
    grauInsalubridade: ["Minimo (10%)", "Medio (20%)", "Maximo (40%)"],
    agentes: [
      { id: "arsenio", nome: "Arsenio e compostos", grau: "Maximo (40%)" },
      { id: "chumbo", nome: "Chumbo e compostos", grau: "Maximo (40%)" },
      { id: "cromo", nome: "Cromo e compostos", grau: "Maximo (40%)" },
      { id: "fosforo", nome: "Fosforo e compostos", grau: "Maximo (40%)" },
      { id: "mercurio", nome: "Mercurio e compostos", grau: "Maximo (40%)" },
      { id: "silicatos", nome: "Silicatos", grau: "Medio (20%)" },
    ],
  },
  {
    numero: 14,
    titulo: "Agentes Biologicos",
    descricao:
      "Relacao de atividades que envolvem agentes biologicos, com classificacao por grau de insalubridade.",
    tipo: "qualitativo",
    grauInsalubridade: ["Medio (20%)", "Maximo (40%)"],
    agentes: [
      { id: "bio-hospitais", nome: "Hospitais, servicos de emergencia, enfermarias", grau: "Medio (20%)" },
      { id: "bio-esgotos", nome: "Esgotos (galerias e tanques)", grau: "Maximo (40%)" },
      { id: "bio-lixo", nome: "Lixo urbano (coleta e industrializacao)", grau: "Maximo (40%)" },
      { id: "bio-laboratorio", nome: "Laboratorios de analises clinicas e histopatologia", grau: "Medio (20%)" },
      { id: "bio-cemiterios", nome: "Cemiterios (exumacao de corpos)", grau: "Maximo (40%)" },
      { id: "bio-estabulos", nome: "Estabulos e cavalariças", grau: "Medio (20%)" },
      { id: "bio-gleba", nome: "Gleba (trabalho com lixo urbano)", grau: "Maximo (40%)" },
    ],
  },
]

// Criar avaliacao vazia para um anexo
export function criarAvaliacaoVazia(anexoNumero: number): AvaliacaoNR15 {
  const anexo = NR15_ANEXOS.find((a) => a.numero === anexoNumero)
  return {
    anexoNumero,
    aplica: null,
    agentesAvaliados: (anexo?.agentes || []).map((ag) => ({
      agenteId: ag.id,
      identificado: false,
      valorMedido: "",
      acimaDoLimite: null,
      epiFornecido: false,
      epiUtilizado: false,
      descricaoEPI: "",
      observacoes: "",
    })),
    localAvaliacao: "",
    atividadesDescritas: "",
    episUtilizados: "",
    medicoes: "",
    tempoExposicao: "",
    conclusao: "",
    observacoes: "",
  }
}

// Calcular progresso de preenchimento de uma avaliacao
export function calcularProgressoAvaliacao(avaliacao: AvaliacaoNR15): number {
  if (avaliacao.aplica === null) return 0
  if (avaliacao.aplica === false) return 100

  let camposPreenchidos = 1 // aplica ja esta marcado
  let totalCampos = 7 // aplica, local, atividades, epis, medicoes, tempo, conclusao

  if (avaliacao.localAvaliacao.trim()) camposPreenchidos++
  if (avaliacao.atividadesDescritas.trim()) camposPreenchidos++
  if (avaliacao.episUtilizados.trim()) camposPreenchidos++
  if (avaliacao.medicoes.trim()) camposPreenchidos++
  if (avaliacao.tempoExposicao.trim()) camposPreenchidos++
  if (avaliacao.conclusao.trim()) camposPreenchidos++

  // Agentes (cada agente avaliado conta como +1)
  const agentesTotal = avaliacao.agentesAvaliados.length
  if (agentesTotal > 0) {
    totalCampos += agentesTotal
    avaliacao.agentesAvaliados.forEach((ag) => {
      if (ag.identificado || ag.valorMedido || ag.descricaoEPI) {
        camposPreenchidos++
      }
    })
  }

  return Math.round((camposPreenchidos / totalCampos) * 100)
}

// Categorias de riscos para tabs
export const CATEGORIAS_RISCO = [
  {
    id: "fisicos",
    label: "Fisicos",
    anexos: [1, 2, 3, 5, 6, 7, 8, 9, 10],
    cor: "text-primary",
    bgCor: "bg-primary/10",
  },
  {
    id: "quimicos",
    label: "Quimicos",
    anexos: [11, 12, 13],
    cor: "text-amber-600",
    bgCor: "bg-amber-600/10",
  },
  {
    id: "biologicos",
    label: "Biologicos",
    anexos: [14],
    cor: "text-emerald-600",
    bgCor: "bg-emerald-600/10",
  },
] as const
