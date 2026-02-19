const PizZip = require('pizzip');
const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, '..', 'public', 'templates', 'vistoria-template.docx');

try {
  const content = fs.readFileSync(templatePath, 'binary');
  const zip = new PizZip(content);
  const doc = zip.file('word/document.xml');
  
  if (!doc) {
    console.log('❌ document.xml não encontrado');
    process.exit(1);
  }
  
  let xml = doc.asText();
  
  console.log('🔍 Analisando estrutura do loop de assinaturas...\n');
  
  // Encontrar {#assinaturas}
  const startIdx = xml.indexOf('{#assinaturas}');
  if (startIdx === -1) {
    console.log('❌ {#assinaturas} não encontrado no template');
    process.exit(1);
  }
  
  console.log('✅ Encontrado {#assinaturas} na posição', startIdx);
  
  // Verificar se já tem {/assinaturas}
  const endIdx = xml.indexOf('{/assinaturas}', startIdx);
  if (endIdx !== -1) {
    console.log('✅ {/assinaturas} já existe na posição', endIdx);
    
    // Extrair conteúdo do loop
    const loopContent = xml.substring(startIdx, endIdx + '{/assinaturas}'.length);
    const placeholders = loopContent.match(/\{[#%\/]?[\w]+\}/g) || [];
    console.log('\n📝 Placeholders no loop:', placeholders.join(', '));
    
    if (placeholders.includes('{%assinatura}')) {
      console.log('✅ Loop está correto, tem todos os placeholders necessários');
    } else {
      console.log('⚠️  Loop NÃO tem {%assinatura}');
    }
    
    process.exit(0);
  }
  
  console.log('❌ {/assinaturas} NÃO encontrado, precisa adicionar\n');
  
  // Extrair uma amostra maior após {#assinaturas}
  const sample = xml.substring(startIdx, startIdx + 2000);
  
  // Encontrar todos os placeholders após {#assinaturas}
  const placeholders = sample.match(/\{[#%\/]?[\w]+\}/g) || [];
  console.log('📋 Placeholders encontrados após {#assinaturas}:');
  console.log(placeholders.slice(0, 20).join(', '));
  
  // Procurar onde está {%assinatura}
  const assinaturaIdx = xml.indexOf('{%assinatura}', startIdx);
  if (assinaturaIdx === -1) {
    console.log('\n❌ {%assinatura} não encontrado após {#assinaturas}');
    console.log('   Não é possível corrigir automaticamente.');
    console.log('   Por favor, adicione manualmente no Word:');
    console.log('   1. Abra o template');
    console.log('   2. Encontre {#assinaturas}');
    console.log('   3. Adicione {%assinatura} para a imagem');
    console.log('   4. Adicione {/assinaturas} para fechar o loop');
    process.exit(1);
  }
  
  console.log(`\n✅ {%assinatura} encontrado na posição ${assinaturaIdx}`);
  
  // Encontrar o próximo parágrafo XML após {%assinatura}
  // No XML do Word, parágrafos são delimitados por <w:p>...</w:p>
  const afterAssinatura = xml.substring(assinaturaIdx + '{%assinatura}'.length);
  
  // Procurar o fim do parágrafo atual ou o próximo placeholder
  const nextParagraphEnd = afterAssinatura.search(/<\/w:p>/);
  const nextPlaceholder = afterAssinatura.search(/\{[#\/]/);
  
  let insertPosition = assinaturaIdx + '{%assinatura}'.length;
  
  // Se encontrou fim de parágrafo antes do próximo placeholder, inserir antes do </w:p>
  if (nextParagraphEnd !== -1 && (nextPlaceholder === -1 || nextParagraphEnd < nextPlaceholder)) {
    insertPosition = assinaturaIdx + '{%assinatura}'.length + nextParagraphEnd;
    console.log(`📍 Inserindo {/assinaturas} antes de </w:p> na posição ${insertPosition}`);
  } else {
    // Caso contrário, inserir logo após {%assinatura}
    console.log(`📍 Inserindo {/assinaturas} imediatamente após {%assinatura}`);
  }
  
  // Fazer a inserção
  const newXml = xml.substring(0, insertPosition) + '{/assinaturas}' + xml.substring(insertPosition);
  
  // Salvar
  zip.file('word/document.xml', newXml);
  const buf = zip.generate({ type: 'nodebuffer' });
  
  // Fazer backup antes de salvar
  const backupPath = templatePath.replace('.docx', '-before-fix.docx');
  fs.copyFileSync(templatePath, backupPath);
  console.log(`💾 Backup salvo em: ${backupPath}`);
  
  fs.writeFileSync(templatePath, buf);
  console.log('\n✅ Template corrigido com sucesso!');
  console.log('   {/assinaturas} adicionado na posição correta');
  
} catch (error) {
  console.error('❌ Erro:', error.message);
  console.error(error.stack);
  process.exit(1);
}
