/**
 * Script para verificar se o template DOCX tem os placeholders corretos
 * Uso: npx ts-node scripts/check-template.ts
 */

import fs from "fs"
import path from "path"
import PizZip from "pizzip"

const templatePath = path.join(
  process.cwd(),
  "public/templates/vistoria-template.docx"
)

console.log("🔍 Analisando template DOCX...\n")

// Verificar se arquivo existe
if (!fs.existsSync(templatePath)) {
  console.error("❌ Arquivo não encontrado:", templatePath)
  console.log("\n📝 Você precisa criar o template manualmente:")
  console.log("1. Abra Microsoft Word ou LibreOffice")
  console.log("2. Crie um documento com os placeholders:")
  console.log("   - {titulo}")
  console.log("   - {tipo}")
  console.log("   - {endereco}")
  console.log("   - {responsavel}")
  console.log("   - {dataVistoria}")
  console.log("   - {dataGeracao}")
  console.log("   - {observacoes}")
  console.log("   - {participantes}")
  console.log("   - {totalParticipantes}")
  console.log("   - {setoresAvaliados}")
  console.log("   - {descricaoAtividades}")
  console.log("   - {epcsIdentificados}")
  console.log("   - {nr15Observacoes}")
  console.log("   - {status}")
  console.log("   - {statusTexto}")
  console.log("3. Salve como 'vistoria-template.docx'")
  console.log("4. Coloque em /public/templates/\n")
  process.exit(1)
}

try {
  // Ler o arquivo DOCX (que é um ZIP)
  const buffer = fs.readFileSync(templatePath)
  const zip = new PizZip(buffer)

  // Listar arquivos dentro do ZIP
  console.log("📦 Arquivos encontrados no DOCX:")
  Object.keys(zip.files).forEach((file) => {
    if (file.includes("document.xml")) {
      console.log(`  ✓ ${file} (documento principal)`)
    }
  })

  // Extrair e mostrar conteúdo principal
  const docXml = zip.file("word/document.xml")
  if (!docXml) {
    console.error("\n❌ Não é um DOCX válido (falta word/document.xml)")
    process.exit(1)
  }

  const content = docXml.asText()

  // Procurar placeholders
  const placeholderRegex = /\{\{?([a-zA-Z_][a-zA-Z0-9_]*)\}?\}/g
  const matches = Array.from(content.matchAll(placeholderRegex))
  const placeholders = [...new Set(matches.map((m) => m[1]))]

  console.log("\n✨ Placeholders encontrados no template:")
  if (placeholders.length === 0) {
    console.warn("⚠️  Nenhum placeholder encontrado!")
  } else {
    placeholders.forEach((ph) => {
      console.log(`  • {${ph}}`)
    })
  }

  // Lista de placeholders esperados
  const expected = [
    "titulo",
    "tipo",
    "endereco",
    "responsavel",
    "dataVistoria",
    "dataGeracao",
    "observacoes",
    "participantes",
    "totalParticipantes",
    "setoresAvaliados",
    "descricaoAtividades",
    "epcsIdentificados",
    "nr15Observacoes",
    "status",
    "statusTexto",
  ]

  console.log("\n🔍 Verificação de completude:")
  const found = new Set(placeholders)
  let allFound = true

  expected.forEach((ph) => {
    if (found.has(ph)) {
      console.log(`  ✅ {${ph}}`)
    } else {
      console.log(`  ❌ {${ph}} - FALTA ADICIONAR`)
      allFound = false
    }
  })

  // Verificar extras
  const extras = placeholders.filter((ph) => !expected.includes(ph))
  if (extras.length > 0) {
    console.log("\n⚠️  Placeholders extras encontrados:")
    extras.forEach((ph) => {
      console.log(`  • {${ph}} (não será utilizado)`)
    })
  }

  if (allFound) {
    console.log("\n✅ Template está completo e pronto para usar!")
  } else {
    console.log("\n❌ Template incompleto. Adicione os placeholders faltantes.")
  }
} catch (erro) {
  console.error("❌ Erro ao analisar template:", erro)
  process.exit(1)
}
