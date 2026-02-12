/**
 * Script para inicializar o template DOCX
 * Execute com: npm run init:template
 * 
 * Cria um arquivo DOCX básico com placeholders para o docxtemplater
 */

import PizZip from "pizzip"
import Docxtemplater from "docxtemplater"
import fs from "fs"
import path from "path"

/**
 * XML padrão do Word para criar um documento mínimo
 * Este é o conteúdo que vai dentro do document.xml do arquivo DOCX
 */
const WORD_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document 
  xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
  <w:body>
    <!-- CABEÇALHO -->
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
      </w:pPr>
      <w:r>
        <w:t>{titulo}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Tipo: {tipo}</w:t>
      </w:r>
    </w:p>

    <!-- DADOS DA INSPEÇÃO -->
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading2"/>
      </w:pPr>
      <w:r>
        <w:t>Dados da Inspeção</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Endereço: {endereco}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Responsável: {responsavel}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Data da Vistoria: {dataVistoria}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Data de Geração: {dataGeracao}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Status: {statusTexto}</w:t>
      </w:r>
    </w:p>

    <!-- OBSERVAÇÕES -->
    <w:p>
      <w:r>
        <w:t>Observações: {observacoes}</w:t>
      </w:r>
    </w:p>

    <!-- PARTICIPANTES -->
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading2"/>
      </w:pPr>
      <w:r>
        <w:t>Participantes ({totalParticipantes})</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:rPr>
          <w:b/>
        </w:rPr>
        <w:t>{participantes}</w:t>
      </w:r>
    </w:p>

    <!-- NR-15 -->
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading2"/>
      </w:pPr>
      <w:r>
        <w:t>Avaliação NR-15 - Insalubridade</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Setores Avaliados: {setoresAvaliados}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Descrição de Atividades: {descricaoAtividades}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>EPCs Identificados: {epcsIdentificados}</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Observações NR-15: {nr15Observacoes}</w:t>
      </w:r>
    </w:p>

    <!-- RODAPÉ -->
    <w:p/>
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Normal"/>
        <w:spacing w:before="240"/>
      </w:pPr>
      <w:r>
        <w:t>Documento gerado automaticamente pelo sistema de vistorias.</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>Status: {status}</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`

/**
 * Cria um arquivo DOCX vazio usando PizZip
 * 
 * Estrutura de um DOCX:
 * - É um arquivo ZIP
 * - Contém _rels/.rels (relacionamentos)
 * - Contém word/document.xml (conteúdo)
 * - Contém word/styles.xml (estilos)
 * - Contém [Content_Types].xml (tipos)
 */
function criarTemplatoDOCX(): Buffer {
  // Criar um novo ZIP vazio
  const zip = new PizZip()

  // Adicionar arquivo de tipos ([Content_Types].xml)
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

  // Adicionar relacionamentos (_rels/.rels)
  zip.folder("_rels")
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
  )

  // Adicionar document.xml (conteúdo do documento)
  // Usar docxtemplater para garantir compatibilidade
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  })

  // Adicionar o XML do documento (já com placeholders)
  zip.file("word/document.xml", WORD_XML)

  // Adicionar estilos básicos (word/styles.xml)
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
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="Heading 1"/>
    <w:pPr>
      <w:sz w:val="32"/>
      <w:szCs w:val="32"/>
      <w:b/>
    </w:pPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="Heading 2"/>
    <w:pPr>
      <w:sz w:val="28"/>
      <w:szCs w:val="28"/>
      <w:b/>
    </w:pPr>
  </w:style>
</w:styles>`
  )

  // Adicionar relacionamentos do word (_rels/document.xml.rels)
  zip.folder("word/_rels")
  zip.file(
    "word/_rels/document.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
  )

  // Gerar o ZIP como buffer
  return zip.generate({ type: "nodebuffer" })
}

/**
 * Função principal que executa a inicialização
 */
async function inicializar() {
  try {
    // Criar diretório se não existir
    const templatesDir = path.join(process.cwd(), "public", "templates")
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true })
      console.log(`✓ Diretório criado: ${templatesDir}`)
    }

    // Criar arquivo DOCX
    const templatePath = path.join(templatesDir, "vistoria-template.docx")
    const buffer = criarTemplatoDOCX()
    fs.writeFileSync(templatePath, buffer)
    console.log(`✓ Template criado: ${templatePath}`)
    console.log(`  Tamanho: ${(buffer.length / 1024).toFixed(2)} KB`)

    console.log("\n✓ Inicialização concluída com sucesso!")
    console.log("  Use 'npm run dev' para testar a aplicação")
  } catch (erro) {
    console.error("✗ Erro ao iniciar template:", erro)
    process.exit(1)
  }
}

// Executar inicialização
inicializar()
