import type { AvaliacaoNR15 } from "./nr15-data"

export type InspectionStatus = "rascunho" | "em_andamento" | "concluida"

export interface Participant {
  id: string
  nome: string
  cargo: string
  empresa: string
  email: string
  assinatura?: string // base64 data URL
}

export interface InspectionPhoto {
  id: string
  dataUrl: string // base64 data URL
  legenda: string
  criadoEm: string
  campo?: string // optional field association (e.g. "nr15-anexo-3", "geral")
}

export interface VoiceNote {
  id: string
  dataUrl: string // base64 audio data URL
  duracao: number // seconds
  transcricao: string
  campo: string // field this note is associated with
  criadoEm: string
}

export interface HistoryEntry {
  id: string
  acao: string // human-readable action description
  campo?: string
  timestamp: string
}

export interface Inspection {
  id: string
  titulo: string
  tipo: string
  endereco: string
  responsavel: string
  dataVistoria: string
  observacoes: string
  status: InspectionStatus
  participantes: Participant[]
  criadoEm: string
  atualizadoEm: string
  // NR-15 fields
  avaliacoesNR15?: AvaliacaoNR15[]
  nr15Observacoes?: string
  setoresAvaliados?: string
  descricaoAtividades?: string
  epcsIdentificados?: string
  // Media
  fotos?: InspectionPhoto[]
  notasVoz?: VoiceNote[]
  historico?: HistoryEntry[]
  // Duplication tracking
  duplicadoDe?: string // id of original inspection
}
