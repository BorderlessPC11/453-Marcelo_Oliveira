"use client"

import type {
  Inspection,
  Participant,
  InspectionPhoto,
  VoiceNote,
  HistoryEntry,
} from "./types"

const STORAGE_KEY = "vistorias-app-data"

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

function loadInspections(): Inspection[] {
  if (typeof window === "undefined") return []
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveInspections(inspections: Inspection[]): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inspections))
}

function addHistoryEntry(
  inspection: Inspection,
  acao: string,
  campo?: string
): void {
  if (!inspection.historico) inspection.historico = []
  inspection.historico.unshift({
    id: generateId(),
    acao,
    campo,
    timestamp: new Date().toISOString(),
  })
  // Keep last 100 entries
  if (inspection.historico.length > 100) {
    inspection.historico = inspection.historico.slice(0, 100)
  }
}

export function getInspections(): Inspection[] {
  return loadInspections()
}

export function getInspection(id: string): Inspection | undefined {
  return loadInspections().find((i) => i.id === id)
}

export function createInspection(
  data: Omit<Inspection, "id" | "participantes" | "criadoEm" | "atualizadoEm" | "status">
): Inspection {
  const now = new Date().toISOString()
  const inspection: Inspection = {
    ...data,
    id: generateId(),
    status: "rascunho",
    participantes: [],
    fotos: [],
    notasVoz: [],
    historico: [],
    criadoEm: now,
    atualizadoEm: now,
  }
  addHistoryEntry(inspection, "Vistoria criada")
  const inspections = loadInspections()
  inspections.unshift(inspection)
  saveInspections(inspections)
  return inspection
}

export function updateInspection(id: string, data: Partial<Inspection>): Inspection | undefined {
  const inspections = loadInspections()
  const index = inspections.findIndex((i) => i.id === id)
  if (index === -1) return undefined

  const oldStatus = inspections[index].status
  inspections[index] = {
    ...inspections[index],
    ...data,
    atualizadoEm: new Date().toISOString(),
  }

  if (data.status && data.status !== oldStatus) {
    addHistoryEntry(inspections[index], `Status alterado para "${data.status}"`, "status")
  }

  saveInspections(inspections)
  return inspections[index]
}

export function deleteInspection(id: string): boolean {
  const inspections = loadInspections()
  const filtered = inspections.filter((i) => i.id !== id)
  if (filtered.length === inspections.length) return false
  saveInspections(filtered)
  return true
}

// --- Participants ---

export function addParticipant(
  inspectionId: string,
  data: Omit<Participant, "id">
): Participant | undefined {
  const inspections = loadInspections()
  const index = inspections.findIndex((i) => i.id === inspectionId)
  if (index === -1) return undefined
  const participant: Participant = { ...data, id: generateId() }
  inspections[index].participantes.push(participant)
  inspections[index].atualizadoEm = new Date().toISOString()
  addHistoryEntry(inspections[index], `Participante "${data.nome}" adicionado`, "participantes")
  saveInspections(inspections)
  return participant
}

export function updateParticipantSignature(
  inspectionId: string,
  participantId: string,
  assinatura: string
): boolean {
  const inspections = loadInspections()
  const inspection = inspections.find((i) => i.id === inspectionId)
  if (!inspection) return false
  const participant = inspection.participantes.find((p) => p.id === participantId)
  if (!participant) return false
  participant.assinatura = assinatura
  inspection.atualizadoEm = new Date().toISOString()
  addHistoryEntry(inspection, `Assinatura coletada de "${participant.nome}"`, "assinaturas")
  saveInspections(inspections)
  return true
}

export function removeParticipant(inspectionId: string, participantId: string): boolean {
  const inspections = loadInspections()
  const inspection = inspections.find((i) => i.id === inspectionId)
  if (!inspection) return false
  const participant = inspection.participantes.find((p) => p.id === participantId)
  const nome = participant?.nome || "Desconhecido"
  inspection.participantes = inspection.participantes.filter((p) => p.id !== participantId)
  inspection.atualizadoEm = new Date().toISOString()
  addHistoryEntry(inspection, `Participante "${nome}" removido`, "participantes")
  saveInspections(inspections)
  return true
}

// --- NR-15 ---

export function updateInspectionNR15(
  id: string,
  data: Pick<Inspection, "avaliacoesNR15" | "nr15Observacoes" | "setoresAvaliados" | "descricaoAtividades" | "epcsIdentificados">
): Inspection | undefined {
  const inspections = loadInspections()
  const index = inspections.findIndex((i) => i.id === id)
  if (index === -1) return undefined
  inspections[index] = {
    ...inspections[index],
    ...data,
    atualizadoEm: new Date().toISOString(),
  }
  saveInspections(inspections)
  return inspections[index]
}

// --- Photos ---

export function addPhoto(
  inspectionId: string,
  photo: Omit<InspectionPhoto, "id" | "criadoEm">
): InspectionPhoto | undefined {
  const inspections = loadInspections()
  const index = inspections.findIndex((i) => i.id === inspectionId)
  if (index === -1) return undefined
  if (!inspections[index].fotos) inspections[index].fotos = []
  const newPhoto: InspectionPhoto = {
    ...photo,
    id: generateId(),
    criadoEm: new Date().toISOString(),
  }
  inspections[index].fotos!.push(newPhoto)
  inspections[index].atualizadoEm = new Date().toISOString()
  addHistoryEntry(
    inspections[index],
    `Foto adicionada${photo.legenda ? `: "${photo.legenda}"` : ""}`,
    "fotos"
  )
  saveInspections(inspections)
  return newPhoto
}

export function updatePhotoCaption(
  inspectionId: string,
  photoId: string,
  legenda: string
): boolean {
  const inspections = loadInspections()
  const inspection = inspections.find((i) => i.id === inspectionId)
  if (!inspection || !inspection.fotos) return false
  const photo = inspection.fotos.find((p) => p.id === photoId)
  if (!photo) return false
  photo.legenda = legenda
  inspection.atualizadoEm = new Date().toISOString()
  saveInspections(inspections)
  return true
}

export function removePhoto(inspectionId: string, photoId: string): boolean {
  const inspections = loadInspections()
  const inspection = inspections.find((i) => i.id === inspectionId)
  if (!inspection || !inspection.fotos) return false
  inspection.fotos = inspection.fotos.filter((p) => p.id !== photoId)
  inspection.atualizadoEm = new Date().toISOString()
  addHistoryEntry(inspection, "Foto removida", "fotos")
  saveInspections(inspections)
  return true
}

// --- Voice Notes ---

export function addVoiceNote(
  inspectionId: string,
  note: Omit<VoiceNote, "id" | "criadoEm">
): VoiceNote | undefined {
  const inspections = loadInspections()
  const index = inspections.findIndex((i) => i.id === inspectionId)
  if (index === -1) return undefined
  if (!inspections[index].notasVoz) inspections[index].notasVoz = []
  const newNote: VoiceNote = {
    ...note,
    id: generateId(),
    criadoEm: new Date().toISOString(),
  }
  inspections[index].notasVoz!.push(newNote)
  inspections[index].atualizadoEm = new Date().toISOString()
  addHistoryEntry(inspections[index], `Nota de voz adicionada (${note.campo})`, "voz")
  saveInspections(inspections)
  return newNote
}

export function updateVoiceTranscription(
  inspectionId: string,
  noteId: string,
  transcricao: string
): boolean {
  const inspections = loadInspections()
  const inspection = inspections.find((i) => i.id === inspectionId)
  if (!inspection || !inspection.notasVoz) return false
  const note = inspection.notasVoz.find((n) => n.id === noteId)
  if (!note) return false
  note.transcricao = transcricao
  inspection.atualizadoEm = new Date().toISOString()
  saveInspections(inspections)
  return true
}

export function removeVoiceNote(inspectionId: string, noteId: string): boolean {
  const inspections = loadInspections()
  const inspection = inspections.find((i) => i.id === inspectionId)
  if (!inspection || !inspection.notasVoz) return false
  inspection.notasVoz = inspection.notasVoz.filter((n) => n.id !== noteId)
  inspection.atualizadoEm = new Date().toISOString()
  addHistoryEntry(inspection, "Nota de voz removida", "voz")
  saveInspections(inspections)
  return true
}

// --- Duplicate ---

export function duplicateInspection(id: string): Inspection | undefined {
  const inspections = loadInspections()
  const original = inspections.find((i) => i.id === id)
  if (!original) return undefined

  const now = new Date().toISOString()
  const duplicate: Inspection = {
    ...original,
    id: generateId(),
    titulo: `${original.titulo} (Copia)`,
    status: "rascunho",
    participantes: original.participantes.map((p) => ({
      ...p,
      id: generateId(),
      assinatura: undefined,
    })),
    fotos: [],
    notasVoz: [],
    historico: [],
    criadoEm: now,
    atualizadoEm: now,
    duplicadoDe: original.id,
    // Reset NR-15 evaluations to unevaluated but keep structure
    avaliacoesNR15: original.avaliacoesNR15?.map((a) => ({
      ...a,
      aplica: null,
      agentesAvaliados: a.agentesAvaliados.map((ag) => ({
        ...ag,
        identificado: false,
        valorMedido: "",
        acimaDoLimite: null,
        epiFornecido: false,
        epiUtilizado: false,
        descricaoEPI: "",
        observacoes: "",
      })),
      localAvaliacao: a.localAvaliacao,
      atividadesDescritas: "",
      episUtilizados: "",
      medicoes: "",
      tempoExposicao: "",
      conclusao: "",
      observacoes: "",
    })),
  }

  addHistoryEntry(duplicate, `Duplicada a partir de "${original.titulo}"`)
  addHistoryEntry(original, `Duplicada como "${duplicate.titulo}"`)

  inspections.unshift(duplicate)
  saveInspections(inspections)
  return duplicate
}
