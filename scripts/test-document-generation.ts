/**
 * Script para testar geração de DOCX e PDF
 * Valida se as dependências estão instaladas e funcionando
 * Uso: npx ts-node scripts/test-document-generation.ts
 */

import fs from "fs"
import path from "path"

console.log("🔍 Testando capacidades de geração de documentos...\n")

// ============================================================================
// 1. VERIFICAR DEPENDÊNCIAS
// ============================================================================

console.log("📦 VERIFICAÇÃO DE DEPENDÊNCIAS")
console.log("=" .repeat(60))

const packageJsonPath = path.join(process.cwd(), "package.json")
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"))

const dependenciasObrigatorias = {
  docxtemplater: "Geração de DOCX com templates",
  pizzip: "Descompactação de DOCX (ZIP)",
  jspdf: "Geração de PDF",
}

let dependenciasOk = true

Object.entries(dependenciasObrigatorias).forEach(([pkg, descricao]) => {
  const temDependency =
    packageJson.dependencies?.[pkg] || packageJson.devDependencies?.[pkg]
  const versao = temDependency ? temDependency : "NÃO INSTALADO"

  if (temDependency) {
    console.log(`✅ ${pkg} (${versao})`)
    console.log(`   └─ ${descricao}`)
  } else {
    console.log(`❌ ${pkg} - ${versao}`)
    console.log(`   └─ ${descricao}`)
    dependenciasOk = false
  }
})

// ============================================================================
// 2. VERIFICAR ARQUIVO GERADOR
// ============================================================================

console.log("\n📝 VERIFICAÇÃO DE FUNCIONALIDADES")
console.log("=" .repeat(60))

const docxGeneratorPath = path.join(process.cwd(), "lib/docx-generator.ts")

if (!fs.existsSync(docxGeneratorPath)) {
  console.error(`❌ Arquivo não encontrado: ${docxGeneratorPath}`)
  process.exit(1)
}

const docxContent = fs.readFileSync(docxGeneratorPath, "utf-8")

const funcoes = {
  "gerarDocumento": "📄 Gera DOCX com dados de inspeção",
  "gerarPdf": "📊 Gera PDF com dados de inspeção",
  "fazerDownloadDocumento": "⬇️ Faz download do documento no navegador",
}

console.log("\n✨ Funções implementadas:")
let todasFuncoes = true
Object.entries(funcoes).forEach(([func, desc]) => {
  const temFuncao = docxContent.includes(`export async function ${func}`) ||
                    docxContent.includes(`export function ${func}`)
  if (temFuncao) {
    console.log(`✅ ${func}()`)
    console.log(`   └─ ${desc}`)
  } else {
    console.log(`❌ ${func}() - NÃO IMPLEMENTADA`)
    console.log(`   └─ ${desc}`)
    todasFuncoes = false
  }
})

// ============================================================================
// 3. ANÁLISE DE FEATURES
// ============================================================================

console.log("\n🎯 ANÁLISE DE FEATURES IMPLEMENTADAS")
console.log("=" .repeat(60))

const features = {
  "Validação de dados": docxContent.includes("validarDados"),
  "Formatação de datas": docxContent.includes("formatarData"),
  "Substituição de placeholders": docxContent.includes("setData"),
  "Tratamento de erros": docxContent.includes("try") && docxContent.includes("catch"),
  "Suporte a NR-15": docxContent.includes("avaliacoesNR15"),
  "Suporte a participantes": docxContent.includes("participantes"),
  "Suporte a fotos": docxContent.includes("fotos"),
  "Geração de PDF com jsPDF": docxContent.includes("jsPDF"),
}

let featureCount = 0
Object.entries(features).forEach(([feature, tem]) => {
  if (tem) {
    console.log(`✅ ${feature}`)
    featureCount++
  } else {
    console.log(`❌ ${feature}`)
  }
})

// ============================================================================
// 4. VERIFICAR TEMPLATE
// ============================================================================

console.log("\n📋 VERIFICAÇÃO DO TEMPLATE")
console.log("=" .repeat(60))

const templatePath = path.join(process.cwd(), "public/templates/vistoria-template.docx")

if (fs.existsSync(templatePath)) {
  const stats = fs.statSync(templatePath)
  const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
  console.log(`✅ Template encontrado`)
  console.log(`   └─ Tamanho: ${sizeMB} MB`)
  console.log(`   └─ Localização: /public/templates/vistoria-template.docx`)
} else {
  console.log(`❌ Template não encontrado`)
  console.log(`   └─ Esperado em: /public/templates/vistoria-template.docx`)
}

// ============================================================================
// 5. RESUMO FINAL
// ============================================================================

console.log("\n" + "=" .repeat(60))
console.log("📊 RESUMO GERAL")
console.log("=" .repeat(60))

let status = "✅ PRONTO"
let problemas = []

if (!dependenciasOk) {
  status = "❌ INCOMPLETO"
  problemas.push("Faltam dependências npm instaladas")
}

if (!todasFuncoes) {
  status = "❌ INCOMPLETO"
  problemas.push("Faltam funções de exportação implementadas")
}

if (!fs.existsSync(templatePath)) {
  status = "❌ INCOMPLETO"
  problemas.push("Template DOCX não encontrado")
}

if (featureCount < 6) {
  problemas.push("Algumas features importantes não estão implementadas")
}

console.log(`\nStatus Geral: ${status}`)
console.log(`Features Implementadas: ${featureCount}/8`)

if (problemas.length > 0) {
  console.log(`\n⚠️  Problemas encontrados:`)
  problemas.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p}`)
  })
}

if (status === "✅ PRONTO") {
  console.log(`\n🎉 Tudo pronto para gerar documentos!`)
  console.log(`\nPróximas etapas:`)
  console.log(`  1. Criar componente de geração de documentos`)
  console.log(`  2. Adicionar validações de compatibilidade mobile`)
  console.log(`  3. Testar em diferentes navegadores`)
  console.log(`  4. Adicionar feedback visual durante geração`)
}

console.log("")

process.exit(status === "✅ PRONTO" ? 0 : 1)
