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
  aplica: boolean | null // null = não avaliado
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
    titulo: "Limites de Tolerância para Ruído Contínuo ou Intermitente",
    descricao:
      "Estabelece os limites de tolerância para ruído contínuo ou intermitente em função do tempo de exposição.",
    tipo: "quantitativo",
    grauInsalubridade: ["Médio (20%)"],
    agentes: [
      { id: "ruido-85", nome: "Ruído Contínuo", limiteToleranciaTWA: "85 dB(A)", unidade: "dB(A)", grau: "Médio (20%)" },
    ],
  },
  {
    numero: 2,
    titulo: "Limites de Tolerância para Ruídos de Impacto",
    descricao:
      "Estabelece os limites de tolerância para ruídos de impacto (pico) em função da frequência.",
    tipo: "quantitativo",
    grauInsalubridade: ["Médio (20%)"],
    agentes: [
      { id: "ruido-impacto", nome: "Ruído de Impacto", limiteToleranciaTWA: "130 dB(C) / 120 dB linear", unidade: "dB(C)", grau: "Médio (20%)" },
    ],
  },
  {
    numero: 3,
    titulo: "Limites de Tolerância para Exposição ao Calor",
    descricao:
      "Determina os limites de tolerância para exposição ao calor, considerando o tipo de atividade e o regime de trabalho.",
    tipo: "quantitativo",
    grauInsalubridade: ["Médio (20%)"],
    agentes: [
      { id: "calor-ibutg", nome: "Calor (IBUTG)", limiteToleranciaTWA: "Conforme Quadro 1", unidade: "IBUTG", grau: "Médio (20%)" },
    ],
  },
  {
    numero: 5,
    titulo: "Radiações Ionizantes",
    descricao:
      "Atividades ou operações com exposição a radiações ionizantes conforme normas da CNEN.",
    tipo: "qualitativo",
    grauInsalubridade: ["Máximo (40%)"],
    agentes: [
      { id: "rad-ionizante", nome: "Radiações Ionizantes", grau: "Máximo (40%)" },
    ],
  },
  {
    numero: 6,
    titulo: "Trabalho sob Condições Hiperbáricas",
    descricao: "Trabalho sob ar comprimido e em submersão.",
    tipo: "qualitativo",
    grauInsalubridade: ["Máximo (40%)"],
    agentes: [
      { id: "hiperbaricas", nome: "Condições Hiperbáricas", grau: "Máximo (40%)" },
    ],
  },
  {
    numero: 7,
    titulo: "Radiações Não-Ionizantes",
    descricao:
      "Operações com geração de radiações não-ionizantes (micro-ondas, ultravioletas, laser).",
    tipo: "qualitativo",
    grauInsalubridade: ["Médio (20%)"],
    agentes: [
      { id: "micro-ondas", nome: "Micro-ondas", grau: "Médio (20%)" },
      { id: "ultravioleta", nome: "Ultravioleta", grau: "Médio (20%)" },
      { id: "laser", nome: "Laser", grau: "Médio (20%)" },
    ],
  },
  {
    numero: 8,
    titulo: "Vibrações",
    descricao: "Operações e atividades com exposição a vibrações localizadas ou de corpo inteiro.",
    tipo: "quantitativo",
    grauInsalubridade: ["Médio (20%)"],
    agentes: [
      { id: "vibracao-mao", nome: "Vibração mão-braço", limiteToleranciaTWA: "5 m/s2", unidade: "m/s2", grau: "Médio (20%)" },
      { id: "vibracao-corpo", nome: "Vibração de corpo inteiro", limiteToleranciaTWA: "1,1 m/s2", unidade: "m/s2", grau: "Médio (20%)" },
    ],
  },
  {
    numero: 9,
    titulo: "Frio",
    descricao: "Trabalhos realizados em câmaras frigoríficas e similares.",
    tipo: "qualitativo",
    grauInsalubridade: ["Médio (20%)"],
    agentes: [
      { id: "frio", nome: "Frio", grau: "Médio (20%)" },
    ],
  },
  {
    numero: 10,
    titulo: "Umidade",
    descricao: "Trabalhos realizados em locais alagados ou encharcados.",
    tipo: "qualitativo",
    grauInsalubridade: ["Médio (20%)"],
    agentes: [
      { id: "umidade", nome: "Umidade", grau: "Médio (20%)" },
    ],
  },
  {
    numero: 11,
    titulo: "Agentes Químicos - Limites de Tolerância",
    descricao:
      "Tabela de limites de tolerância para agentes químicos com valores de concentração máxima.",
    tipo: "quantitativo",
    grauInsalubridade: ["Mínimo (10%)", "Médio (20%)", "Máximo (40%)"],
    agentes: [
      { id: "benzeno", nome: "Benzeno", limiteToleranciaTWA: "1 ppm", limiteToleranciaSTEL: "2,5 ppm", unidade: "ppm", grau: "Máximo (40%)" },
      { id: "tolueno", nome: "Tolueno", limiteToleranciaTWA: "78 ppm", limiteToleranciaSTEL: "156 ppm", unidade: "ppm", grau: "Médio (20%)" },
      { id: "xileno", nome: "Xileno", limiteToleranciaTWA: "78 ppm", limiteToleranciaSTEL: "156 ppm", unidade: "ppm", grau: "Médio (20%)" },
      { id: "amonia", nome: "Amônia", limiteToleranciaTWA: "20 ppm", limiteToleranciaSTEL: "30 ppm", unidade: "ppm", grau: "Médio (20%)" },
      { id: "cloro", nome: "Cloro", limiteToleranciaTWA: "0,8 ppm", limiteToleranciaSTEL: "1 ppm", unidade: "ppm", grau: "Máximo (40%)" },
      { id: "formaldeido", nome: "Formaldeído", limiteToleranciaTWA: "1,6 ppm", limiteToleranciaSTEL: "2,4 ppm", unidade: "ppm", grau: "Máximo (40%)" },
      { id: "acido-sulfurico", nome: "Ácido Sulfúrico", limiteToleranciaTWA: "1 mg/m3", unidade: "mg/m3", grau: "Médio (20%)" },
    ],
  },
  {
    numero: 12,
    titulo: "Poeiras Minerais - Asbesto",
    descricao:
      "Limites de tolerância para poeiras minerais contendo asbesto (amianto).",
    tipo: "quantitativo",
    grauInsalubridade: ["Máximo (40%)"],
    agentes: [
      { id: "asbesto", nome: "Asbesto (Amianto)", limiteToleranciaTWA: "2,0 f/cm3", unidade: "f/cm3", grau: "Máximo (40%)" },
    ],
  },
  {
    numero: 13,
    titulo: "Agentes Químicos (Avaliação Qualitativa)",
    descricao:
      "Lista de agentes químicos cuja insalubridade é caracterizada por avaliação qualitativa (manipulação, contato).",
    tipo: "qualitativo",
    grauInsalubridade: ["Mínimo (10%)", "Médio (20%)", "Máximo (40%)"],
    agentes: [
      { id: "arsenio", nome: "Arsênio e compostos", grau: "Máximo (40%)" },
      { id: "chumbo", nome: "Chumbo e compostos", grau: "Máximo (40%)" },
      { id: "cromo", nome: "Cromo e compostos", grau: "Máximo (40%)" },
      { id: "fosforo", nome: "Fósforo e compostos", grau: "Máximo (40%)" },
      { id: "mercurio", nome: "Mercúrio e compostos", grau: "Máximo (40%)" },
      { id: "silicatos", nome: "Silicatos", grau: "Médio (20%)" },
    ],
  },
  {
    numero: 14,
    titulo: "Agentes Biológicos",
    descricao:
      "Relação de atividades que envolvem agentes biológicos, com classificação por grau de insalubridade.",
    tipo: "qualitativo",
    grauInsalubridade: ["Médio (20%)", "Máximo (40%)"],
    agentes: [
      { id: "bio-hospitais", nome: "Hospitais, serviços de emergência, enfermarias", grau: "Médio (20%)" },
      { id: "bio-esgotos", nome: "Esgotos (galerias e tanques)", grau: "Máximo (40%)" },
      { id: "bio-lixo", nome: "Lixo urbano (coleta e industrialização)", grau: "Máximo (40%)" },
      { id: "bio-laboratorio", nome: "Laboratórios de análises clínicas e histopatologia", grau: "Médio (20%)" },
      { id: "bio-cemiterios", nome: "Cemitérios (exumação de corpos)", grau: "Máximo (40%)" },
      { id: "bio-estabulos", nome: "Estábulos e cavalariças", grau: "Médio (20%)" },
      { id: "bio-gleba", nome: "Gleba (trabalho com lixo urbano)", grau: "Máximo (40%)" },
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
    label: "Físicos",
    anexos: [1, 2, 3, 5, 6, 7, 8, 9, 10],
    cor: "text-primary",
    bgCor: "bg-primary/10",
  },
  {
    id: "quimicos",
    label: "Químicos",
    anexos: [11, 12, 13],
    cor: "text-amber-600",
    bgCor: "bg-amber-600/10",
  },
  {
    id: "biologicos",
    label: "Biológicos",
    anexos: [14],
    cor: "text-emerald-600",
    bgCor: "bg-emerald-600/10",
  },
] as const
